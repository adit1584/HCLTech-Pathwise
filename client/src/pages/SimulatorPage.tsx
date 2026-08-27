import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import type { TargetRole, RoadmapItem } from '../types';
import {
  Sliders,
  Sparkles,
  Clock,
  Briefcase,
  TrendingUp,
  Loader2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Zap,
  RotateCw,
  Terminal,
  Activity,
  ShieldAlert,
  Flame,
  ArrowRight,
  HelpCircle,
  Check,
  Calendar,
  Layers,
  BookOpen,
  Award,
  Shuffle,
  ExternalLink,
  X,
} from 'lucide-react';
import { useToast } from '../components/Toast';
import { PRODUCTION_SCENARIOS, type ProductionScenario } from '../data/productionScenarios';
import { GOLD_STANDARD_COURSES } from '../data/goldStandardCourses';

function getAlternativeCoursesForSkill(skillId: string, currentTitle: string) {
  const normId = skillId.toLowerCase().trim();
  const name = normId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const found = GOLD_STANDARD_COURSES.find(c => c.skillId === normId || c.topicName.toLowerCase().includes(normId));

  const list: Array<{
    id: string;
    title: string;
    provider: string;
    platform: string;
    url: string;
    estimatedHours: number;
    difficulty: string;
    isFree: boolean;
    badge: string;
    description: string;
  }> = [];

  if (found) {
    list.push({
      id: `${normId}-free-gold`,
      title: found.freeCourse.title,
      provider: found.freeCourse.provider,
      platform: found.freeCourse.platform,
      url: found.freeCourse.url,
      estimatedHours: found.freeCourse.durationHours,
      difficulty: 'Beginner / Intermediate',
      isFree: true,
      badge: '★ Harvard / Top University Track',
      description: found.freeCourse.description,
    });
    list.push({
      id: `${normId}-paid-gold`,
      title: found.paidCourse.title,
      provider: found.paidCourse.provider,
      platform: found.paidCourse.platform,
      url: found.paidCourse.url,
      estimatedHours: found.paidCourse.durationHours,
      difficulty: 'Specialization Track',
      isFree: false,
      badge: '🏆 Professional Certificate',
      description: found.paidCourse.description,
    });
  }

  // Add FreeCodeCamp Masterclass
  list.push({
    id: `${normId}-fcc`,
    title: `${name} Full 10-Hour Masterclass`,
    provider: 'freeCodeCamp / Community',
    platform: 'YouTube / freeCodeCamp',
    url: `https://www.youtube.com/results?search_query=${encodeURIComponent(name + ' full course freecodecamp')}`,
    estimatedHours: 10,
    difficulty: 'All Levels',
    isFree: true,
    badge: '⚡ Fast-Track Video Masterclass',
    description: `Complete hands-on video curriculum covering fundamentals, practical syntax, building projects and best practices.`,
  });

  // Add Interactive / Documentation Track
  list.push({
    id: `${normId}-interactive`,
    title: `${name} Interactive Practice & Official Guide`,
    provider: 'Official Foundation / Interactive Docs',
    platform: 'Interactive Documentation',
    url: `https://www.google.com/search?q=${encodeURIComponent(name + ' official documentation tutorials interactive')}`,
    estimatedHours: 15,
    difficulty: 'Hands-on',
    isFree: true,
    badge: '💻 Interactive Exercises',
    description: `Interactive sandbox exercises, practical test suites, and documentation walkthroughs.`,
  });

  return list;
}

const SKILL_OPTIONS = [
  'python',
  'javascript',
  'typescript',
  'react',
  'nodejs',
  'sql',
  'nosql',
  'docker',
  'linux',
  'networking',
  'git',
  'machine-learning',
  'deep-learning',
  'statistics',
  'api-design',
  'testing',
];

export const SimulatorPage: React.FC = () => {
  const { success: toastSuccess, error: toastError } = useToast();

  // Mode Switch: Production Drills vs Career ROI
  const [activeMode, setActiveMode] = useState<'drills' | 'career_roi'>('career_roi');

  // ── Fire Drill State ─────────────────────────────────────────────────────
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState(0);
  const [activeDiagnosticTab, setActiveDiagnosticTab] = useState<'logs' | 'metrics' | 'network'>('logs');
  const [selectedRemediation, setSelectedRemediation] = useState<string | null>(null);
  const [isResolved, setIsResolved] = useState(false);
  const [resolvedScenarios, setResolvedScenarios] = useState<Set<string>>(new Set());

  const currentScenario: ProductionScenario = PRODUCTION_SCENARIOS[selectedScenarioIndex];

  const handleSelectRemediation = (optId: string) => {
    setSelectedRemediation(optId);
    const chosenOpt = currentScenario.options.find(o => o.id === optId);
    if (chosenOpt?.isCorrect) {
      setIsResolved(true);
      setResolvedScenarios(prev => new Set(prev).add(currentScenario.id));
      toastSuccess(`🎉 SEV Outage Resolved! +${currentScenario.xpReward} XP Earned!`);
      api.recordProgressEvent({
        type: 'RESOURCE_COMPLETED',
        skillIds: ['system-design', 'sql', 'debugging'],
        resourceId: `drill-${currentScenario.id}`,
        score: 100,
        metadata: { scenario: currentScenario.title },
      }).catch(console.error);
    }
  };

  const handleNextScenario = () => {
    setSelectedRemediation(null);
    setIsResolved(false);
    setSelectedScenarioIndex(prev => (prev + 1) % PRODUCTION_SCENARIOS.length);
  };

  // ── Career ROI What-If State (Pure Custom Roles) ─────────────────────────
  const [customPrimaryInput, setCustomPrimaryInput] = useState('Full Stack Developer');
  const [isDualRoleActive, setIsDualRoleActive] = useState(false);
  const [customSecondaryInput, setCustomSecondaryInput] = useState('DevOps & Cloud Engineer');

  const [weeklyHours, setWeeklyHours] = useState(15);
  const [simulatedSkills, setSimulatedSkills] = useState<string[]>([]);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [roiLoading, setRoiLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [appliedSuccess, setAppliedSuccess] = useState<string | null>(null);

  // Course Swap State
  const [swappedCourses, setSwappedCourses] = useState<Record<string, {
    title: string;
    provider: string;
    platform: string;
    url: string;
    estimatedHours: number;
    isFree: boolean;
  }>>({});
  const [courseSwapTarget, setCourseSwapTarget] = useState<{
    item: RoadmapItem;
    skillId: string;
    currentTitle: string;
  } | null>(null);

  const handleSwapCourse = (itemId: string, newCourse: any) => {
    setSwappedCourses(prev => ({
      ...prev,
      [itemId]: {
        title: newCourse.title,
        provider: newCourse.provider,
        platform: newCourse.platform,
        url: newCourse.url,
        estimatedHours: newCourse.estimatedHours,
        isFree: newCourse.isFree,
      },
    }));
    setCourseSwapTarget(null);
    toastSuccess(`Switched to ${newCourse.title}!`);
  };

  const getEffectivePrimaryRole = useCallback(() => {
    const trimmed = customPrimaryInput.trim();
    return trimmed ? trimmed.toLowerCase().replace(/\s+/g, '-') : 'full-stack-developer';
  }, [customPrimaryInput]);

  const getEffectiveSecondaryRole = useCallback(() => {
    if (!isDualRoleActive) return null;
    const trimmed = customSecondaryInput.trim();
    return trimmed ? trimmed.toLowerCase().replace(/\s+/g, '-') : 'devops-engineer';
  }, [isDualRoleActive, customSecondaryInput]);

  const runSimulation = useCallback(async (
    primary?: string,
    secondary?: string | null,
    hours?: number,
    skills?: string[]
  ) => {
    const finalPrimary = primary ?? getEffectivePrimaryRole();
    const finalSecondary = secondary !== undefined ? secondary : getEffectiveSecondaryRole();
    const finalHours = hours ?? weeklyHours;
    const finalSkills = skills ?? simulatedSkills;
    setRoiLoading(true);
    try {
      const res = await api.simulateWhatIf({
        targetRole: finalPrimary,
        secondaryRole: finalSecondary,
        weeklyHours: finalHours,
        skipSkills: finalSkills,
      });
      setSimulationResult(res);
    } catch (err) {
      console.error('Simulation failed:', err);
    } finally {
      setRoiLoading(false);
    }
  }, [getEffectivePrimaryRole, getEffectiveSecondaryRole, weeklyHours, simulatedSkills]);

  useEffect(() => {
    // Auto-load learner's current target role for custom input
    api.getProfile()
      .then(prof => {
        const activeRole = prof.goals?.[prof.goals.length - 1]?.targetRole;
        if (activeRole) {
          const displayRole = activeRole.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          setCustomPrimaryInput(displayRole);
          runSimulation(activeRole);
        } else {
          runSimulation();
        }
      })
      .catch(() => {
        runSimulation();
      });
  }, []);

  const handleSimulateCustomPrimary = () => {
    const trimmed = customPrimaryInput.trim();
    if (!trimmed) return;
    setAppliedSuccess(null);
    const slug = trimmed.toLowerCase().replace(/\s+/g, '-');
    runSimulation(slug);
    toastSuccess(`Simulating custom learning path for "${trimmed}"`);
  };

  const handleSimulateCustomSecondary = () => {
    const trimmed = customSecondaryInput.trim();
    if (!trimmed) return;
    setAppliedSuccess(null);
    const slug = trimmed.toLowerCase().replace(/\s+/g, '-');
    runSimulation(undefined, slug);
    toastSuccess(`Simulating dual-track synergy with "${trimmed}"`);
  };

  const toggleDualRole = () => {
    const nextState = !isDualRoleActive;
    setIsDualRoleActive(nextState);
    setAppliedSuccess(null);
    const nextSec = nextState ? (customSecondaryInput.trim().toLowerCase().replace(/\s+/g, '-') || 'devops-engineer') : null;
    runSimulation(undefined, nextSec, undefined, undefined);
  };

  const handleHoursChange = (val: number) => {
    setWeeklyHours(val);
    setAppliedSuccess(null);
    runSimulation(undefined, undefined, val, undefined);
  };

  const toggleSkillSkip = (skill: string) => {
    const next = simulatedSkills.includes(skill)
      ? simulatedSkills.filter(s => s !== skill)
      : [...simulatedSkills, skill];
    setSimulatedSkills(next);
    setAppliedSuccess(null);
    runSimulation(undefined, undefined, undefined, next);
  };

  const handleApplySimulatedPlan = async () => {
    setIsApplying(true);
    try {
      const finalPrimary = getEffectivePrimaryRole();
      const finalSecondary = getEffectiveSecondaryRole();
      const res = await api.applySimulation({
        targetRole: finalPrimary,
        secondaryRole: finalSecondary,
        weeklyHours,
        skipSkills: simulatedSkills,
      });
      if (res.success) {
        setAppliedSuccess(
          `🎉 Applied! Your active roadmap is now calibrated for ${res.targetRole} at ${weeklyHours} hrs/week (~${res.totalEstimatedWeeks} weeks to completion).`
        );
        toastSuccess('Learning plan successfully updated and recompiled!');
      }
    } catch (err) {
      console.error('Failed to apply plan:', err);
      toastError('Failed to apply simulated plan. Please try again.');
    } finally {
      setIsApplying(false);
    }
  };

  // Group simulated roadmap items by milestone
  const milestoneGroups = useMemo(() => {
    const items: RoadmapItem[] = simulationResult?.simulatedRoadmap || [];
    const groups: Record<number, RoadmapItem[]> = {};
    items.forEach(item => {
      const m = item.milestone || 1;
      if (!groups[m]) groups[m] = [];
      groups[m].push(item);
    });
    return Object.entries(groups).map(([mNum, groupItems]) => {
      const hours = groupItems.reduce((acc, i) => {
        const sw = swappedCourses[i.id];
        return acc + (sw?.estimatedHours || i.estimatedHours || 3);
      }, 0);
      const calcWeeks = Number((hours / weeklyHours).toFixed(2));
      return {
        milestone: Number(mNum),
        items: groupItems,
        totalHours: Number(hours.toFixed(2)),
        weeks: Math.max(0.5, calcWeeks),
      };
    });
  }, [simulationResult, weeklyHours, swappedCourses]);

  const targetDate = useMemo(() => {
    const weeks = simulationResult?.simulatedTotalWeeks || 12;
    const d = new Date();
    d.setDate(d.getDate() + weeks * 7);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }, [simulationResult]);

  // Salary Estimator calculation
  const salaryMap: Record<string, { median: string; lift: string; demand: string }> = {
    'full-stack-developer': { median: '$125,000 / yr', lift: '+$28,000 with React + Node', demand: '94 / 100' },
    'frontend-developer': { median: '$110,000 / yr', lift: '+$20,000 with TypeScript', demand: '88 / 100' },
    'backend-developer': { median: '$130,000 / yr', lift: '+$32,000 with System Design + Docker', demand: '92 / 100' },
    'data-scientist': { median: '$135,000 / yr', lift: '+$35,000 with ML + PyTorch', demand: '91 / 100' },
    'machine-learning-engineer': { median: '$150,000 / yr', lift: '+$45,000 with LLMs + CUDA', demand: '98 / 100' },
    'cybersecurity-analyst': { median: '$128,000 / yr', lift: '+$30,000 with PenTesting + SIEM', demand: '96 / 100' },
    'blockchain-developer': { median: '$145,000 / yr', lift: '+$40,000 with Solidity + Rust', demand: '89 / 100' },
    'devops-engineer': { median: '$138,000 / yr', lift: '+$35,000 with Kubernetes + Terraform', demand: '95 / 100' },
  };

  const primaryRoleKey = getEffectivePrimaryRole();
  const currentSalaryInfo = isDualRoleActive
    ? { median: '$155,000 / yr', lift: '+$45,000 (Dual-Track Hybrid Advantage)', demand: '98 / 100' }
    : (salaryMap[primaryRoleKey] || { median: '$125,000 / yr', lift: '+$25,000 with core competencies', demand: '91 / 100' });

  return (
    <div className="page-shell space-y-6 page-enter pb-16">

      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[var(--border-dim)] animate-fade-up">
        <div className="space-y-1">
          <p className="section-eyebrow">Decision Science & Real-time Career Planner</p>
          <h1 className="section-title">Career Path Simulator & Outage Drills</h1>
          <p className="text-[13px] text-[var(--text-secondary)]">
            Simulate target role pivots, explore dual-track career hybrids, adjust study velocity, and test real-time career outcomes.
          </p>
        </div>

        {/* Dual Mode Switch */}
        <div className="flex items-center gap-2 self-start sm:self-end flex-wrap">
          <button
            onClick={() => setActiveMode('career_roi')}
            className={`px-4 py-2 rounded-xl text-[12px] font-mono border transition-all cursor-pointer font-bold flex items-center gap-1.5 ${
              activeMode === 'career_roi'
                ? 'bg-[var(--primary-500)] text-slate-950 border-transparent shadow-[0_4px_14px_-4px_rgba(245,158,11,0.5)]'
                : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-muted)]'
            }`}
          >
            <Sliders size={13} /> ⚡ Career Simulator
          </button>
          <button
            onClick={() => setActiveMode('drills')}
            className={`px-4 py-2 rounded-xl text-[12px] font-mono border transition-all cursor-pointer font-bold flex items-center gap-1.5 ${
              activeMode === 'drills'
                ? 'bg-[var(--primary-500)] text-slate-950 border-transparent shadow-[0_4px_14px_-4px_rgba(245,158,11,0.5)]'
                : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-muted)]'
            }`}
          >
            <ShieldAlert size={13} /> 🚨 Production Fire Drills
          </button>
        </div>
      </div>

      {/* ── MODE 1: CAREER ROI & REAL-TIME SIMULATOR ──────── */}
      {activeMode === 'career_roi' && (
        <div className="space-y-6 animate-fade-up">

          {/* Success Banner if Applied */}
          {appliedSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-2.5 text-sm font-medium">
                <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                <span>{appliedSuccess}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link to="/roadmap" className="btn btn-primary text-xs px-3.5 py-1.5">
                  View Live Roadmap <ArrowRight size={12} />
                </Link>
                <Link to="/dashboard" className="btn btn-secondary text-xs px-3.5 py-1.5">
                  Dashboard
                </Link>
              </div>
            </div>
          )}

          {/* Controls Card */}
          <div className="p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* ── Primary Target Role Input (Pure Custom) ── */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[12px] font-mono text-[var(--text-muted)] flex items-center gap-1.5 font-bold">
                    <Briefcase size={13} className="text-[var(--primary-400)]" /> TARGET CAREER ROLE (CUSTOM)
                  </label>
                  <span className="text-[10px] font-mono text-[var(--accent-400)]">
                    Type any custom role to simulate
                  </span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customPrimaryInput}
                    onChange={e => {
                      setCustomPrimaryInput(e.target.value);
                      setAppliedSuccess(null);
                    }}
                    onKeyDown={e => e.key === 'Enter' && handleSimulateCustomPrimary()}
                    placeholder="e.g. Rust Systems Engineer, AI Research Scientist, Full Stack Developer..."
                    className="flex-1 p-3.5 rounded-xl bg-[var(--bg-void)] border border-[var(--border-subtle)] focus:border-[var(--primary-500)] text-[13px] font-bold text-[var(--text-primary)] outline-none transition-all"
                  />
                  <button
                    onClick={handleSimulateCustomPrimary}
                    disabled={roiLoading || !customPrimaryInput.trim()}
                    className="btn btn-primary text-xs font-mono px-4 flex items-center gap-1.5 shrink-0 shadow-md cursor-pointer"
                  >
                    {roiLoading ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Sparkles size={13} />
                    )}
                    <span>Simulate Path</span>
                  </button>
                </div>
              </div>

              {/* ── Weekly Time Commitment Slider ── */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-[12px] font-mono">
                  <span className="text-[var(--text-muted)] font-bold flex items-center gap-1.5">
                    <Clock size={13} className="text-[var(--accent-400)]" /> WEEKLY STUDY COMMITMENT
                  </span>
                  <strong className="text-[var(--primary-300)] text-sm font-bold">{weeklyHours} hours / week</strong>
                </div>
                <input
                  type="range"
                  min={5}
                  max={40}
                  step={5}
                  value={weeklyHours}
                  onChange={e => handleHoursChange(Number(e.target.value))}
                  className="w-full h-2.5 rounded-lg bg-[var(--bg-void)] accent-[var(--primary-500)] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-[var(--text-muted)]">
                  <span>5 hrs (Casual)</span>
                  <span>15-20 hrs (Part-time)</span>
                  <span>40 hrs (Full-time Bootcamp)</span>
                </div>
              </div>

            </div>

            {/* ── Dual-Role / Secondary Role Hybrid Option ── */}
            <div className="p-4 rounded-2xl bg-[var(--bg-void)] border border-[var(--border-subtle)] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="badge badge-cyan text-[10px] font-mono font-bold">
                      DUAL-CAREER HYBRID
                    </span>
                    <span className="text-[12px] font-bold text-[var(--text-primary)] font-display">
                      Combine with a Secondary Career Role
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    Target two skill disciplines at once. Pathwise calculates shared skill synergy and transfer learning savings.
                  </p>
                </div>

                <button
                  onClick={toggleDualRole}
                  className={`btn btn-sm text-[11px] font-mono px-3.5 py-1.5 cursor-pointer flex items-center gap-1.5 ${
                    isDualRoleActive
                      ? 'bg-[rgba(14,165,233,0.2)] text-[var(--cyan-300)] border border-[rgba(14,165,233,0.5)]'
                      : 'btn-secondary text-[var(--text-muted)]'
                  }`}
                >
                  {isDualRoleActive ? (
                    <>
                      <CheckCircle2 size={12} className="text-[var(--cyan-300)]" />
                      <span>Secondary Role Active</span>
                    </>
                  ) : (
                    <>
                      <span>+ Add Secondary Role</span>
                    </>
                  )}
                </button>
              </div>

              {isDualRoleActive && (
                <div className="pt-3 border-t border-[var(--border-dim)] space-y-3">
                  <label className="text-[11px] font-mono text-[var(--text-muted)] font-bold flex items-center gap-1.5">
                    <Briefcase size={12} className="text-[var(--cyan-300)]" /> SECONDARY ROLE (CUSTOM)
                  </label>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customSecondaryInput}
                      onChange={e => {
                        setCustomSecondaryInput(e.target.value);
                        setAppliedSuccess(null);
                      }}
                      onKeyDown={e => e.key === 'Enter' && handleSimulateCustomSecondary()}
                      placeholder="e.g. DevOps Engineer, Security Analyst, Mobile Developer..."
                      className="flex-1 p-3 rounded-xl bg-[var(--bg-surface)] border border-[rgba(14,165,233,0.4)] focus:border-[var(--cyan-400)] text-[12px] font-bold text-[var(--text-primary)] outline-none"
                    />
                    <button
                      onClick={handleSimulateCustomSecondary}
                      disabled={roiLoading || !customSecondaryInput.trim()}
                      className="btn btn-primary btn-sm text-xs px-3.5 flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      {roiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                      <span>Simulate Dual</span>
                    </button>
                  </div>

                  {/* Synergy Insights Card */}
                  {simulationResult?.isDualRole && (
                    <div className="p-3.5 rounded-xl bg-[rgba(14,165,233,0.06)] border border-[rgba(14,165,233,0.25)] space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-[11px] font-bold text-[var(--cyan-300)] flex items-center gap-1.5">
                          <Sparkles size={12} /> Hybrid Synergy: {simulationResult.primaryRoleName} + {simulationResult.secondaryRoleName}
                        </span>
                        <span className="badge badge-emerald text-[9px] font-mono font-bold">
                          ⚡ -{simulationResult.synergyWeeksSaved || 4} WEEKS TRANSFER SAVINGS
                        </span>
                      </div>

                      {simulationResult.sharedSkills?.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono text-[var(--text-muted)]">
                            Shared Foundation Skills (Learned Once):
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {simulationResult.sharedSkills.map((sk: string) => (
                              <span key={sk} className="badge badge-cyan text-[9px] font-mono">
                                ✓ {sk.replace(/-/g, ' ')}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Fast-Track Prior Knowledge Toggles */}
            <div className="space-y-2 pt-2 border-t border-[var(--border-dim)]">
              <span className="text-[11px] font-mono text-[var(--text-muted)] flex items-center gap-1.5">
                <Sparkles size={12} className="text-amber-400" />
                <strong>Fast-Track Simulation:</strong> Test timeline if you already know these core skills:
              </span>
              <div className="flex flex-wrap gap-2">
                {SKILL_OPTIONS.map(skill => {
                  const isSkipped = simulatedSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      onClick={() => toggleSkillSkip(skill)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSkipped
                          ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300 shadow-[0_0_12px_-3px_rgba(16,185,129,0.4)]'
                          : 'bg-[var(--bg-void)] border-[var(--border-subtle)] text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {isSkipped ? <Check size={12} className="text-emerald-400" /> : <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />}
                      <span>{skill.replace(/-/g, ' ')}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Market ROI & Live Recalculation Metrics Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1">
              <span className="text-[11px] font-mono text-[var(--text-muted)]">Recalculated ETA</span>
              <div className="text-2xl font-bold text-[var(--accent-300)] font-display flex items-baseline gap-2">
                {roiLoading ? <Loader2 size={20} className="animate-spin text-amber-400" /> : `${simulationResult?.simulatedTotalWeeks || 12} Weeks`}
                {simulationResult?.timeSavedWeeks > 0 && (
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                    -{simulationResult.timeSavedWeeks}w saved
                  </span>
                )}
              </div>
              <p className="text-[10px] font-mono text-[var(--text-muted)]">Target Date: {targetDate}</p>
            </div>

            <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1">
              <span className="text-[11px] font-mono text-[var(--text-muted)]">Weekly Study Pace</span>
              <div className="text-2xl font-bold text-[var(--primary-300)] font-display">
                {weeklyHours} hrs/wk
              </div>
              <p className="text-[10px] font-mono text-[var(--text-muted)]">
                {weeklyHours >= 30 ? '🔥 Full-time intensive' : weeklyHours >= 15 ? '⚡ Consistent part-time' : '🌱 Steady pace'}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1">
              <span className="text-[11px] font-mono text-[var(--text-muted)]">Estimated Market Salary</span>
              <div className="text-2xl font-bold text-[var(--primary-300)] font-display">
                {currentSalaryInfo.median}
              </div>
              <p className="text-[10px] font-mono text-emerald-400">{currentSalaryInfo.lift}</p>
            </div>

            <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1">
              <span className="text-[11px] font-mono text-[var(--text-muted)]">Industry Demand Index</span>
              <div className="text-2xl font-bold text-amber-400 font-display">
                {currentSalaryInfo.demand}
              </div>
              <p className="text-[10px] font-mono text-[var(--text-muted)]">High hiring trajectory</p>
            </div>
          </div>

          {/* ── Recalculated Roadmap Breakdown ───────────────────────── */}
          <div className="p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-dim)]">
              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
                  <Layers size={16} className="text-amber-400" />
                  Live Recomputed Roadmap Milestones & Courses
                </h3>
                <p className="text-[12px] text-slate-400">
                  {simulationResult?.simulatedItemsCount || 0} steps optimized for {weeklyHours}h/week study velocity. Click <strong>⇄ Switch Course</strong> on any item to swap learning track or provider.
                </p>
              </div>

              {/* ⚡ Apply Plan Button */}
              <button
                onClick={handleApplySimulatedPlan}
                disabled={isApplying}
                className="btn btn-primary text-xs px-5 py-2.5 flex items-center gap-2 shadow-lg cursor-pointer self-start sm:self-auto shrink-0"
              >
                {isApplying ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Recalibrating Plan...</span>
                  </>
                ) : (
                  <>
                    <Zap size={13} />
                    <span>Apply Recalibrated Roadmap to Active Plan</span>
                  </>
                )}
              </button>
            </div>

            {/* Milestones List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
              {milestoneGroups.map(mg => (
                <div
                  key={mg.milestone}
                  className="p-4 rounded-2xl border space-y-3"
                  style={{
                    backgroundColor: '#0c101c',
                    borderColor: 'rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="badge badge-amber text-[9px] font-mono font-bold">
                      MILESTONE {mg.milestone}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      ~{mg.weeks} wks ({mg.totalHours} hrs)
                    </span>
                  </div>

                  <div className="space-y-2">
                    {mg.items.map((item, idx) => {
                      const effectiveItem = swappedCourses[item.id] || item;
                      const currentTitle = effectiveItem.title || item.title;
                      const currentHours = effectiveItem.estimatedHours || item.estimatedHours || 3;
                      const isSwapped = Boolean(swappedCourses[item.id]);
                      const skillKey = item.skillIds?.[0] || 'programming';

                      return (
                        <div
                          key={item.id || idx}
                          className={`p-3 rounded-xl border flex flex-col justify-between gap-2 transition-all ${
                            isSwapped
                              ? 'bg-[rgba(14,165,233,0.06)] border-[rgba(14,165,233,0.35)] shadow-sm'
                              : 'bg-white/[0.03] border-white/[0.05]'
                          }`}
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {item.type === 'COURSE' ? (
                                <BookOpen size={12} className="text-cyan-400 shrink-0" />
                              ) : (
                                <Award size={12} className="text-amber-400 shrink-0" />
                              )}
                              <span className="text-slate-200 font-semibold text-[12px] line-clamp-1">
                                {currentTitle}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                              <span>~{currentHours}h</span>
                              <span>•</span>
                              <span>{effectiveItem.provider || 'Verified Course'}</span>
                              {isSwapped && (
                                <span className="badge badge-cyan text-[8px] font-mono ml-auto">
                                  ✓ SWAPPED
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 pt-1.5 border-t border-white/[0.04] justify-between">
                            {/* ⇄ Switch / Swap Course Button */}
                            {item.type === 'COURSE' ? (
                              <button
                                onClick={() => setCourseSwapTarget({ item, skillId: skillKey, currentTitle })}
                                className="btn btn-secondary btn-xs font-mono text-[10px] py-1 px-2 flex items-center gap-1 hover:border-[var(--primary-400)] hover:text-[var(--primary-300)] cursor-pointer"
                                title="Switch to an alternative course, provider, or university track"
                              >
                                <Shuffle size={10} />
                                <span>⇄ Switch Course</span>
                              </button>
                            ) : (
                              <span className="text-[10px] font-mono text-slate-500">Milestone Check</span>
                            )}

                            {effectiveItem.url && (
                              <a
                                href={effectiveItem.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-ghost btn-xs font-mono text-[10px] text-[var(--cyan-300)] hover:bg-[rgba(14,165,233,0.1)] border border-[rgba(14,165,233,0.25)] py-1 px-2 flex items-center gap-1"
                              >
                                <ExternalLink size={10} />
                                <span>Course ↗</span>
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── COURSE SWITCHER MODAL ────────────────────────────── */}
          {courseSwapTarget && (
            <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-[var(--bg-surface)] border border-[var(--border-dim)] rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl animate-fade-up max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border-dim)]">
                  <div className="space-y-0.5">
                    <span className="badge badge-amber text-[9px] font-mono font-bold flex items-center gap-1">
                      <Shuffle size={10} /> WHAT-IF COURSE SWITCHER
                    </span>
                    <h3 className="text-base font-bold text-white font-display">
                      Select Course Track for {courseSwapTarget.skillId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </h3>
                  </div>
                  <button
                    onClick={() => setCourseSwapTarget(null)}
                    className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-raised)] cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                <p className="text-[12px] text-slate-300">
                  Choose your preferred learning format, provider, or university certificate. Your simulated roadmap and study hours will instantly update.
                </p>

                <div className="space-y-3">
                  {getAlternativeCoursesForSkill(courseSwapTarget.skillId, courseSwapTarget.currentTitle).map(alt => {
                    const isSelected = (swappedCourses[courseSwapTarget.item.id]?.title === alt.title) ||
                      (!swappedCourses[courseSwapTarget.item.id] && courseSwapTarget.currentTitle === alt.title);

                    return (
                      <div
                        key={alt.id}
                        className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
                          isSelected
                            ? 'bg-[rgba(245,158,11,0.08)] border-[rgba(245,158,11,0.5)] shadow-md'
                            : 'bg-[var(--bg-void)] border-[var(--border-subtle)] hover:border-[var(--border-muted)]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="badge text-[9px] font-mono bg-white/[0.04] text-amber-300 border border-amber-500/30">
                            {alt.badge}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            ~{alt.estimatedHours}h • {alt.isFree ? '100% Free' : 'Paid / Certificate'}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-white font-display">{alt.title}</h4>
                          <p className="text-[11px] font-mono text-[var(--text-muted)]">{alt.provider} • {alt.platform}</p>
                          <p className="text-[12px] text-slate-300 mt-1">{alt.description}</p>
                        </div>

                        <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between gap-2">
                          <a
                            href={alt.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-mono text-cyan-400 hover:underline flex items-center gap-1"
                          >
                            <span>Preview Course ↗</span>
                          </a>

                          <button
                            onClick={() => handleSwapCourse(courseSwapTarget.item.id, alt)}
                            className={`btn btn-xs font-mono text-[11px] px-3.5 py-1.5 flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50 cursor-default'
                                : 'btn-primary cursor-pointer'
                            }`}
                          >
                            {isSelected ? (
                              <>
                                <CheckCircle2 size={11} className="text-emerald-400" />
                                <span>Current Selection</span>
                              </>
                            ) : (
                              <>
                                <Shuffle size={11} />
                                <span>Select & Switch</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ── MODE 2: PRODUCTION FIRE DRILLS ──────────────────────────── */}
      {activeMode === 'drills' && (
        <div className="space-y-6 animate-fade-up">

          {/* Incident Selector & Health Header */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[var(--bg-surface)] border border-[rgba(239,68,68,0.3)] shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="badge bg-red-500/20 text-red-400 border-red-500/30 text-[10px] font-mono font-bold flex items-center gap-1 animate-pulse">
                    <Activity size={11} /> {currentScenario.severity}
                  </span>
                  <span className="text-[11px] font-mono text-[var(--text-muted)]">
                    Service: <strong className="text-[var(--text-primary)]">{currentScenario.service}</strong>
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] font-display">
                  {currentScenario.title}
                </h2>
                <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">
                  {currentScenario.systemSummary}
                </p>
              </div>

              {/* Scenario Switcher Buttons */}
              <div className="flex items-center gap-1.5 self-start sm:self-center shrink-0">
                {PRODUCTION_SCENARIOS.map((sc, idx) => (
                  <button
                    key={sc.id}
                    onClick={() => {
                      setSelectedScenarioIndex(idx);
                      setSelectedRemediation(null);
                      setIsResolved(false);
                    }}
                    className={`w-8 h-8 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center ${
                      selectedScenarioIndex === idx
                        ? 'bg-red-500 text-white shadow-md'
                        : resolvedScenarios.has(sc.id)
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-[var(--bg-void)] text-[var(--text-muted)] border border-[var(--border-dim)]'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Diagnostic Console & Remediation */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7 rounded-3xl bg-[#06080e] border border-[var(--border-dim)] p-5 font-mono text-xs space-y-3 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-slate-400 text-[11px] ml-2">production-telemetry.log</span>
                </div>
                <div className="flex gap-1">
                  {(['logs', 'metrics', 'network'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveDiagnosticTab(tab)}
                      className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold transition-all ${
                        activeDiagnosticTab === tab ? 'bg-white/15 text-white' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2 text-slate-300 pr-2">
                {activeDiagnosticTab === 'logs' && (
                  <div className="space-y-1.5 font-mono text-[11px]">
                    {currentScenario.initialLogs.map((log, lIdx) => (
                      <div
                        key={lIdx}
                        className={
                          log.includes('[ERROR]') || log.includes('[FATAL]')
                            ? 'text-red-400'
                            : log.includes('[WARN]')
                            ? 'text-amber-300'
                            : 'text-slate-400'
                        }
                      >
                        {log}
                      </div>
                    ))}
                  </div>
                )}
                {activeDiagnosticTab !== 'logs' && (
                  <div className="space-y-2">
                    {currentScenario.diagnosticClues
                      .filter(c => c.tab === activeDiagnosticTab)
                      .map((clue, cIdx) => (
                        <div
                          key={cIdx}
                          className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-[11px] font-mono space-y-1"
                        >
                          <strong className="text-amber-300 block">{clue.title}</strong>
                          <pre className="text-slate-300 whitespace-pre-wrap leading-relaxed">{clue.content}</pre>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* Remediation Options */}
            <div className="lg:col-span-5 space-y-3">
              <h3 className="text-sm font-bold text-white font-display">Select Engineering Remediation</h3>
              <div className="space-y-2.5">
                {currentScenario.options.map(opt => {
                  const isSelected = selectedRemediation === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectRemediation(opt.id)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
                        isSelected
                          ? opt.isCorrect
                            ? 'bg-emerald-950/50 border-emerald-500/60 text-white'
                            : 'bg-red-950/50 border-red-500/60 text-white'
                          : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-[12px] text-white font-display">{opt.label}</h4>
                        <span className="text-[10px] font-mono text-slate-400">{opt.latencyImpact}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{opt.description}</p>
                    </button>
                  );
                })}
              </div>

              {selectedRemediation && (
                <button
                  onClick={handleNextScenario}
                  className="btn btn-primary text-xs px-5 py-2.5 flex items-center gap-1.5 ml-auto mt-3"
                >
                  <span>Next Production Drill</span>
                  <ArrowRight size={13} />
                </button>
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
