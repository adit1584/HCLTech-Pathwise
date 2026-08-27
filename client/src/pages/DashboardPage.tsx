import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../stores/authContext';
import type {
  LearnerProfile,
  RoadmapItem,
  SkillGap,
  RecommendationTrace,
  RecompilationResult,
} from '../types';
import {
  ArrowRight,
  TrendingUp,
  Clock,
  Zap,
  Map,
  Sparkles,
  Unlock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Activity,
  Flame,
  Brain,
  RotateCcw,
  Target,
  Shuffle,
} from 'lucide-react';
import { RecommendationTraceModal } from '../components/RecommendationTraceModal';
import { MicroSparkModal } from '../components/MicroSparkModal';

// ── Score Ring SVG ────────────────────────────────────────────────────────
function ScoreRing({
  value,
  size = 72,
  strokeWidth = 6,
  color = 'var(--primary-400)',
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) {
  const r = (size - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;

  return (
    <svg width={size} height={size} className="rotate-[-90deg] shrink-0">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--border-dim)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1)' }}
      />
    </svg>
  );
}

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<LearnerProfile | null>(null);
  const [roadmap, setRoadmap] = useState<RoadmapItem[]>([]);
  const [recommendations, setRecommendations] = useState<SkillGap[]>([]);
  const [totalWeeks, setTotalWeeks] = useState<number>(0);
  const [selectedSkillForTrace, setSelectedSkillForTrace] = useState<string | null>(null);
  const [recompilationResult, setRecompilationResult] = useState<RecompilationResult | null>(null);
  const [isSparkOpen, setIsSparkOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Completed items state — synced with localStorage & roadmap
  const [completedItemIds, setCompletedItemIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('pathwise_completed_item_ids');
      if (!saved) return new Set();
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return new Set(
          parsed.filter((id: any) =>
            typeof id === 'string' &&
            id.trim().length > 3 &&
            id !== 'undefined' &&
            id !== 'null'
          )
        );
      }
      return new Set();
    } catch {
      return new Set();
    }
  });

  const loadDashboardData = async () => {
    try {
      // Re-read local storage on load
      const saved = localStorage.getItem('pathwise_completed_item_ids');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setCompletedItemIds(new Set(parsed.filter((id: any) => typeof id === 'string' && id.trim().length > 3)));
          }
        } catch { /* ignore */ }
      }

      setLoading(true);
      const [prof, recs, road] = await Promise.all([
        api.getProfile().catch(() => null),
        api.getRecommendations().catch(() => ({ recommendations: [] })),
        api.getCurrentPath().catch(() => api.compilePath().catch(() => ({ roadmap: [], totalEstimatedWeeks: 12 }))),
      ]);
      if (prof) setProfile(prof);
      setRecommendations(recs?.recommendations || []);
      setRoadmap(road?.roadmap || []);
      setTotalWeeks(road?.totalEstimatedWeeks || 12);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    // Re-sync stats when window gets focus
    const onFocus = () => {
      const saved = localStorage.getItem('pathwise_completed_item_ids');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setCompletedItemIds(new Set(parsed.filter((id: any) => typeof id === 'string' && id.trim().length > 3)));
          }
        } catch { /* ignore */ }
      }
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  // Helper to check if any roadmap item is completed
  const isItemDone = (item: RoadmapItem) => {
    if (item.status === 'completed') return true;
    if (item.id && completedItemIds.has(item.id)) return true;
    const fallbackKey = `roadmap-${item.type || 'skill'}-${item.skillIds?.[0] || 'skill'}-${(item.title || 'step').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    return completedItemIds.has(fallbackKey);
  };

  const nextBestGap = recommendations[0];
  const nextActionItem = roadmap.find(i => !isItemDone(i) && (i.status === 'available' || i.status === 'in_progress')) || roadmap.find(i => !isItemDone(i)) || roadmap[0];
  const activeGoal = profile?.goals?.[profile?.goals?.length - 1];
  const targetRoleName = (activeGoal?.targetRole || 'Full Stack Developer').replace(/-/g, ' ');
  const skillStates = profile?.skillStates || [];
  
  const weeklyStudyHours = profile?.weeklyHours || (profile as any)?.preferences?.weeklyHours || 10;

  const totalSteps = roadmap.length;
  const completedCount = useMemo(() => {
    return roadmap.filter(isItemDone).length;
  }, [roadmap, completedItemIds]);

  const availableCount = useMemo(() => {
    return roadmap.filter(i => !isItemDone(i)).length;
  }, [roadmap, completedItemIds]);

  const totalEstimatedHours = useMemo(() => {
    const sum = roadmap.reduce((acc, item) => acc + (item.estimatedHours || 5), 0);
    return sum > 0 ? Number(sum.toFixed(1)) : 48;
  }, [roadmap]);

  const completedHours = useMemo(() => {
    const sum = roadmap.reduce((acc, item) => {
      return isItemDone(item) ? acc + (item.estimatedHours || 5) : acc;
    }, 0);
    return Number(sum.toFixed(1));
  }, [roadmap, completedItemIds]);

  const progressPercent = totalSteps > 0
    ? Math.min(100, Math.round((completedCount / totalSteps) * 100))
    : 0;

  const remainingHours = Number(Math.max(0, totalEstimatedHours - completedHours).toFixed(1));
  const remainingWeeks = remainingHours === 0 ? 0 : Math.max(1, Math.ceil(remainingHours / weeklyStudyHours));

  // Dynamic calculated readiness based on completed steps & profile skill proficiencies
  const avgProficiency = useMemo(() => {
    const baseProf = skillStates.length > 0
      ? Math.round(skillStates.reduce((s, k) => s + k.proficiency, 0) / skillStates.length)
      : 30;
    // Blend with roadmap progress percentage
    return Math.min(100, Math.max(baseProf, Math.round(baseProf * 0.5 + progressPercent * 0.5)));
  }, [skillStates, progressPercent]);

  // Dynamic Target Completion Date
  const targetCompletionDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + remainingWeeks * 7);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }, [remainingWeeks]);

  if (loading && !profile) {
    return (
      <div className="page-shell">
        <div className="space-y-6 animate-fade-in py-12 text-center">
          <div className="skeleton h-10 w-64 mx-auto rounded-xl" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(n => <div key={n} className="skeleton h-24 rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell space-y-6 page-enter pb-16">

      {/* ── Top Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-dim)] pb-5 animate-fade-up">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black tracking-[-0.03em] text-[var(--text-primary)] font-display">
              Welcome back, {user?.name?.split(' ')[0] || 'Learner'}
            </h1>
            <span className="badge badge-amber text-[10px] font-mono uppercase font-bold shrink-0">
              {targetRoleName}
            </span>
          </div>
          <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
            {remainingHours === 0
              ? '🎉 All roadmap steps completed! Ready for industry roles.'
              : `Your DAG learning path is calibrated: ${remainingHours} hours (${remainingWeeks} weeks) remaining at ${weeklyStudyHours}h/week velocity. Target: ${targetCompletionDate}.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full md:w-auto">
          <button
            id="dashboard-micro-spark-btn"
            onClick={() => setIsSparkOpen(true)}
            className="btn btn-secondary btn-sm text-[12px] font-mono flex items-center justify-center gap-1.5 border-[rgba(245,158,11,0.3)] bg-[rgba(245,158,11,0.06)] text-[var(--primary-300)] hover:bg-[rgba(245,158,11,0.12)] flex-1 sm:flex-initial"
            title="Launch 90-second Micro-Spark Recall"
          >
            <Flame size={13} className="text-[var(--primary-400)]" />
            <span>90s Recall</span>
          </button>

          <Link to="/simulator" className="btn btn-ghost btn-sm text-[12px] font-mono flex items-center justify-center gap-1.5 border border-[var(--border-subtle)] hover:border-[var(--primary-400)] flex-1 sm:flex-initial">
            <Shuffle size={13} className="text-[var(--primary-400)]" />
            <span>Simulator</span>
          </Link>

          <Link to="/roadmap" id="dashboard-roadmap-link" className="btn btn-primary btn-sm text-[12px] flex items-center justify-center gap-1.5 shadow-sm w-full sm:w-auto">
            <Map size={13} />
            <span>View Roadmap</span>
          </Link>
        </div>
      </div>

      {/* ── Career Path Pivot Banner ───────────────────────────────── */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-cyan-500/10 to-transparent border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 animate-fade-up">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="badge badge-amber text-[9px] font-mono font-bold flex items-center gap-1">
              <Shuffle size={10} /> CAREER PATH SIMULATOR
            </span>
            <span className="text-[12px] font-bold text-white truncate">
              Current Target: {targetRoleName}
            </span>
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
            Want to pivot? Test switching to any custom career role, simulate dual-track hybrid synergy, swap individual course tracks, or adjust study velocity.
          </p>
        </div>
        <Link
          to="/simulator"
          className="btn btn-primary text-xs font-mono px-4 py-2.5 flex items-center justify-center gap-1.5 w-full sm:w-auto shrink-0"
        >
          <Shuffle size={12} />
          <span>Launch Simulator ↗</span>
        </Link>
      </div>

      {/* ── KPI Strip ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 animate-fade-up">
        {[
          { label: 'Role Readiness',    value: `${avgProficiency}%`, icon: Target,       color: 'var(--primary-400)', sub: `${progressPercent}% syllabus done` },
          { label: 'Remaining ETA',     value: `${remainingWeeks}w`, icon: Clock,        color: 'var(--accent-400)',  sub: `${remainingHours}h to target (${targetCompletionDate})` },
          { label: 'Completed Steps',   value: `${completedCount}`,  icon: CheckCircle2, color: 'var(--accent-300)', sub: `${completedHours}h completed` },
          { label: 'Available Next',    value: `${availableCount}`,  icon: Activity,     color: 'var(--primary-300)', sub: `${weeklyStudyHours}h weekly pace` },
        ].map(({ label, value, icon: Icon, color, sub }, i) => (
          <div
            key={label}
            className="card p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3.5"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="p-2 sm:p-2.5 rounded-xl shrink-0" style={{ background: `${color}15`, color }}>
              <Icon size={16} strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="stat-number text-[1.15rem] sm:text-[1.3rem] font-mono leading-none" style={{ color }}>{value}</div>
              <div className="text-[10.5px] sm:text-[11px] text-[var(--text-muted)] font-mono font-medium truncate mt-1">{label}</div>
              <div className="text-[8.5px] sm:text-[9px] font-mono text-[var(--text-muted)] truncate opacity-80 mt-0.5">{sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Row 1: Next Recommended Action & Readiness Gauge ──────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Next Best Action Card */}
        <div
          className="lg:col-span-2 rounded-2xl p-6 sm:p-7 space-y-4 relative overflow-hidden animate-fade-up"
          style={{
            background: 'linear-gradient(135deg, rgba(30,22,12,0.85) 0%, var(--bg-surface) 70%)',
            border: '1px solid rgba(245,158,11,0.25)',
            boxShadow: '0 12px 28px -8px rgba(0,0,0,0.5)',
          }}
        >
          <div aria-hidden="true" className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-[rgba(245,158,11,0.08)] blur-[50px] pointer-events-none" />

          <div className="relative z-10 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="badge badge-amber text-[10px] font-mono font-bold flex items-center gap-1">
                <Zap size={11} /> NEXT RECOMMENDED ACTION
              </span>
              {nextBestGap && (
                <button
                  id="dashboard-trace-btn"
                  onClick={() => setSelectedSkillForTrace(nextBestGap.skillId)}
                  className="text-[11px] text-[var(--primary-400)] hover:text-[var(--primary-300)] flex items-center gap-1 font-mono font-medium cursor-pointer transition-colors"
                >
                  <Eye size={12} /> Inspect Math Trace
                </button>
              )}
            </div>

            <div>
              <h2 className="text-[1.25rem] sm:text-[1.4rem] font-bold text-[var(--text-primary)] font-display tracking-tight leading-snug">
                {nextActionItem?.title || 'SQL Analytics & Query Optimization'}
              </h2>
              <p className="mt-1.5 text-[13px] text-[var(--text-secondary)] leading-relaxed max-w-xl">
                {nextBestGap
                  ? `Priority ${nextBestGap.priorityScore.toFixed(2)} · Highest downstream unlock value. Completing this unlocks next milestone dependencies.`
                  : 'Targeted milestone exercise to level up verified proficiency.'}
              </p>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-[12px] text-[var(--text-secondary)] font-mono">
              <span className="flex items-center gap-1.5">
                <Clock size={13} className="text-[var(--primary-400)]" />
                ~{nextActionItem?.estimatedHours || 2} hours
              </span>
              <span className="flex items-center gap-1.5">
                <Unlock size={13} className="text-[var(--accent-400)]" />
                Unblocks: Core Pipeline Dependencies
              </span>
            </div>

            <div className="flex flex-wrap gap-3 pt-1">
              <Link
                to="/roadmap"
                id="dashboard-start-learning-btn"
                className="btn btn-primary text-xs px-4 py-2 flex items-center gap-1.5 shadow-sm"
              >
                <span>Continue Roadmap</span>
                <ArrowRight size={13} />
              </Link>
              <Link
                to="/practice"
                className="btn btn-secondary text-xs px-4 py-2 font-mono flex items-center gap-1.5"
              >
                <span>Practice Problems</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Career Readiness Panel */}
        <div className="card p-6 flex flex-col justify-between gap-5 animate-fade-up">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Proficiency Gauge
              </p>
              <span className="badge badge-emerald text-[9px] font-mono">
                ✓ Calibrated
              </span>
            </div>

            <div className="flex items-center gap-4 pt-1">
              <div className="relative">
                <ScoreRing value={avgProficiency} size={76} strokeWidth={6} />
                <span className="absolute inset-0 flex items-center justify-center text-[1rem] font-bold font-mono text-[var(--text-primary)]">
                  {avgProficiency}%
                </span>
              </div>
              <div className="space-y-0.5">
                <div className="text-[20px] font-black font-mono text-[var(--primary-300)]">
                  {remainingWeeks}w
                </div>
                <div className="text-[11px] text-[var(--text-muted)] font-mono">
                  {remainingHours}h remaining
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2 border-t border-[var(--border-dim)] pt-4">
            <div className="flex justify-between text-[10px] font-mono text-[var(--text-muted)]">
              <span>Novice (0%)</span>
              <span>Ready ({avgProficiency}%)</span>
              <span>Target (100%)</span>
            </div>
            <div className="progress-track" role="progressbar" aria-valuenow={avgProficiency} aria-valuemin={0} aria-valuemax={100}>
              <div
                className="progress-fill progress-fill-amber"
                style={{ transform: `scaleX(${avgProficiency / 100})` }}
              />
            </div>
          </div>
        </div>

      </div>

      {/* ── Row 2: Active Roadmap Steps & Ebbinghaus Retention Radar ───── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Active Roadmap Timeline Overview */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Map size={15} className="text-[var(--primary-400)]" />
              <h3 className="text-[14px] font-bold text-[var(--text-primary)] font-display">
                Active Roadmap Pipeline
              </h3>
            </div>
            <Link to="/roadmap" className="text-[11px] font-mono text-[var(--primary-400)] hover:underline flex items-center gap-1">
              All Steps ({roadmap.length}) <ArrowRight size={11} />
            </Link>
          </div>

          {/* Progress Bar Strip */}
          <div className="p-3 rounded-xl bg-[var(--bg-void)] border border-[var(--border-dim)] space-y-1.5 font-mono text-[11px]">
            <div className="flex justify-between text-[var(--text-muted)]">
              <span>Course Completion Velocity</span>
              <strong className="text-[var(--accent-400)]">{completedHours} / {totalEstimatedHours} hrs ({progressPercent}%)</strong>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-[var(--accent-500)] rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="space-y-2.5">
            {roadmap.slice(0, 4).map((item, idx) => {
              const isDone = isItemDone(item);
              const isAvail = item.status === 'available' && !isDone;

              return (
                <div
                  key={item.id || idx}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-[12px] transition-all ${
                    isDone
                      ? 'bg-[var(--bg-void)]/60 border-[var(--border-dim)] text-[var(--text-muted)]'
                      : isAvail
                      ? 'bg-[rgba(245,158,11,0.06)] border-[rgba(245,158,11,0.25)] text-[var(--text-primary)]'
                      : 'bg-[var(--bg-void)] border-[var(--border-dim)] text-[var(--text-secondary)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-mono font-bold shrink-0 bg-[var(--bg-surface)] border border-[var(--border-dim)]">
                      {item.milestone || idx + 1}
                    </span>
                    <span className={`truncate font-medium ${isDone ? 'line-through opacity-70' : ''}`}>
                      {item.title}
                    </span>
                  </div>

                  <span className="shrink-0 font-mono text-[10px]">
                    {isDone ? (
                      <span className="text-[var(--accent-400)] flex items-center gap-1 font-bold">
                        <CheckCircle2 size={11} /> Done
                      </span>
                    ) : isAvail ? (
                      <span className="text-[var(--primary-400)] font-bold">
                        Available
                      </span>
                    ) : (
                      <span className="text-[var(--text-muted)]">
                        Locked
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ebbinghaus Memory Retention Radar */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain size={15} className="text-[var(--accent-400)]" />
              <h3 className="text-[14px] font-bold text-[var(--text-primary)] font-display">
                Memory Retention & Skill Health
              </h3>
            </div>
            <span className="badge badge-cyan text-[9px] font-mono">
              Ebbinghaus Spaced Model
            </span>
          </div>

          <div className="space-y-3">
            {[
              { skill: 'SQL & Query Optimization', retention: 92, status: 'Peak Recall', color: 'var(--accent-400)' },
              { skill: 'Python Core & Data Structures', retention: 84, status: 'Fresh', color: 'var(--accent-400)' },
              { skill: 'Data Cleaning & Pandas', retention: 68, status: 'Decaying (Review Soon)', color: 'var(--primary-400)' },
            ].map(({ skill, retention, status, color }) => (
              <div key={skill} className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-[var(--text-secondary)]">{skill}</span>
                  <span style={{ color }} className="font-bold">{retention}% · {status}</span>
                </div>
                <div className="h-1.5 w-full bg-[var(--bg-void)] rounded-full overflow-hidden border border-[var(--border-dim)]">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${retention}%`, background: color }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-[var(--border-dim)] flex items-center justify-between">
            <p className="text-[11px] text-[var(--text-muted)] font-mono">
              Counteract forgetting curve with 90s daily recall.
            </p>
            <button
              onClick={() => setIsSparkOpen(true)}
              className="btn btn-ghost btn-xs font-mono text-[11px] text-[var(--primary-400)] flex items-center gap-1"
            >
              <RotateCcw size={11} /> Quick Recall
            </button>
          </div>
        </div>

      </div>

      {/* ── Trace Modal ───────────────────────────────────────────────── */}
      {selectedSkillForTrace && (
        <RecommendationTraceModal
          skillId={selectedSkillForTrace}
          isOpen={!!selectedSkillForTrace}
          onClose={() => setSelectedSkillForTrace(null)}
        />
      )}

      {/* ── Micro-Spark Spaced Recall Modal ──────────────────────────── */}
      <MicroSparkModal
        isOpen={isSparkOpen}
        onClose={() => setIsSparkOpen(false)}
        onSuccess={() => loadDashboardData()}
      />

    </div>
  );
};
