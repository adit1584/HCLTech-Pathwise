import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import type { RoadmapItem, RecompilationResult } from '../types';
import {
  CheckCircle2,
  Lock,
  Eye,
  Clock,
  TrendingUp,
  Loader2,
  Unlock,
  ChevronRight,
  BookOpen,
  Trophy,
  Zap,
  Code2,
  Flame,
  ArrowRight,
  HelpCircle,
  FolderGit2,
  RotateCcw,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { RecommendationTraceModal } from '../components/RecommendationTraceModal';
import { RecompilationBanner } from '../components/RecompilationBanner';
import { MilestoneAssessmentModal } from '../components/MilestoneAssessmentModal';
import { ProjectAssessmentModal } from '../components/ProjectAssessmentModal';
import { CelebrationModal } from '../components/CelebrationModal';
import { useToast } from '../components/Toast';
import { playVictoryChime, triggerConfetti } from '../utils/celebration';

const TYPE_STYLES: Record<string, { bg: string; border: string; text: string; label: string; icon: React.ReactNode }> = {
  PROJECT:    { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', text: 'var(--primary-300)', label: 'Capstone Project', icon: <Trophy size={11} /> },
  ASSESSMENT: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', text: 'var(--accent-300)', label: 'Milestone Assessment', icon: <Zap size={11} /> },
  COURSE:     { bg: 'rgba(14,165,233,0.12)', border: 'rgba(14,165,233,0.3)', text: 'var(--cyan-300)', label: 'Core Skill Module', icon: <BookOpen size={11} /> },
  RESOURCE:   { bg: 'rgba(14,165,233,0.1)',  border: 'rgba(14,165,233,0.25)', text: 'var(--cyan-300)', label: 'Skill Module', icon: <BookOpen size={11} /> },
  PRACTICE:   { bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.25)', text: 'var(--accent-300)', label: 'Coding Lab', icon: <Code2 size={11} /> },
};

const CANONICAL_SKILL_URLS: Record<string, { url: string; provider: string }> = {
  python: { url: 'https://cs50.harvard.edu/python/', provider: 'Harvard CS50' },
  javascript: { url: 'https://javascript.info/', provider: 'JavaScript.info' },
  typescript: { url: 'https://www.typescriptlang.org/docs/handbook/intro.html', provider: 'TypeScript Official' },
  react: { url: 'https://react.dev/learn', provider: 'React.dev' },
  sql: { url: 'https://mode.com/sql-tutorial/', provider: 'Mode Analytics' },
  nosql: { url: 'https://learn.mongodb.com/', provider: 'MongoDB University' },
  mongodb: { url: 'https://learn.mongodb.com/', provider: 'MongoDB University' },
  'machine-learning': { url: 'https://www.coursera.org/specializations/machine-learning-introduction', provider: 'Stanford / Andrew Ng' },
  'deep-learning': { url: 'https://course.fast.ai/', provider: 'fast.ai' },
  pandas: { url: 'https://www.kaggle.com/learn/pandas', provider: 'Kaggle Learn' },
  numpy: { url: 'https://numpy.org/doc/stable/user/quickstart.html', provider: 'NumPy Official' },
  'html-css': { url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content', provider: 'MDN Web Docs' },
  css: { url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout', provider: 'MDN Web Docs' },
  html: { url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content', provider: 'MDN Web Docs' },
  nodejs: { url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Server-side/Express_Nodejs', provider: 'MDN Web Docs' },
  node: { url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Server-side/Express_Nodejs', provider: 'MDN Web Docs' },
  git: { url: 'https://git-scm.com/book/en/v2', provider: 'Pro Git Book' },
  docker: { url: 'https://docs.docker.com/get-started/', provider: 'Docker Official' },
  nlp: { url: 'https://huggingface.co/learn/nlp-course', provider: 'Hugging Face' },
  statistics: { url: 'https://www.khanacademy.org/math/statistics-probability', provider: 'Khan Academy' },
  probability: { url: 'https://ocw.mit.edu/courses/18-05-introduction-to-probability-and-statistics-spring-2022/', provider: 'MIT OpenCourseWare' },
  eda: { url: 'https://www.kaggle.com/c/titanic', provider: 'Kaggle' },
  'feature-engineering': { url: 'https://www.kaggle.com/learn/feature-engineering', provider: 'Kaggle Learn' },
  'api-design': { url: 'https://github.com/donnemartin/system-design-primer', provider: 'System Design Primer' },
  testing: { url: 'https://docs.pytest.org/en/stable/getting-started.html', provider: 'Pytest Official' },
  linux: { url: 'https://linuxjourney.com/', provider: 'Linux Journey' },
  networking: { url: 'https://www.freecodecamp.org/news/free-computer-networking-course/', provider: 'freeCodeCamp' },
  'cybersecurity-fundamentals': { url: 'https://www.coursera.org/professional-certificates/google-cybersecurity', provider: 'Google' },
  'ethical-hacking': { url: 'https://www.hackthebox.com/hacker', provider: 'Hack The Box' },
  solidity: { url: 'https://docs.soliditylang.org/en/latest/', provider: 'Solidity Docs' },
  'smart-contracts': { url: 'https://ethereum.org/en/developers/docs/smart-contracts/', provider: 'Ethereum Foundation' },
  'system-design': { url: 'https://github.com/donnemartin/system-design-primer', provider: 'System Design Primer' },
  kubernetes: { url: 'https://kubernetes.io/docs/tutorials/', provider: 'Kubernetes Official' },
  'aws-cloud': { url: 'https://aws.amazon.com/training/', provider: 'AWS Training' },
  graphql: { url: 'https://graphql.org/learn/', provider: 'GraphQL.org' },
};

function getCanonicalUrl(title: string, skillIds?: string[]): { url: string; provider: string } {
  const primarySkill = (skillIds?.[0] || '').toLowerCase();
  for (const [key, val] of Object.entries(CANONICAL_SKILL_URLS)) {
    if (primarySkill === key || primarySkill.includes(key) || key.includes(primarySkill) || title.toLowerCase().includes(key)) {
      return val;
    }
  }
  return {
    url: `https://www.google.com/search?q=${encodeURIComponent(title + ' documentation tutorial')}`,
    provider: 'Official Documentation',
  };
}

export const RoadmapPage: React.FC = () => {
  const { success: toastSuccess } = useToast();
  const [roadmap, setRoadmap] = useState<RoadmapItem[]>([]);
  const [totalWeeks, setTotalWeeks] = useState(0);
  const [version, setVersion] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedSkillForTrace, setSelectedSkillForTrace] = useState<string | null>(null);
  const [recompilationResult, setRecompilationResult] = useState<RecompilationResult | null>(null);
  const [completingItem, setCompletingItem] = useState<string | null>(null);

  // Assessment Modals State
  const [assessmentTarget, setAssessmentTarget] = useState<{ skillId: string; title: string; item: RoadmapItem } | null>(null);
  const [projectAssessmentTarget, setProjectAssessmentTarget] = useState<{ skillId: string; title: string; item: RoadmapItem } | null>(null);

  // Joyful Celebration Modal State
  const [celebrationState, setCelebrationState] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    xpEarned?: number;
    score?: number;
    nextStepTitle?: string;
  }>({
    isOpen: false,
    title: '',
  });

  // Persistent Completed Items Set — strictly sanitized against malformed/generic IDs
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
            id !== 'null' &&
            id !== 'roadmap-item-skill' &&
            id !== 'skill' &&
            id !== '[object Object]'
          )
        );
      }
      return new Set();
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    try {
      const sanitized = Array.from(completedItemIds).filter(
        id => typeof id === 'string' && id.trim().length > 3 && id !== 'undefined' && id !== 'null'
      );
      localStorage.setItem('pathwise_completed_item_ids', JSON.stringify(sanitized));
    } catch (e) {
      console.error(e);
    }
  }, [completedItemIds]);

  const fetchRoadmap = async () => {
    try {
      setLoading(true);
      const res = await api.getCurrentPath();
      setRoadmap(res.roadmap || []);
      setTotalWeeks(res.totalEstimatedWeeks || 12);
      setVersion(res.version || 1);
    } catch {
      try {
        const res = await api.compilePath();
        setRoadmap(res.roadmap || []);
        setTotalWeeks(res.totalEstimatedWeeks || 12);
        setVersion(res.version || 1);
      } catch (err) {
        console.error('Failed to load roadmap:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadmap();
  }, []);

  // Check if an item is completed (strictly matching its own unique ID or status)
  const isItemCompleted = (item: RoadmapItem, explicitKey?: string) => {
    if (item.status === 'completed') return true;
    if (item.id && typeof item.id === 'string' && item.id.length > 3 && item.id !== 'undefined' && completedItemIds.has(item.id)) return true;
    if (explicitKey && completedItemIds.has(explicitKey)) return true;
    const fallbackKey = `roadmap-${item.type || 'skill'}-${item.skillIds?.[0] || 'skill'}-${(item.title || 'step').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    return completedItemIds.has(fallbackKey);
  };

  // ── Automatic Completion on Passing Milestone Assessment ─────────────────
  const handleAssessmentPassed = async (score: number) => {
    if (!assessmentTarget) return;

    const targetId = assessmentTarget.item.id || `assessment-${assessmentTarget.skillId}`;
    const targetTitle = assessmentTarget.title;

    // 1. Immediately mark as completed in local state & localStorage
    const nextCompleted = new Set(completedItemIds);
    nextCompleted.add(targetId);
    setCompletedItemIds(nextCompleted);
    localStorage.setItem('pathwise_completed_item_ids', JSON.stringify(Array.from(nextCompleted)));

    // Optimistically update roadmap item status
    setRoadmap(prev =>
      prev.map(item => ((item.id && item.id === targetId) || (item.title && item.title === targetTitle) ? { ...item, status: 'completed' } : item))
    );

    // 2. Open Joyful Celebration Modal
    setCelebrationState({
      isOpen: true,
      title: `${targetTitle} Conquered!`,
      subtitle: `Official assessment passed with a score of ${score}%. The dependency DAG has unlocked your next milestone!`,
      xpEarned: 100,
      score,
      nextStepTitle: 'Next Milestone Unlocked',
    });

    // 3. Recompile backend DAG to unlock subsequent items
    try {
      const recompileRes = await api.recompilePath(
        [assessmentTarget.skillId],
        `Passed Milestone Assessment for ${targetTitle} with ${score}%`
      );
      if (recompileRes?.roadmap) {
        setRoadmap(recompileRes.roadmap);
        setTotalWeeks(recompileRes.totalEstimatedWeeks);
        setVersion(recompileRes.version);
        setRecompilationResult(recompileRes.recompilation);
      }
    } catch (err) {
      console.warn('Backend recompile note:', err);
    }
  };

  // ── Automatic Completion on Passing Project Assessment ───────────────────
  const handleProjectPassed = async (score: number) => {
    if (!projectAssessmentTarget) return;

    const targetId = projectAssessmentTarget.item.id || `project-${projectAssessmentTarget.skillId}`;
    const targetTitle = projectAssessmentTarget.title;

    const nextCompleted = new Set(completedItemIds);
    nextCompleted.add(targetId);
    setCompletedItemIds(nextCompleted);
    localStorage.setItem('pathwise_completed_item_ids', JSON.stringify(Array.from(nextCompleted)));

    setRoadmap(prev =>
      prev.map(item => ((item.id && item.id === targetId) || (item.title && item.title === targetTitle) ? { ...item, status: 'completed' } : item))
    );

    setCelebrationState({
      isOpen: true,
      title: `Capstone Project Verified!`,
      subtitle: `Hands-on project for ${targetTitle} verified with ${score}% grade. Outstanding engineering work!`,
      xpEarned: 200,
      score,
      nextStepTitle: 'Production Ready Competency',
    });

    try {
      const recompileRes = await api.recompilePath(
        [projectAssessmentTarget.skillId],
        `Completed Capstone Project for ${targetTitle}`
      );
      if (recompileRes?.roadmap) {
        setRoadmap(recompileRes.roadmap);
        setTotalWeeks(recompileRes.totalEstimatedWeeks);
        setVersion(recompileRes.version);
        setRecompilationResult(recompileRes.recompilation);
      }
    } catch (err) {
      console.warn('Backend recompile note:', err);
    }
  };

  // ── Toggle Completion for Regular Learning Steps ─────────────────────────
  const toggleCompleteItem = async (item: RoadmapItem, explicitKey?: string) => {
    const itemTitleSlug = (item.title || 'step').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const itemKey = (explicitKey && explicitKey.length > 3)
      ? explicitKey
      : (item.id && typeof item.id === 'string' && item.id.length > 3 && item.id !== 'undefined')
      ? item.id
      : `roadmap-step-${item.skillIds?.[0] || 'skill'}-${itemTitleSlug}`;

    if (!itemKey || itemKey === 'undefined' || itemKey === 'null') return;

    setCompletingItem(itemKey);
    const wasCompleted = isItemCompleted(item, itemKey);
    const nextCompleted = new Set(completedItemIds);

    if (wasCompleted) {
      nextCompleted.delete(itemKey);
      if (item.id && item.id.length > 3) nextCompleted.delete(item.id);
      setCompletedItemIds(nextCompleted);
      localStorage.setItem('pathwise_completed_item_ids', JSON.stringify(Array.from(nextCompleted)));
      setRoadmap(prev =>
        prev.map(i => {
          const match = (item.id && i.id && i.id === item.id) || (i.title && i.title === item.title);
          return match ? { ...i, status: 'available' } : i;
        })
      );
      toastSuccess(`Marked "${item.title}" as incomplete.`);
      setCompletingItem(null);
    } else {
      nextCompleted.add(itemKey);
      if (item.id && item.id.length > 3) nextCompleted.add(item.id);
      setCompletedItemIds(nextCompleted);
      localStorage.setItem('pathwise_completed_item_ids', JSON.stringify(Array.from(nextCompleted)));

      setRoadmap(prev =>
        prev.map(i => {
          const match = (item.id && i.id && i.id === item.id) || (i.title && i.title === item.title);
          return match ? { ...i, status: 'completed' } : i;
        })
      );

      // Trigger Confetti & Chime on completing this module
      playVictoryChime();
      triggerConfetti(2500);

      try {
        await api.recordProgressEvent({
          type: 'RESOURCE_COMPLETED',
          skillIds: item.skillIds?.length ? item.skillIds : ['sql'],
          resourceId: itemKey,
          score: 100,
          metadata: { title: item.title },
        });
        toastSuccess(`🎉 ✓ Completed: ${item.title}! +50 XP Earned.`);
      } catch (err) {
        console.error('Failed to log completion event:', err);
      } finally {
        setCompletingItem(null);
      }
    }
  };

  // ── Group by milestone ───────────────────────────────────────────────────
  const milestones = useMemo(() => {
    const map: Record<number, RoadmapItem[]> = {};
    roadmap.forEach(item => {
      const m = item.milestone || 1;
      if (!map[m]) map[m] = [];
      map[m].push(item);
    });
    return map;
  }, [roadmap]);

  // ── Dynamic Accurate Roadmap Completion Tracker ──────────────────────────
  const totalSteps = roadmap.length;
  const completedCount = useMemo(() => {
    return roadmap.filter(i => isItemCompleted(i)).length;
  }, [roadmap, completedItemIds]);

  const progressPercent = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

  return (
    <div className="page-shell space-y-6 page-enter pb-20">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[var(--border-dim)] animate-fade-up">
        <div className="space-y-1">
          <p className="section-eyebrow">Prerequisite-Aware Sequence</p>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="section-title">Personalized Roadmap</h1>
            <span className="badge badge-amber text-[10px] font-mono font-bold">
              v{version}.0 ACTIVE DAG
            </span>
          </div>
          <p className="text-[13px] text-[var(--text-secondary)]">
            {totalWeeks} weeks estimated · <strong className="text-emerald-400">{completedCount} of {totalSteps} steps completed</strong> ({progressPercent}%)
          </p>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono text-[var(--text-muted)] flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--primary-500)] animate-pulse" /> Available
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-500)]" /> Completed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--border-muted)]" /> Locked
          </span>
        </div>
      </div>

      {/* Recompilation banner */}
      {recompilationResult && (
        <RecompilationBanner result={recompilationResult} onDismiss={() => setRecompilationResult(null)} />
      )}

      {/* ── Working Dynamic Progress Overview Tracker ───────────── */}
      <div className="p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-3.5 animate-fade-up shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="badge badge-emerald text-[9px] font-mono font-bold">
                <Sparkles size={10} /> ROADMAP COMPLETION TRACKER
              </span>
              <span className="text-xs font-mono text-[var(--text-muted)] font-bold">
                {completedCount} / {totalSteps} Steps Completed
              </span>
            </div>
            <h2 className="text-sm font-bold text-white font-display">
              Overall Roadmap Progress
            </h2>
          </div>

          <div className="text-right">
            <span className="text-xl font-black font-mono text-amber-300">
              {progressPercent}%
            </span>
          </div>
        </div>

        {/* Working Dynamic Glowing Progress Bar */}
        <div className="w-full h-3 rounded-full bg-[var(--bg-void)] border border-[var(--border-subtle)] overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-emerald-400 to-cyan-400 rounded-full transition-all duration-700 ease-out shadow-[0_0_12px_rgba(245,158,11,0.5)]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* ── Milestone Timeline ──────────────────────────────── */}
      {loading ? (
        <div className="py-16 text-center card space-y-3 animate-fade-in">
          <Loader2 size={28} className="text-[var(--primary-500)] animate-spin mx-auto" />
          <p className="text-[13px] text-[var(--text-secondary)] font-mono">
            Compiling prerequisite dependency graph and verifying milestones…
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {Object.entries(milestones).map(([mNum, items], mIdx) => {
            const mCompletedCount = items.filter(i => isItemCompleted(i)).length;
            const mTotalCount = items.length;
            const mCompleted = mCompletedCount === mTotalCount && mTotalCount > 0;
            const mActive = items.some(i => i.status === 'available');

            return (
              <section
                key={mNum}
                className="animate-fade-up space-y-4"
                style={{ animationDelay: `${mIdx * 60}ms` }}
              >
                {/* Milestone heading */}
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-xs font-bold font-mono transition-all shadow-md"
                    style={{
                      background: mCompleted ? 'rgba(16,185,129,0.18)' : mActive ? 'rgba(245,158,11,0.18)' : 'rgba(255,255,255,0.04)',
                      border: `1.5px solid ${mCompleted ? 'rgba(16,185,129,0.5)' : mActive ? 'rgba(245,158,11,0.5)' : 'var(--border-dim)'}`,
                      color: mCompleted ? 'var(--accent-400)' : mActive ? 'var(--primary-300)' : 'var(--text-muted)',
                    }}
                    aria-label={`Milestone ${mNum}`}
                  >
                    M{mNum}
                  </div>
                  <div className="flex-1 flex items-center gap-3 min-w-0">
                    <h2 className="text-base font-bold text-[var(--text-primary)] font-display whitespace-nowrap">
                      Milestone {mNum}
                    </h2>
                    <div className="flex-1 h-px bg-[var(--border-dim)]" />
                    <span className="text-xs font-mono text-[var(--text-muted)] whitespace-nowrap">
                      <strong className={mCompleted ? 'text-emerald-400' : 'text-white'}>
                        {mCompletedCount} / {mTotalCount} Done
                      </strong>
                    </span>
                    {mCompleted && (
                      <span className="badge badge-emerald text-[9px] font-mono font-bold">
                        ✓ COMPLETED
                      </span>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-3 ml-2 sm:ml-12">
                  {items.map((item, idx) => {
                    const itemTitleSlug = (item.title || 'step').toLowerCase().replace(/[^a-z0-9]+/g, '-');
                    const itemKey = (item.id && item.id.trim().length > 3 && item.id !== 'undefined' && item.id !== 'null')
                      ? item.id
                      : `roadmap-${item.type || 'skill'}-${item.skillIds?.[0] || 'skill'}-m${mNum}-${itemTitleSlug}-${idx}`;
                    const isCompleted = isItemCompleted(item, itemKey);
                    const isAvailable = item.status === 'available';
                    const isAssessmentType = item.type === 'ASSESSMENT';
                    const isProjectType = item.type === 'PROJECT';

                    const typeStyle = TYPE_STYLES[item.type] || TYPE_STYLES.RESOURCE;
                    const canonicalUrl = getCanonicalUrl(item.title, item.skillIds);

                    const resolvedSkillId = (item.skillIds?.[0]?.startsWith('assessment-') || item.skillIds?.[0]?.startsWith('project-'))
                      ? (item.prerequisiteIds?.[0] || 'sql')
                      : (item.skillIds?.[0] || 'sql');

                    return (
                      <article
                        key={item.id || itemKey}
                        className={`rounded-2xl border p-5 transition-all animate-fade-up ${
                          isCompleted
                            ? 'bg-[rgba(16,185,129,0.03)] border-[rgba(16,185,129,0.3)] shadow-sm'
                            : isAvailable
                            ? 'bg-[var(--bg-surface)] border-[rgba(245,158,11,0.35)] shadow-[0_0_0_1px_rgba(245,158,11,0.1),0_12px_28px_-8px_rgba(0,0,0,0.5)]'
                            : 'bg-[var(--bg-base)] border-[var(--border-dim)]'
                        }`}
                        style={{ animationDelay: `${mIdx * 60 + idx * 30}ms` }}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          
                          {/* Left: Info & Badges */}
                          <div className="space-y-2 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Type badge */}
                              <span
                                className="badge text-[9.5px] font-mono font-bold"
                                style={{ background: typeStyle.bg, borderColor: typeStyle.border, color: typeStyle.text }}
                              >
                                {typeStyle.icon} {typeStyle.label}
                              </span>

                              {isCompleted && (
                                <span className="badge badge-emerald text-[9px] font-mono font-bold">
                                  <CheckCircle2 size={10} /> Verified Complete
                                </span>
                              )}

                              {isAvailable && !isCompleted && (
                                <span className="badge badge-amber text-[9px] font-mono font-bold animate-pulse">
                                  Ready to Start
                                </span>
                              )}
                            </div>

                            <h3 className={`text-base font-bold font-display leading-tight ${isCompleted ? 'text-emerald-200' : 'text-white'}`}>
                              {item.title}
                            </h3>
                            <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">{item.reason}</p>

                            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 pt-1 font-mono">
                              <span className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                                <Clock size={11} className="text-[var(--text-muted)]" />
                                ~{item.estimatedHours}h
                              </span>
                              {item.priorityScore > 0 && (
                                <span className="flex items-center gap-1.5 text-[11px] text-[var(--primary-400)]">
                                  <TrendingUp size={11} />
                                  Priority {item.priorityScore.toFixed(2)}
                                </span>
                              )}
                              {item.unlocks?.length > 0 && (
                                <span className="flex items-center gap-1.5 text-[11px] text-[var(--accent-400)]">
                                  <Unlock size={11} />
                                  Unlocks {item.unlocks.length} node{item.unlocks.length > 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Right Actions */}
                          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0 self-start sm:self-center">
                            
                            {/* Trace button if available */}
                            {item.skillIds?.[0] && (
                              <button
                                onClick={() => setSelectedSkillForTrace(item.skillIds[0])}
                                className="btn btn-ghost btn-xs font-mono text-[10px]"
                                aria-label="View recommendation trace"
                                title="View DAG prerequisite trace"
                              >
                                <Eye size={11} /> Trace
                              </button>
                            )}

                            {/* ── CASE 1: MILESTONE ASSESSMENT (Pure Assessment — No Courses/Videos) ── */}
                            {isAssessmentType && (
                              isCompleted ? (
                                <div className="flex items-center gap-2">
                                  <span className="badge badge-emerald text-[10px] font-mono font-bold flex items-center gap-1">
                                    <CheckCircle2 size={11} /> Passed
                                  </span>
                                  <button
                                    onClick={() => setAssessmentTarget({ skillId: resolvedSkillId, title: item.title, item })}
                                    className="btn btn-secondary btn-xs font-mono text-[10px] flex items-center gap-1 cursor-pointer"
                                    title="Retake milestone quiz"
                                  >
                                    <RotateCcw size={10} />
                                    <span>Retake Test</span>
                                  </button>
                                </div>
                              ) : (
                                <button
                                  id={`roadmap-quiz-${item.id}`}
                                  onClick={() => setAssessmentTarget({ skillId: resolvedSkillId, title: item.title, item })}
                                  className="btn btn-primary btn-sm font-mono text-[11px] flex items-center gap-1.5 shadow-md cursor-pointer"
                                  aria-label={`Take assessment for ${item.title}`}
                                >
                                  <HelpCircle size={13} />
                                  <span>Take Milestone Assessment</span>
                                  <ChevronRight size={11} />
                                </button>
                              )
                            )}

                            {/* ── CASE 2: CAPSTONE PROJECT (Pure Project Assessment — No Videos) ── */}
                            {isProjectType && (
                              isCompleted ? (
                                <div className="flex items-center gap-2">
                                  <span className="badge badge-emerald text-[10px] font-mono font-bold flex items-center gap-1">
                                    <CheckCircle2 size={11} /> Passed
                                  </span>
                                  <button
                                    onClick={() => setProjectAssessmentTarget({ skillId: resolvedSkillId, title: item.title, item })}
                                    className="btn btn-secondary btn-xs font-mono text-[10px] flex items-center gap-1 cursor-pointer"
                                    title="Review submitted code or retake project"
                                  >
                                    <RotateCcw size={10} />
                                    <span>Retake Project</span>
                                  </button>
                                </div>
                              ) : (
                                <button
                                  id={`roadmap-project-${item.id}`}
                                  onClick={() => setProjectAssessmentTarget({ skillId: resolvedSkillId, title: item.title, item })}
                                  className="btn btn-primary btn-sm font-mono text-[11px] flex items-center gap-1.5 shadow-md cursor-pointer"
                                  aria-label={`Start Project Assessment for ${item.title}`}
                                >
                                  <FolderGit2 size={13} />
                                  <span>Start Project Assessment</span>
                                  <ChevronRight size={11} />
                                </button>
                              )
                            )}

                            {/* ── CASE 3: REGULAR LEARNING MODULE ── */}
                            {!isAssessmentType && !isProjectType && (
                              <>
                                <a
                                  href={canonicalUrl.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-ghost btn-xs font-mono text-[10px] text-[var(--cyan-300)] hover:bg-[rgba(14,165,233,0.12)] border border-[rgba(14,165,233,0.3)] flex items-center gap-1"
                                  title={`Open ${item.title} documentation`}
                                >
                                  <BookOpen size={11} />
                                  <span>Docs ↗</span>
                                </a>

                                {isCompleted ? (
                                  <button
                                    id={`roadmap-complete-${itemKey}`}
                                    onClick={() => toggleCompleteItem(item, itemKey)}
                                    disabled={completingItem === itemKey}
                                    className="btn btn-xs font-mono text-[11px] px-3 py-1.5 flex items-center gap-1.5 bg-[rgba(16,185,129,0.18)] text-[var(--accent-300)] border border-[rgba(16,185,129,0.4)] hover:bg-[rgba(239,68,68,0.15)] hover:text-red-300 hover:border-red-500/40 transition-all cursor-pointer group"
                                    title="Completed (Click to unmark)"
                                  >
                                    {completingItem === itemKey ? (
                                      <Loader2 size={11} className="animate-spin" />
                                    ) : (
                                      <>
                                        <CheckCircle2 size={11} className="text-[var(--accent-400)] group-hover:hidden" />
                                        <span className="group-hover:hidden">Completed</span>
                                        <RotateCcw size={11} className="hidden group-hover:inline text-red-400" />
                                        <span className="hidden group-hover:inline text-red-300">Unmark</span>
                                      </>
                                    )}
                                  </button>
                                ) : (
                                  <button
                                    id={`roadmap-complete-${itemKey}`}
                                    onClick={() => toggleCompleteItem(item, itemKey)}
                                    disabled={completingItem === itemKey}
                                    className="btn btn-secondary btn-sm font-mono text-[11px] flex items-center gap-1.5 border-[var(--border-subtle)] hover:border-[var(--accent-400)] hover:text-[var(--accent-300)] cursor-pointer active:scale-95"
                                    title="Mark step as complete"
                                  >
                                    {completingItem === itemKey ? (
                                      <Loader2 size={11} className="animate-spin" />
                                    ) : (
                                      <CheckCircle2 size={11} />
                                    )}
                                    <span>Mark Complete</span>
                                  </button>
                                )}
                              </>
                            )}

                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* ── Milestone Assessment Modal ──────────────────────────── */}
      {assessmentTarget && (
        <MilestoneAssessmentModal
          skillId={assessmentTarget.skillId}
          topicTitle={assessmentTarget.title}
          isOpen={Boolean(assessmentTarget)}
          onClose={() => setAssessmentTarget(null)}
          onAssessmentPassed={handleAssessmentPassed}
        />
      )}

      {/* ── Hands-On Project Assessment Modal ───────────────────── */}
      {projectAssessmentTarget && (
        <ProjectAssessmentModal
          skillId={projectAssessmentTarget.skillId}
          topicTitle={projectAssessmentTarget.title}
          isOpen={Boolean(projectAssessmentTarget)}
          onClose={() => setProjectAssessmentTarget(null)}
          onProjectPassed={handleProjectPassed}
        />
      )}

      {/* ── Joyful Celebration Modal ────────────────────────────── */}
      {celebrationState.isOpen && (
        <CelebrationModal
          isOpen={celebrationState.isOpen}
          onClose={() => setCelebrationState(prev => ({ ...prev, isOpen: false }))}
          title={celebrationState.title}
          subtitle={celebrationState.subtitle}
          xpEarned={celebrationState.xpEarned}
          score={celebrationState.score}
          nextStepTitle={celebrationState.nextStepTitle}
        />
      )}

      {/* Trace Modal */}
      {selectedSkillForTrace && (
        <RecommendationTraceModal
          skillId={selectedSkillForTrace}
          isOpen={Boolean(selectedSkillForTrace)}
          onClose={() => setSelectedSkillForTrace(null)}
        />
      )}
    </div>
  );
};
