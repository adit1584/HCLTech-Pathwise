import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import type { LearnerProfile, RoadmapItem, TargetRole } from '../types';
import {
  Sliders,
  Sparkles,
  ArrowRight,
  Clock,
  Zap,
  TrendingUp,
  CheckCircle2,
  Calendar,
  Layers,
  RotateCcw,
  Check,
  ShieldAlert,
} from 'lucide-react';

export const WhatIfSimulatorPage: React.FC = () => {
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();

  const [profile, setProfile] = useState<LearnerProfile | null>(null);
  const [baseRoadmap, setBaseRoadmap] = useState<RoadmapItem[]>([]);
  const [baseWeeks, setBaseWeeks] = useState<number>(14);
  const [roles, setRoles] = useState<TargetRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);

  // Simulation controls
  const [simWeeklyHours, setSimWeeklyHours] = useState<number>(10);
  const [skippedSkills, setSkippedSkills] = useState<Set<string>>(new Set());
  const [simTargetRole, setSimTargetRole] = useState<string>('data-scientist');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [prof, road, availableRoles] = await Promise.all([
          api.getProfile(),
          api.getCurrentPath(),
          api.getRoles(),
        ]);
        setProfile(prof);
        setBaseRoadmap(road.roadmap || []);
        setBaseWeeks(road.totalEstimatedWeeks || 14);
        setSimWeeklyHours(prof.weeklyHours || 10);
        const activeRole = prof.goals?.[prof.goals.length - 1]?.targetRole || 'data-scientist';
        setSimTargetRole(activeRole);
        setRoles(availableRoles.roles || []);
      } catch (err) {
        console.error('Failed to load what-if data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Compute total hours in active roadmap
  const totalBaseHours = baseRoadmap.reduce((sum, item) => sum + (item.estimatedHours || 5), 0) || 140;

  // Filter out skipped skill hours
  const simulatedRemainingHours = baseRoadmap
    .filter(item => {
      const skillId = item.skillIds?.[0];
      return !skillId || !skippedSkills.has(skillId);
    })
    .reduce((sum, item) => sum + (item.estimatedHours || 5), 0);

  // Simulated weeks calculation
  const simWeeks = Math.max(1, Math.ceil(simulatedRemainingHours / (simWeeklyHours || 10)));
  const weeksSaved = Math.max(0, baseWeeks - simWeeks);
  const accelerationRatio = ((baseWeeks / simWeeks) || 1).toFixed(2);

  // Target completion date calculation
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + simWeeks * 7);
  const formattedTargetDate = targetDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const toggleSkipSkill = (skillId: string) => {
    setSkippedSkills(prev => {
      const next = new Set(prev);
      if (next.has(skillId)) {
        next.delete(skillId);
      } else {
        next.add(skillId);
      }
      return next;
    });
  };

  const handleApplyScenario = async () => {
    setIsApplying(true);
    try {
      // Recompile with the simulated weekly hours and profile update
      await api.updateProfile({
        weeklyHours: simWeeklyHours,
      });

      await api.recompilePath(
        Array.from(skippedSkills).length > 0 ? Array.from(skippedSkills) : ['sql'],
        `What-If Scenario applied: ${simWeeklyHours} hrs/week, ${skippedSkills.size} skills bypassed`
      );

      toastSuccess(`✨ What-If Scenario Applied! Roadmap recompiled to ${simWeeks} weeks.`);
      navigate('/roadmap');
    } catch (err) {
      console.error('Failed to apply scenario:', err);
      toastError('Could not apply simulation to roadmap.');
    } finally {
      setIsApplying(false);
    }
  };

  const handleReset = () => {
    if (profile) {
      setSimWeeklyHours(profile.weeklyHours || 10);
      setSkippedSkills(new Set());
    }
  };

  return (
    <div className="page-shell space-y-8 page-enter pb-20">

      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-dim)] pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="badge badge-amber text-[10px] font-mono font-bold flex items-center gap-1">
              <Sliders size={11} /> SCENARIO SIMULATOR
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[var(--text-primary)] font-display">
            Interactive What-If Scenario Planner
          </h1>
          <p className="text-[13px] text-[var(--text-secondary)] max-w-xl">
            Simulate study velocity changes, bypass already mastered prerequisites, or test role pivots — without altering your live data until you choose to commit.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="btn btn-secondary btn-sm text-[12px] font-mono flex items-center gap-1.5"
          >
            <RotateCcw size={12} />
            <span>Reset Defaults</span>
          </button>
          <button
            onClick={handleApplyScenario}
            disabled={isApplying}
            className="btn btn-primary btn-sm text-[12px] flex items-center gap-1.5 shadow-md"
          >
            <Sparkles size={13} />
            <span>Commit to Roadmap</span>
          </button>
        </div>
      </div>

      {/* ── Simulation KPI Dashboard Strip ───────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-up">
        <div className="card p-5 space-y-1 bg-[var(--bg-surface)] border-[rgba(245,158,11,0.25)]">
          <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
            <span>Simulated Duration</span>
            <Clock size={13} className="text-[var(--primary-400)]" />
          </div>
          <div className="text-2xl font-black font-mono text-[var(--primary-300)]">
            {simWeeks} <span className="text-sm font-normal text-[var(--text-muted)]">weeks</span>
          </div>
          <p className="text-[10px] font-mono text-[var(--accent-400)]">
            {weeksSaved > 0 ? `⚡ ${weeksSaved}w faster than baseline` : 'Baseline pace'}
          </p>
        </div>

        <div className="card p-5 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
            <span>Target Completion</span>
            <Calendar size={13} className="text-[var(--accent-400)]" />
          </div>
          <div className="text-lg font-bold font-mono text-[var(--text-primary)]">
            {formattedTargetDate}
          </div>
          <p className="text-[10px] font-mono text-[var(--text-muted)]">
            At {simWeeklyHours} hours / week
          </p>
        </div>

        <div className="card p-5 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
            <span>Pace Multiplier</span>
            <TrendingUp size={13} className="text-[var(--cyan-400)]" />
          </div>
          <div className="text-2xl font-black font-mono text-[var(--cyan-300)]">
            {accelerationRatio}x
          </div>
          <p className="text-[10px] font-mono text-[var(--text-muted)]">
            Learning velocity factor
          </p>
        </div>

        <div className="card p-5 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
            <span>Bypassed Skills</span>
            <Layers size={13} className="text-[var(--primary-400)]" />
          </div>
          <div className="text-2xl font-black font-mono text-[var(--text-primary)]">
            {skippedSkills.size}
          </div>
          <p className="text-[10px] font-mono text-[var(--text-muted)]">
            Pre-mastered topics
          </p>
        </div>
      </div>

      {/* ── Interactive Controls Grid ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Control 1: Weekly Study Velocity Slider ────────────────── */}
        <div className="card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className="text-[15px] font-bold text-[var(--text-primary)] font-display">
                Weekly Study Capacity
              </h2>
              <p className="text-[12px] text-[var(--text-secondary)]">
                Adjust how many hours you can commit per week.
              </p>
            </div>
            <span className="font-mono text-xl font-bold text-[var(--primary-300)] bg-[rgba(245,158,11,0.12)] border border-[rgba(245,158,11,0.3)] px-3 py-1 rounded-xl">
              {simWeeklyHours} hrs/wk
            </span>
          </div>

          <div className="space-y-2 pt-2">
            <input
              type="range"
              min="5"
              max="35"
              step="2"
              value={simWeeklyHours}
              onChange={e => setSimWeeklyHours(parseInt(e.target.value))}
              className="w-full h-2 bg-[var(--bg-void)] rounded-lg appearance-none cursor-pointer accent-[var(--primary-400)] border border-[var(--border-dim)]"
              aria-label="Weekly study hours slider"
            />
            <div className="flex justify-between text-[10px] font-mono text-[var(--text-muted)]">
              <span>5h (Casual)</span>
              <span>15h (Standard)</span>
              <span>25h (Intensive)</span>
              <span>35h (Bootcamp)</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[var(--bg-void)] border border-[var(--border-subtle)] text-[12px] font-mono space-y-1.5 text-[var(--text-secondary)]">
            <div className="flex justify-between">
              <span>Total Learning Hours:</span>
              <span className="text-[var(--text-primary)] font-bold">{simulatedRemainingHours}h</span>
            </div>
            <div className="flex justify-between">
              <span>Milestone Velocity:</span>
              <span className="text-[var(--accent-400)] font-bold">~{(simWeeklyHours / 12).toFixed(2)} milestones / month</span>
            </div>
          </div>
        </div>

        {/* ── Control 2: Skill Bypass / Mastered Prerequisite Simulator ── */}
        <div className="card p-6 space-y-5">
          <div className="space-y-0.5">
            <h2 className="text-[15px] font-bold text-[var(--text-primary)] font-display">
              Pre-Mastered Skill Bypass Simulator
            </h2>
            <p className="text-[12px] text-[var(--text-secondary)]">
              Toggle skills you already know. The DAG recompiler will compress downstream milestones.
            </p>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {baseRoadmap.map((item, idx) => {
              const skillId = item.skillIds?.[0] || `skill-${idx}`;
              const isSkipped = skippedSkills.has(skillId);

              return (
                <button
                  key={item.id || idx}
                  onClick={() => toggleSkipSkill(skillId)}
                  className={`w-full p-3 rounded-xl border text-left text-[12px] font-mono flex items-center justify-between transition-all cursor-pointer ${
                    isSkipped
                      ? 'bg-[rgba(16,185,129,0.12)] border-[rgba(16,185,129,0.4)] text-[var(--text-primary)]'
                      : 'bg-[var(--bg-void)] border-[var(--border-dim)] text-[var(--text-secondary)] hover:border-[var(--border-muted)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        isSkipped ? 'bg-[var(--accent-500)] text-slate-950' : 'border border-[var(--border-subtle)]'
                      }`}
                    >
                      {isSkipped && <Check size={10} strokeWidth={3} />}
                    </div>
                    <span className={`truncate ${isSkipped ? 'line-through text-[var(--accent-300)]' : ''}`}>
                      {item.title}
                    </span>
                  </div>

                  <span className="text-[10px] text-[var(--text-muted)] shrink-0">
                    {item.estimatedHours}h
                  </span>
                </button>
              );
            })}
          </div>

          {skippedSkills.size > 0 && (
            <div className="p-3 rounded-xl bg-[rgba(16,185,129,0.08)] border border-[rgba(16,185,129,0.25)] text-[11px] font-mono text-[var(--accent-300)] flex items-center gap-2">
              <CheckCircle2 size={13} />
              <span>Bypassing {skippedSkills.size} topics saves ~{baseRoadmap.filter(i => skippedSkills.has(i.skillIds?.[0])).reduce((s, i) => s + (i.estimatedHours || 5), 0)} hours of study!</span>
            </div>
          )}
        </div>

      </div>

      {/* ── Commit Banner ───────────────────────────────────────────── */}
      <div className="p-6 rounded-2xl bg-[linear-gradient(135deg,rgba(30,22,12,0.85)_0%,var(--bg-surface)_100%)] border border-[rgba(245,158,11,0.3)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-base font-bold text-[var(--text-primary)] font-display">
            Ready to commit this simulated timeline?
          </h3>
          <p className="text-[12px] text-[var(--text-secondary)]">
            Applying this scenario will recompile your active roadmap to {simWeeks} weeks at {simWeeklyHours} hours/week.
          </p>
        </div>

        <button
          onClick={handleApplyScenario}
          disabled={isApplying}
          className="btn btn-primary text-xs px-5 py-2.5 flex items-center gap-1.5 shadow-md shrink-0"
        >
          <Sparkles size={13} />
          <span>{isApplying ? 'Recompiling Path...' : 'Apply Scenario to Roadmap'}</span>
          <ArrowRight size={13} />
        </button>
      </div>

    </div>
  );
};
