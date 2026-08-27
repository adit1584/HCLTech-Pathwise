import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import { connectDB } from './db.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';

// Route imports
import authRoutes from './routes/auth.routes.js';
import learnerRoutes from './routes/learner.routes.js';
import goalsRoutes from './routes/goals.routes.js';
import skillsRoutes from './routes/skills.routes.js';
import diagnosticRoutes from './routes/diagnostic.routes.js';
import pathRoutes from './routes/path.routes.js';
import recommendationsRoutes from './routes/recommendations.routes.js';
import progressRoutes from './routes/progress.routes.js';
import resourcesRoutes from './routes/resources.routes.js';
import assistantRoutes from './routes/assistant.routes.js';
import feedbackRoutes from './routes/feedback.routes.js';
import simulatorRoutes from './routes/simulator.routes.js';
import practiceRoutes from './routes/practice.routes.js';

const app = express();

// ── Middleware ───────────────────────────────────────────────

const allowedOrigins = config.clientUrl
  ? config.clientUrl.split(',').map(s => s.trim())
  : ['*'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes('*') ||
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.includes('localhost')
      ) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));

// Rate limiting for AI endpoints
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: { error: 'Too many requests. Please try again later.' },
});

// ── Routes ──────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/learner', learnerRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api/diagnostic', diagnosticRoutes);
app.use('/api/path', pathRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/resources', resourcesRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/simulator', simulatorRoutes);
app.use('/api/practice', practiceRoutes);

// AI-heavy endpoints get rate limiting
app.use('/api/assistant', aiLimiter);
app.use('/api/goals/interpret', aiLimiter);

// ── Error Handling ──────────────────────────────────────────

app.use(notFoundHandler);
app.use(errorHandler);

// ── Server Start ────────────────────────────────────────────

async function start() {
  await connectDB();

  app.listen(config.port, () => {
    console.log(`
╔══════════════════════════════════════════╗
║       PATHWISE API SERVER                ║
║                                          ║
║  Port:    ${config.port}                        ║
║  Env:     ${config.nodeEnv.padEnd(27)}║
║  MongoDB: Connected                      ║
╚══════════════════════════════════════════╝
    `);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export default app;
