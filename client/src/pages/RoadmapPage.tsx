import React, { useEffect, useState } from 'react';
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
  ExternalLink,
  BookOpen,
  Trophy,
  Zap,
  Code2,
  Flame,
  ArrowRight,
  Video,
  FileText,
  HelpCircle,
  FolderGit2,
  RotateCcw,
} from 'lucide-react';
import { RecommendationTraceModal } from '../components/RecommendationTraceModal';
import { RecompilationBanner } from '../components/RecompilationBanner';
import { MilestoneAssessmentModal } from '../components/MilestoneAssessmentModal';
import { ProjectAssessmentModal } from '../components/ProjectAssessmentModal';
import { useToast } from '../components/Toast';

const TYPE_STYLES: Record<string, { bg: string; border: string; text: string; label: string; icon: React.ReactNode }> = {
  PROJECT:    { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', text: 'var(--primary-300)', label: 'Project', icon: <Trophy size={10} /> },
  ASSESSMENT: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', text: 'var(--accent-300)', label: 'Assessment', icon: <Zap size={10} /> },
  COURSE:     { bg: 'rgba(14,165,233,0.12)', border: 'rgba(14,165,233,0.3)', text: 'var(--cyan-300)', label: 'Course', icon: <BookOpen size={10} /> },
  RESOURCE:   { bg: 'rgba(14,165,233,0.1)',  border: 'rgba(14,165,233,0.25)', text: 'var(--cyan-300)', label: 'Resource', icon: <BookOpen size={10} /> },
  PRACTICE:   { bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.25)', text: 'var(--accent-300)', label: 'Practice', icon: <Code2 size={10} /> },
};

const CANONICAL_VIDEOS: Record<string, { title: string; url: string; creator: string }> = {
  python: { title: 'CS50 Python Full Course', url: 'https://www.youtube.com/watch?v=nLRL_NcnK-4', creator: 'Harvard CS50' },
  javascript: { title: 'JavaScript Full Course for Beginners', url: 'https://www.youtube.com/watch?v=PkZNo7MFNFg', creator: 'freeCodeCamp' },
  typescript: { title: 'TypeScript Full Tutorial', url: 'https://www.youtube.com/watch?v=BwuLxPH8IDs', creator: 'freeCodeCamp' },
  react: { title: 'React 19 Full Course', url: 'https://www.youtube.com/watch?v=2OTq15A5s0Y', creator: 'freeCodeCamp' },
  sql: { title: 'SQL Full Database Course', url: 'https://www.youtube.com/watch?v=HXV3zeRR3h4', creator: 'freeCodeCamp / Mike Dane' },
  mongodb: { title: 'MongoDB Full Course', url: 'https://www.youtube.com/watch?v=ExcRbA7fy_A', creator: 'freeCodeCamp' },
  nosql: { title: 'MongoDB Full Course', url: 'https://www.youtube.com/watch?v=ExcRbA7fy_A', creator: 'freeCodeCamp' },
  'machine-learning': { title: 'Machine Learning Specialization', url: 'https://www.youtube.com/watch?v=jGwO_UgTS7I', creator: 'Stanford / Andrew Ng' },
  'deep-learning': { title: 'Neural Networks: Zero to Hero', url: 'https://www.youtube.com/watch?v=VMj-3S1tku0', creator: 'Andrej Karpathy' },
  pandas: { title: 'Pandas & Python for Data Analysis', url: 'https://www.youtube.com/watch?v=r-uOLxNrNk8', creator: 'freeCodeCamp / Keith Galli' },
  numpy: { title: 'NumPy Full Tutorial', url: 'https://www.youtube.com/watch?v=QUT1VHiLmmI', creator: 'freeCodeCamp / Keith Galli' },
  'html-css': { title: 'HTML & CSS Full Course - Beginner to Pro', url: 'https://www.youtube.com/watch?v=G3e-cpL7ofc', creator: 'SuperSimpleDev' },
  css: { title: 'CSS Full Course for Beginners', url: 'https://www.youtube.com/watch?v=1Rs2ND1ryYc', creator: 'freeCodeCamp' },
  html: { title: 'HTML Full Course for Beginners', url: 'https://www.youtube.com/watch?v=kUMe1FH4CHE', creator: 'freeCodeCamp' },
  nodejs: { title: 'Node.js and Express.js - Full Course', url: 'https://www.youtube.com/watch?v=Oe421EPjeBE', creator: 'freeCodeCamp / John Smilga' },
  node: { title: 'Node.js and Express.js - Full Course', url: 'https://www.youtube.com/watch?v=Oe421EPjeBE', creator: 'freeCodeCamp' },
  git: { title: 'Git and GitHub for Beginners', url: 'https://www.youtube.com/watch?v=RGOj5yH7evk', creator: 'freeCodeCamp' },
  docker: { title: 'Docker Tutorial for Beginners', url: 'https://www.youtube.com/watch?v=fqMOX6JJhGo', creator: 'TechWorld with Nana' },
  nlp: { title: 'NLP & Transformers Illustrated', url: 'https://www.youtube.com/watch?v=zxQyTK8quyY', creator: 'StatQuest with Josh Starmer' },
  statistics: { title: 'Statistics Fundamentals Playlist', url: 'https://www.youtube.com/watch?v=qBigTkBLU6g', creator: 'StatQuest with Josh Starmer' },
  probability: { title: 'Probability and Statistics', url: 'https://www.youtube.com/watch?v=qBigTkBLU6g', creator: 'StatQuest' },
  eda: { title: 'Exploratory Data Analysis with Python', url: 'https://www.youtube.com/watch?v=liv71fGdrpE', creator: 'freeCodeCamp' },
  'feature-engineering': { title: 'Feature Engineering for Machine Learning', url: 'https://www.youtube.com/watch?v=6WDFfaYtN6D', creator: 'StatQuest' },
  'api-design': { title: 'REST APIs & System Design', url: 'https://www.youtube.com/watch?v=-MTSQjw5DrM', creator: 'freeCodeCamp' },
  testing: { title: 'Pytest & Automated Testing Tutorial', url: 'https://www.youtube.com/watch?v=YbpKMIUjvK8', creator: 'freeCodeCamp' },
  java: { title: 'Java Full Course for Beginners', url: 'https://www.youtube.com/watch?v=A74TOX803D0', creator: 'freeCodeCamp' },
  cpp: { title: 'C++ Full Course for Beginners', url: 'https://www.youtube.com/watch?v=vLnPwxZdW4Y', creator: 'freeCodeCamp' },
  go: { title: 'Go / Golang Tutorial for Beginners', url: 'https://www.youtube.com/watch?v=un6ZyFkqFJU', creator: 'TechWorld with Nana' },
  rust: { title: 'Rust Programming Course for Beginners', url: 'https://www.youtube.com/watch?v=MsocPEZBd-M', creator: 'freeCodeCamp' },
  kubernetes: { title: 'Kubernetes Tutorial for Beginners', url: 'https://www.youtube.com/watch?v=X48VuDVv0do', creator: 'TechWorld with Nana' },
  aws: { title: 'AWS Certified Cloud Practitioner', url: 'https://www.youtube.com/watch?v=SOTamWNgDKc', creator: 'freeCodeCamp' },
  flutter: { title: 'Flutter Course for Beginners', url: 'https://www.youtube.com/watch?v=VPvVD8t02U8', creator: 'freeCodeCamp' },
};

function getCanonicalVideo(title: string, skillIds?: string[]): { title: string; url: string; creator: string } | null {
  const primarySkill = (skillIds?.[0] || '').toLowerCase();
  for (const [key, val] of Object.entries(CANONICAL_VIDEOS)) {
    if (primarySkill.includes(key) || key.includes(primarySkill) || title.toLowerCase().includes(key)) {
      return val;
    }
  }
  return null;
}

const CANONICAL_SKILL_URLS: Record<string, string> = {
  python: 'https://cs50.harvard.edu/python/',
  javascript: 'https://javascript.info/',
  typescript: 'https://www.typescriptlang.org/docs/handbook/intro.html',
  react: 'https://react.dev/learn',
  sql: 'https://mode.com/sql-tutorial/',
  nosql: 'https://learn.mongodb.com/',
  mongodb: 'https://learn.mongodb.com/',
  'machine-learning': 'https://www.coursera.org/specializations/machine-learning-introduction',
  'deep-learning': 'https://course.fast.ai/',
  pandas: 'https://www.kaggle.com/learn/pandas',
  numpy: 'https://numpy.org/doc/stable/user/quickstart.html',
  'html-css': 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content',
  css: 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout',
  html: 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content',
  nodejs: 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Server-side/Express_Nodejs',
  node: 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Server-side/Express_Nodejs',
  git: 'https://git-scm.com/book/en/v2',
  docker: 'https://docs.docker.com/get-started/',
  nlp: 'https://huggingface.co/learn/nlp-course',
  statistics: 'https://www.khanacademy.org/math/statistics-probability',
  probability: 'https://ocw.mit.edu/courses/18-05-introduction-to-probability-and-statistics-spring-2022/',
  eda: 'https://www.kaggle.com/c/titanic',
  'feature-engineering': 'https://www.kaggle.com/learn/feature-engineering',
  'api-design': 'https://github.com/donnemartin/system-design-primer',
  testing: 'https://docs.pytest.org/en/stable/getting-started.html',
  excel: 'https://support.microsoft.com/en-us/office/excel-video-training-9bc05390-e94c-46af-977d-0380f30c55e4',
  java: 'https://dev.java/learn/',
  cpp: 'https://en.cppreference.com/w/cpp',
  go: 'https://go.dev/tour/',
  rust: 'https://doc.rust-lang.org/book/',
  kubernetes: 'https://kubernetes.io/docs/tutorials/',
  aws: 'https://aws.amazon.com/training/',
  flutter: 'https://docs.flutter.dev/get-started/codelab',
};

function getCanonicalUrl(title: string, skillIds?: string[]): string {
  const primarySkill = (skillIds?.[0] || '').toLowerCase();
  for (const [key, url] of Object.entries(CANONICAL_SKILL_URLS)) {
    if (primarySkill.includes(key) || key.includes(primarySkill) || title.toLowerCase().includes(key)) {
      return url;
    }
  }
  return 'https://developer.mozilla.org/en-US/docs/Learn_web_development';
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
  const [assessmentTarget, setAssessmentTarget] = useState<{ skillId: string; title: string; item: RoadmapItem } | null>(null);
  const [projectAssessmentTarget, setProjectAssessmentTarget] = useState<{ skillId: string; title: string; item: RoadmapItem } | null>(null);

  const [completedItemIds, setCompletedItemIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('pathwise_completed_item_ids');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [watchedVideos, setWatchedVideos] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('pathwise_watched_videos');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const toggleWatchVideo = (itemKey: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isWatched = watchedVideos.has(itemKey);
    const next = new Set(watchedVideos);
    if (isWatched) {
      next.delete(itemKey);
      setWatchedVideos(next);
      localStorage.setItem('pathwise_watched_videos', JSON.stringify(Array.from(next)));
      toastSuccess(`Marked video for ${title} as unwatched.`);
    } else {
      next.add(itemKey);
      setWatchedVideos(next);
      localStorage.setItem('pathwise_watched_videos', JSON.stringify(Array.from(next)));
      toastSuccess(`✓ Watched Video: ${title}!`);
    }
  };

  const fetchRoadmap = async () => {
    try {
      setLoading(true);
      const res = await api.getCurrentPath();
      setRoadmap(res.roadmap);
      setTotalWeeks(res.totalEstimatedWeeks);
      setVersion(res.version);
    } catch {
      const res = await api.compilePath();
      setRoadmap(res.roadmap);
      setTotalWeeks(res.totalEstimatedWeeks);
      setVersion(res.version);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRoadmap(); }, []);

  const handleAssessmentPassed = async (score: number) => {
    if (!assessmentTarget) return;
    const targetId = assessmentTarget.item.id;
    const nextCompleted = new Set(completedItemIds);
    nextCompleted.add(targetId);
    setCompletedItemIds(nextCompleted);
    localStorage.setItem('pathwise_completed_item_ids', JSON.stringify(Array.from(nextCompleted)));

    try {
      const recompileRes = await api.recompilePath(
        [assessmentTarget.skillId],
        `Passed assessment for ${assessmentTarget.title} with ${score}%`
      );
      setRoadmap(recompileRes.roadmap);
      setTotalWeeks(recompileRes.totalEstimatedWeeks);
      setVersion(recompileRes.version);
      setRecompilationResult(recompileRes.recompilation);
    } catch (err) {
      console.error('Failed to update roadmap post assessment:', err);
      fetchRoadmap();
    }
  };

  const handleProjectPassed = async (score: number) => {
    if (!projectAssessmentTarget) return;
    const targetId = projectAssessmentTarget.item.id;
    const nextCompleted = new Set(completedItemIds);
    nextCompleted.add(targetId);
    setCompletedItemIds(nextCompleted);
    localStorage.setItem('pathwise_completed_item_ids', JSON.stringify(Array.from(nextCompleted)));

    try {
      const recompileRes = await api.recompilePath(
        [projectAssessmentTarget.skillId],
        `Passed Project: ${projectAssessmentTarget.title} with ${score}%`
      );
      setRoadmap(recompileRes.roadmap);
      setTotalWeeks(recompileRes.totalEstimatedWeeks);
      setVersion(recompileRes.version);
      setRecompilationResult(recompileRes.recompilation);
    } catch (err) {
      console.error('Failed to update roadmap post project assessment:', err);
      fetchRoadmap();
    }
  };

  const toggleCompleteItem = async (item: RoadmapItem) => {
    const itemKey = item.id;
    setCompletingItem(itemKey);
    const wasCompleted = completedItemIds.has(itemKey);
    const nextCompleted = new Set(completedItemIds);

    if (wasCompleted) {
      nextCompleted.delete(itemKey);
      setCompletedItemIds(nextCompleted);
      localStorage.setItem('pathwise_completed_item_ids', JSON.stringify(Array.from(nextCompleted)));
      toastSuccess(`Marked ${item.title} as incomplete.`);
      setCompletingItem(null);
    } else {
      nextCompleted.add(itemKey);
      setCompletedItemIds(nextCompleted);
      localStorage.setItem('pathwise_completed_item_ids', JSON.stringify(Array.from(nextCompleted)));
      try {
        await api.recordProgressEvent({
          type: 'RESOURCE_COMPLETED',
          skillIds: item.skillIds || ['sql'],
          resourceId: itemKey,
          score: 90,
          metadata: { title: item.title },
        });
        toastSuccess(`✓ Completed step: ${item.title}!`);
      } catch (err) {
        console.error('Failed to log completion event:', err);
      } finally {
        setCompletingItem(null);
      }
    }
  };

  // Group by milestone
  const milestones = roadmap.reduce((acc, item) => {
    const m = item.milestone || 1;
    if (!acc[m]) acc[m] = [];
    acc[m].push(item);
    return acc;
  }, {} as Record<number, RoadmapItem[]>);

  const completedCount = roadmap.filter(i => i.status === 'completed').length;
  const progressRatio = roadmap.length ? completedCount / roadmap.length : 0;

  return (
    <div className="page-shell space-y-6 page-enter">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[var(--border-dim)] animate-fade-up">
        <div className="space-y-1">
          <p className="section-eyebrow">Prerequisite-Aware Sequence</p>
          <h1 className="section-title">Personalized Roadmap</h1>
          <p className="text-[13px] text-[var(--text-secondary)]">
            {totalWeeks} weeks estimated · {completedCount}/{roadmap.length} steps completed · version v{version}.0
          </p>
        </div>

        <div className="flex items-center gap-4 text-[11px] font-mono text-[var(--text-muted)]">
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

      {/* ── Progress overview ───────────────────────────────── */}
      <div className="card p-5 animate-fade-up delay-100">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[12px] font-bold text-[var(--text-secondary)] uppercase tracking-wider font-mono">
            Overall Roadmap Completion
          </span>
          <span className="font-mono text-[13px] text-[var(--primary-300)] font-bold">
            {completedCount} / {roadmap.length} steps
          </span>
        </div>
        <div
          className="progress-track"
          role="progressbar"
          aria-valuenow={completedCount}
          aria-valuemax={roadmap.length}
          aria-label="Roadmap completion"
        >
          <div
            className="progress-fill progress-fill-amber"
            style={{ transform: `scaleX(${progressRatio})` }}
          />
        </div>
      </div>

      {/* ── Milestone Timeline ──────────────────────────────── */}
      {loading ? (
        <div className="py-16 text-center space-y-3 animate-fade-in">
          <Loader2 size={28} className="text-[var(--primary-500)] animate-spin mx-auto" />
          <p className="text-[13px] text-[var(--text-secondary)]">
            Compiling dependency graph and optimizing path…
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {Object.entries(milestones).map(([mNum, items], mIdx) => {
            const mCompleted = items.every(i => i.status === 'completed');
            const mActive    = items.some(i => i.status === 'available');
            return (
              <section
                key={mNum}
                className="animate-fade-up"
                style={{ animationDelay: `${mIdx * 60}ms` }}
              >
                {/* Milestone heading */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold font-mono transition-all"
                    style={{
                      background: mCompleted ? 'rgba(16,185,129,0.15)' : mActive ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)',
                      border: `1.5px solid ${mCompleted ? 'rgba(16,185,129,0.5)' : mActive ? 'rgba(245,158,11,0.5)' : 'var(--border-dim)'}`,
                      color: mCompleted ? 'var(--accent-400)' : mActive ? 'var(--primary-300)' : 'var(--text-muted)',
                    }}
                    aria-label={`Milestone ${mNum}`}
                  >
                    M{mNum}
                  </div>
                  <div className="flex-1 flex items-center gap-3 min-w-0">
                    <h2 className="text-[15px] font-bold text-[var(--text-primary)] font-display whitespace-nowrap">
                      Milestone {mNum}
                    </h2>
                    <div className="flex-1 h-px bg-[var(--border-dim)]" />
                    <span className="text-[10px] font-mono text-[var(--text-muted)] whitespace-nowrap">
                      {items.filter(i => i.status === 'completed').length}/{items.length} done
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-3 ml-11">
                  {items.map((item, idx) => {
                    const isAvailable = item.status === 'available';
                    const isCompleted = item.type === 'ASSESSMENT' || item.type === 'PROJECT'
                      ? item.status === 'completed'
                      : completedItemIds.has(item.id);
                    const isWatched = watchedVideos.has(item.id);
                    const typeStyle = TYPE_STYLES[item.type] || TYPE_STYLES.RESOURCE;
                    const canonicalUrl = getCanonicalUrl(item.title, item.skillIds);
                    const canonicalVideo = getCanonicalVideo(item.title, item.skillIds);

                    return (
                      <article
                        key={item.id}
                        className={`rounded-2xl border p-5 transition-all animate-fade-up ${
                          isCompleted
                            ? 'bg-[var(--bg-surface)] border-[var(--border-dim)] opacity-75'
                            : isAvailable
                            ? 'bg-[var(--bg-surface)] border-[rgba(245,158,11,0.3)] shadow-[0_0_0_1px_rgba(245,158,11,0.08),0_12px_28px_-8px_rgba(0,0,0,0.5)]'
                            : 'bg-[var(--bg-base)] border-[var(--border-dim)]'
                        }`}
                        style={{ animationDelay: `${mIdx * 60 + idx * 30}ms` }}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="space-y-2 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Type badge */}
                              <span
                                className="badge text-[9px]"
                                style={{ background: typeStyle.bg, borderColor: typeStyle.border, color: typeStyle.text }}
                              >
                                {typeStyle.icon} {typeStyle.label}
                              </span>

                              {isCompleted && (
                                <span className="badge badge-emerald text-[9px]">
                                  <CheckCircle2 size={9} /> Completed
                                </span>
                              )}

                              {isAvailable && !isCompleted && (
                                <span className="badge badge-amber text-[9px] animate-pulse">
                                  Available Now
                                </span>
                              )}
                            </div>

                            <h3 className={`text-[15px] font-bold font-display leading-tight ${isCompleted ? 'text-[var(--text-muted)]' : 'text-[var(--text-primary)]'}`}>
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

                          {/* Actions: Video + Watch Toggle + Quiz Assessment + Trace */}
                          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
                            {/* Canonical Video Lesson */}
                            {canonicalVideo && (
                              <div className="flex items-center gap-1">
                                <a
                                  href={canonicalVideo.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-ghost btn-xs font-mono text-[10px] text-[#f87171] hover:bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.25)] flex items-center gap-1"
                                  title={`Watch ${canonicalVideo.title} by ${canonicalVideo.creator}`}
                                >
                                  <Video size={11} />
                                  <span>Video ↗</span>
                                </a>

                                <button
                                  onClick={(e) => toggleWatchVideo(item.id, item.title, e)}
                                  className={`btn btn-xs font-mono text-[10px] px-2 flex items-center gap-1 ${
                                    isWatched
                                      ? 'bg-[rgba(16,185,129,0.18)] text-[var(--accent-300)] border border-[rgba(16,185,129,0.4)]'
                                      : 'btn-ghost text-[var(--text-muted)] border border-[var(--border-dim)]'
                                  }`}
                                  title={isWatched ? 'Video completed (click to unmark)' : 'Mark video as watched'}
                                >
                                  <CheckCircle2 size={10} className={isWatched ? 'text-[var(--accent-400)]' : 'text-[var(--text-muted)]'} />
                                  <span>{isWatched ? 'Watched' : 'Mark Watched'}</span>
                                </button>
                              </div>
                            )}

                            {item.skillIds?.[0] && (
                              <button
                                onClick={() => setSelectedSkillForTrace(item.skillIds[0])}
                                className="btn btn-ghost btn-xs font-mono"
                                aria-label="View recommendation trace"
                                id={`roadmap-trace-${item.id}`}
                              >
                                <Eye size={11} /> Trace
                              </button>
                            )}

                            {/* Action Buttons based on item type */}
                            {(() => {
                              const resolvedSkillId = (item.skillIds?.[0]?.startsWith('assessment-') || item.skillIds?.[0]?.startsWith('project-'))
                                ? (item.prerequisiteIds?.[0] || 'sql')
                                : (item.skillIds?.[0] || 'sql');

                              if (item.type === 'PROJECT') {
                                return isCompleted ? (
                                  <div className="flex items-center gap-2">
                                    <span className="badge badge-emerald text-[10px] font-mono font-bold flex items-center gap-1">
                                      <CheckCircle2 size={11} /> Completed
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
                                    className="btn btn-primary btn-sm font-mono text-[11px] flex items-center gap-1.5 shadow-sm"
                                    aria-label={`Start Project Assessment for ${item.title}`}
                                  >
                                    <FolderGit2 size={12} />
                                    <span>Start Project Assessment</span>
                                    <ChevronRight size={11} />
                                  </button>
                                );
                              }

                              if (item.type === 'ASSESSMENT') {
                                return isCompleted ? (
                                  <div className="flex items-center gap-2">
                                    <span className="badge badge-emerald text-[10px] font-mono font-bold flex items-center gap-1">
                                      <CheckCircle2 size={11} /> Completed
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
                                    className="btn btn-primary btn-sm font-mono text-[11px] flex items-center gap-1.5 shadow-sm"
                                    aria-label={`Take assessment for ${item.title}`}
                                  >
                                    <HelpCircle size={12} />
                                    <span>Take Milestone Assessment</span>
                                    <ChevronRight size={11} />
                                  </button>
                                );
                              }

                              /* Regular Course / Resource / Practice — Toggle Complete button */
                              return isCompleted ? (
                                <button
                                  id={`roadmap-complete-${item.id}`}
                                  onClick={() => toggleCompleteItem(item)}
                                  disabled={completingItem === item.id}
                                  className="btn btn-xs font-mono text-[11px] px-3 py-1.5 flex items-center gap-1.5 bg-[rgba(16,185,129,0.18)] text-[var(--accent-300)] border border-[rgba(16,185,129,0.4)] hover:bg-[rgba(239,68,68,0.15)] hover:text-red-300 hover:border-red-500/40 transition-all cursor-pointer group"
                                  title="Completed (Click to unmark)"
                                >
                                  {completingItem === item.id ? (
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
                                  id={`roadmap-complete-${item.id}`}
                                  onClick={() => toggleCompleteItem(item)}
                                  disabled={completingItem === item.id}
                                  className="btn btn-secondary btn-sm font-mono text-[11px] flex items-center gap-1.5 border-[var(--border-subtle)] hover:border-[var(--accent-400)] hover:text-[var(--accent-300)] cursor-pointer"
                                  title="Mark step as complete"
                                >
                                  {completingItem === item.id ? (
                                    <Loader2 size={11} className="animate-spin" />
                                  ) : (
                                    <CheckCircle2 size={11} />
                                  )}
                                  <span>Mark Complete</span>
                                </button>
                              );
                            })()}
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
