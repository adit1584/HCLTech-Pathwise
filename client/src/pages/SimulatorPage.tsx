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
} from 'lucide-react';
import { useToast } from '../components/Toast';
import { PRODUCTION_SCENARIOS, type ProductionScenario } from '../data/productionScenarios';

const SKILL_OPTIONS = ['statistics', 'sql', 'python', 'machine-learning', 'deep-learning', 'data-cleaning'];

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

  // ── Career ROI What-If State ─────────────────────────────────────────────
  const [roles, setRoles] = useState<TargetRole[]>([]);
  const [targetRole, setTargetRole] = useState('full-stack-developer');
  const [weeklyHours, setWeeklyHours] = useState(15);
  const [simulatedSkills, setSimulatedSkills] = useState<string[]>([]);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [roiLoading, setRoiLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [appliedSuccess, setAppliedSuccess] = useState<string | null>(null);

  const runSimulation = useCallback(async (
    role?: string,
    hours?: number,
    skills?: string[]
  ) => {
    const finalRole = role ?? targetRole;
    const finalHours = hours ?? weeklyHours;
    const finalSkills = skills ?? simulatedSkills;
    setRoiLoading(true);
    try {
      const res = await api.simulateWhatIf({
        targetRole: finalRole,
        weeklyHours: finalHours,
        skipSkills: finalSkills,
      });
      setSimulationResult(res);
    } catch (err) {
      console.error('Simulation failed:', err);
    } finally {
      setRoiLoading(false);
    }
  }, [targetRole, weeklyHours, simulatedSkills]);

  useEffect(() => {
    api.getRoles()
      .then(res => {
        setRoles(res.roles);
        if (res.roles.length > 0) setTargetRole(res.roles[0].id);
      })
      .catch(console.error);
    runSimulation();
  }, []);

  const handleRoleChange = (role: string) => {
    setTargetRole(role);
    setAppliedSuccess(null);
    runSimulation(role, undefined, undefined);
  };

  const handleHoursChange = (val: number) => {
    setWeeklyHours(val);
    setAppliedSuccess(null);
    runSimulation(undefined, val, undefined);
  };

  const toggleSkillSkip = (skill: string) => {
    const next = simulatedSkills.includes(skill)
      ? simulatedSkills.filter(s => s !== skill)
      : [...simulatedSkills, skill];
    setSimulatedSkills(next);
    setAppliedSuccess(null);
    runSimulation(undefined, undefined, next);
  };

  const handleApplySimulatedPlan = async () => {
    setIsApplying(true);
    try {
      const res = await api.applySimulation({
        targetRole,
        weeklyHours,
        skipSkills: simulatedSkills,
      });
      if (res.success) {
        setAppliedSuccess(
          `🎉 Applied! Your active roadmap is now calibrated to ${weeklyHours} hrs/week (~${res.totalEstimatedWeeks} weeks to completion).`
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
      const hours = groupItems.reduce((acc, i) => acc + (i.estimatedHours || 3), 0);
      const calcWeeks = Number((hours / weeklyHours).toFixed(2));
      return {
        milestone: Number(mNum),
        items: groupItems,
        totalHours: Number(hours.toFixed(2)),
        weeks: Math.max(0.5, calcWeeks),
      };
    });
  }, [simulationResult, weeklyHours]);

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
    'backend-developer': { median: '$130,000 / yr', lift: '+$32,000 with Go + Docker', demand: '92 / 100' },
    'data-scientist': { median: '$135,000 / yr', lift: '+$35,000 with ML + PyTorch', demand: '91 / 100' },
    'machine-learning-engineer': { median: '$150,000 / yr', lift: '+$45,000 with LLMs + CUDA', demand: '98 / 100' },
  };
  const currentSalaryInfo = salaryMap[targetRole] || { median: '$120,000 / yr', lift: '+$25,000', demand: '90 / 100' };

  return (
    <div className="page-shell space-y-6 page-enter pb-16">

      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[var(--border-dim)] animate-fade-up">
        <div className="space-y-1">
          <p className="section-eyebrow">Decision Science & Real-time Compiler</p>
          <h1 className="section-title">What-If Simulator & Outage Drills</h1>
          <p className="text-[13px] text-[var(--text-secondary)]">
            Adjust study velocity and prior skills to recalibrate your entire career roadmap in real-time.
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
            <Sliders size={13} /> ⚡ Roadmap Recalculator
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

      {/* ── MODE 1: CAREER ROI & REAL-TIME WHAT-IF RECALCULATOR ──────── */}
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
                  View Roadmap <ArrowRight size={12} />
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

              {/* Target Role Selector */}
              <div className="space-y-2">
                <label className="text-[12px] font-mono text-[var(--text-muted)] flex items-center gap-1.5 font-bold">
                  <Briefcase size={13} /> TARGET CAREER ROLE
                </label>
                <select
                  value={targetRole}
                  onChange={e => handleRoleChange(e.target.value)}
                  className="w-full p-3.5 rounded-xl bg-[var(--bg-void)] border border-[var(--border-subtle)] text-[13px] font-bold text-[var(--text-primary)] outline-none cursor-pointer"
                >
                  {roles.map(r => (
                    <option key={r.id} value={r.id} className="bg-slate-900 text-white">
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Weekly Time Commitment Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[12px] font-mono">
                  <span className="text-[var(--text-muted)] font-bold flex items-center gap-1.5">
                    <Clock size={13} /> WEEKLY STUDY COMMITMENT
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

            {/* Fast-Track Prior Knowledge Toggles */}
            <div className="space-y-2 pt-4 border-t border-[var(--border-dim)]">
              <span className="text-[11px] font-mono text-[var(--text-muted)] flex items-center gap-1.5">
                <Sparkles size={12} className="text-amber-400" />
                <strong>Fast-Track Simulation:</strong> Test timeline if you already know these skills:
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
              <span className="text-[11px] font-mono text-[var(--text-muted)]">Median Role Salary</span>
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
                  Live Recomputed Roadmap Milestones
                </h3>
                <p className="text-[12px] text-slate-400">
                  {simulationResult?.simulatedItemsCount || 0} steps optimized for {weeklyHours}h/week study velocity.
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

                  <div className="space-y-1.5">
                    {mg.items.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.05] flex items-center justify-between gap-2 text-[11px]"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          {item.type === 'COURSE' ? (
                            <BookOpen size={11} className="text-cyan-400 shrink-0" />
                          ) : (
                            <Award size={11} className="text-amber-400 shrink-0" />
                          )}
                          <span className="text-slate-200 font-medium truncate">
                            {item.title}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          ~{item.estimatedHours || 3}h
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

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
