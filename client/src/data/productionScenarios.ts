export interface ProductionScenario {
  id: string;
  title: string;
  severity: 'CRITICAL (SEV-1)' | 'HIGH (SEV-2)' | 'MEDIUM (SEV-3)';
  service: string;
  systemSummary: string;
  impactMetrics: {
    errorRate: string;
    p99Latency: string;
    cpuLoad: string;
    affectedUsers: string;
  };
  initialLogs: string[];
  diagnosticClues: {
    tab: 'logs' | 'metrics' | 'network';
    title: string;
    content: string;
  }[];
  options: {
    id: string;
    label: string;
    description: string;
    isCorrect: boolean;
    explanation: string;
    latencyImpact: string;
  }[];
  xpReward: number;
}

export const PRODUCTION_SCENARIOS: ProductionScenario[] = [
  {
    id: 'sev1-db-pool-exhaustion',
    title: 'PostgreSQL Connection Pool Starvation Under Flash Sale Traffic',
    severity: 'CRITICAL (SEV-1)',
    service: 'payment-gateway / order-service',
    systemSummary: 'During flash sale traffic of 18,000 req/s, API Gateway is rejecting 42% of checkout requests with HTTP 504 Gateway Timeout. Application pods are healthy, but database queries are queued indefinitely.',
    impactMetrics: {
      errorRate: '42.8%',
      p99Latency: '8,420 ms (Normal: 45 ms)',
      cpuLoad: '94% (DB Server)',
      affectedUsers: '34,200 users',
    },
    initialLogs: [
      '[ERROR] 17:42:01.102 [order-service-pod-4] pool-checkout: Timeout after 30000ms waiting for connection from HikariCP pool (active=50, idle=0, waiting=1240)',
      '[WARN]  17:42:01.215 [payment-service-pod-2] pg_stat_activity: max_connections limit reached (100/100 connections in state "idle in transaction")',
      '[ERROR] 17:42:01.350 [api-gateway] upstream request timeout: POST /api/v1/orders/checkout -> HTTP 504 (duration: 30.01s)',
      '[FATAL] 17:42:01.590 [order-service-pod-1] ConnectionAcquisitionException: Unable to acquire JDBC Connection',
    ],
    diagnosticClues: [
      {
        tab: 'logs',
        title: 'Application Server Logs',
        content: `SELECT * FROM pg_stat_activity WHERE state != 'idle';
- 84 queries stuck in "idle in transaction" for >45s originating from checkout webhook handlers without timeouts.
- HikariCP pool configured with maximumPoolSize=50 per pod across 12 pods (600 total connections requested, PostgreSQL configured max_connections=100).`,
      },
      {
        tab: 'metrics',
        title: 'Connection Pool & IOPS Metrics',
        content: `Active DB Connections: 100/100 (Max Capacity Reached)
Connection Queue Depth: 2,410 waiting requests
DB Server CPU: 94% (Context Switching & Lock Contention)
Disk Read IOPS: 12,400 IOPS`,
      },
      {
        tab: 'network',
        title: 'Connection Handshake Trace',
        content: `TCP SYNs queuing on PostgreSQL port 5432. TCP socket backlogs overflowing. Pods retry indefinitely without exponential backoff jitter, causing thundering herd.`,
      },
    ],
    options: [
      {
        id: 'opt-1',
        label: 'A) Restart all 12 order-service application pods immediately',
        description: 'Terminate all pods to kill active connections and force a fresh restart.',
        isCorrect: false,
        explanation: 'Fails! Restarting 12 pods simultaneously causes an immediate thundering herd of 12 new pool handshakes on PostgreSQL, crashing the database engine completely.',
        latencyImpact: '+15,000ms (Total Outage)',
      },
      {
        id: 'opt-2',
        label: 'B) Deploy PgBouncer connection pooling layer + enforce 3s transaction timeout and exponential backoff',
        description: 'Introduce multiplexed transaction-mode connection pooling (PgBouncer) between pods and PostgreSQL, while adding statement timeouts.',
        isCorrect: true,
        explanation: 'Optimal Engineering Fix! PgBouncer multiplexes thousands of frontend clients over a small pool of 20 physical DB connections. Statement timeouts terminate abandoned transactions, restoring p99 latency to 38ms.',
        latencyImpact: 'Dropped from 8,420ms -> 38ms (✓ Resolved)',
      },
      {
        id: 'opt-3',
        label: 'C) Increase PostgreSQL max_connections from 100 to 5,000 in postgresql.conf',
        description: 'Allow unlimited client connections directly into the database server RAM.',
        isCorrect: false,
        explanation: 'Dangerous! PostgreSQL allocates ~10MB dedicated process memory per connection. 5,000 connections triggers Linux OOM-Killer, crashing the DB cluster.',
        latencyImpact: 'Kernel Panic / OOM Kill',
      },
    ],
    xpReward: 350,
  },
  {
    id: 'sev2-sql-unindexed-scan',
    title: 'Unindexed Filter Query Triggering Full Table Scan on 25M Row Table',
    severity: 'HIGH (SEV-2)',
    service: 'analytics-query-engine',
    systemSummary: 'Search latency on the user activity dashboard increased by 400x following a new feature release filtering user actions by created_at timestamp and tenant_id.',
    impactMetrics: {
      errorRate: '14.2%',
      p99Latency: '12,900 ms (Normal: 32 ms)',
      cpuLoad: '99% (Worker Nodes)',
      affectedUsers: '8,900 enterprise tenants',
    },
    initialLogs: [
      '[WARN] 18:10:04.221 [query-planner] EXPLAIN ANALYZE: Seq Scan on audit_events (cost=0.00..845120.40 rows=1840 width=128)',
      '[WARN] 18:10:04.450 [query-planner] Filter: ((tenant_id = 492) AND (created_at >= "2026-08-01"))',
      '[WARN] 18:10:04.890 [query-planner] Rows Removed by Filter: 24,980,120 rows examined sequentially from disk',
      '[ERROR] 18:10:05.101 [analytics-api] query execution duration 12.89s exceeded client timeout threshold (10.0s)',
    ],
    diagnosticClues: [
      {
        tab: 'logs',
        title: 'Query Plan (EXPLAIN ANALYZE)',
        content: `EXPLAIN ANALYZE SELECT * FROM audit_events WHERE tenant_id = $1 AND created_at >= $2 ORDER BY created_at DESC LIMIT 50;
-> Execution time: 12,891 ms
-> Plan: Sequential Scan over 25,000,000 tuples. Buffer hit=1240, read=489200 pages from SSD.`,
      },
      {
        tab: 'metrics',
        title: 'Disk Read Throughput',
        content: `Disk Read Bandwidth: 850 MB/s (SSD Saturation)
Buffer Cache Hit Ratio: 41% (Cache Thrashing due to full table scans)`,
      },
      {
        tab: 'network',
        title: 'Indexes Present on Table',
        content: `Existing Indexes:
- PRIMARY KEY (id)
- idx_audit_user_id (user_id)
(Missing composite index on tenant_id + created_at)`,
      },
    ],
    options: [
      {
        id: 'opt-1',
        label: 'A) Add pagination with LIMIT 50 and remove the date filter',
        description: 'Remove the created_at filter so the database does not have to filter dates.',
        isCorrect: false,
        explanation: 'Fails business requirements! The dashboard requires temporal filtering by date range.',
        latencyImpact: 'Broken Business Logic',
      },
      {
        id: 'opt-2',
        label: 'B) Create Composite B-Tree Index: CREATE INDEX CONCURRENTLY idx_audit_tenant_created ON audit_events (tenant_id, created_at DESC)',
        description: 'Index high-cardinality tenant_id together with sorted created_at timestamp using CONCURRENTLY to avoid table locking.',
        isCorrect: true,
        explanation: 'Mastery Level Fix! The composite index allows PostgreSQL to perform an Index Scan directly to the matching tenant rows and read only 50 sorted rows. Execution time drops from 12.8s to 1.4ms!',
        latencyImpact: 'Dropped from 12,900ms -> 1.4ms (✓ Resolved)',
      },
      {
        id: 'opt-3',
        label: 'C) Create separate single-column indexes on tenant_id and created_at independently',
        description: 'Create two standalone indexes and let PostgreSQL perform Bitmap Index Scan.',
        isCorrect: false,
        explanation: 'Suboptimal! Bitmap Index Scans combine two separate index bitmaps but cannot avoid a sort step for ORDER BY created_at DESC. Latency remains >450ms under heavy load.',
        latencyImpact: '480ms (Suboptimal)',
      },
    ],
    xpReward: 300,
  },
  {
    id: 'sev1-memory-leak-event-loop',
    title: 'Node.js Event Loop Lag & Memory Leak in Streaming API',
    severity: 'CRITICAL (SEV-1)',
    service: 'realtime-notification-hub',
    systemSummary: 'Node.js WebSocket cluster pods are crashing every 25 minutes with JavaScript heap out of memory. Event Loop Delay spikes to 4,200ms before pod crash.',
    impactMetrics: {
      errorRate: '28.5%',
      p99Latency: '4,200 ms Event Loop Lag',
      cpuLoad: '100% (Single Thread V8)',
      affectedUsers: '52,000 WebSocket connections',
    },
    initialLogs: [
      '[ERROR] 18:30:12.100 [realtime-pod-3] <--- Last few GCs ---> [4210:0x524000] 1420100 ms: Mark-sweep 2046.2 (2052.1) -> 2045.8 (2052.1) MB, 1420.2 / 0.0 ms',
      '[FATAL] 18:30:12.105 [realtime-pod-3] <--- JS stacktrace ---> FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory',
      '[WARN]  18:30:12.200 [k8s-node] Pod realtime-pod-3 terminated with OOMKilled (Exit Code 137). Restarting...',
    ],
    diagnosticClues: [
      {
        tab: 'logs',
        title: 'V8 Heap Snapshot Analysis',
        content: `Heap Profiler Snapshot reveals 1,420,000 Closure objects retaining references to EventEmitter listeners:
\`socket.on('data', (chunk) => { buffer.push(chunk); globalEmitter.on('broadcast', ...); })\`
EventListeners are added per message and never unsubscribed with removeListener() / abortSignal.`,
      },
      {
        tab: 'metrics',
        title: 'Node.js V8 Metrics',
        content: `Heap Used: 2,047 MB / 2,048 MB (Max V8 Heap Limit)
Event Loop Utilization: 99.8%
Garbage Collection Pause: 1,420 ms`,
      },
      {
        tab: 'network',
        title: 'WebSocket Disconnect Rate',
        content: `Cascading reconnect storms across all 8 pods as each pod crashes, overwhelming the load balancer.`,
      },
    ],
    options: [
      {
        id: 'opt-1',
        label: 'A) Increase Kubernetes pod memory limit from 2GB to 16GB in deployment.yaml',
        description: 'Provide more RAM so the process does not run out of memory.',
        isCorrect: false,
        explanation: 'Fails! Increasing memory only delays the crash from 25 minutes to 3 hours while making GC pause times worse (up to 8 seconds freeze). The root cause leak remains unaddressed.',
        latencyImpact: 'Temporary Delay, Worse GC Freezes',
      },
      {
        id: 'opt-2',
        label: 'B) Refactor EventListener registration to use AbortController / socket once-listeners and explicit cleanup on socket disconnect',
        description: 'Clean up listener references during socket teardown and use once-listeners or WeakRefs to allow V8 garbage collection.',
        isCorrect: true,
        explanation: 'Production Mastery Fix! Cleaning up event listener closures on disconnect prevents memory leaks. V8 Heap stabilizes at 140MB and Event Loop lag drops to <2ms.',
        latencyImpact: 'Event Loop Lag: 4,200ms -> 1.8ms (✓ Resolved)',
      },
      {
        id: 'opt-3',
        label: 'C) Set up a cron job to restart the Node.js process every 15 minutes',
        description: 'Periodically kill and restart the process before it reaches the 2GB heap limit.',
        isCorrect: false,
        explanation: 'Anti-pattern! Periodic restarts drop 50,000 active WebSocket connections every 15 minutes, causing constant reconnection spikes.',
        latencyImpact: 'Frequent Service Disruptions',
      },
    ],
    xpReward: 350,
  },
];
