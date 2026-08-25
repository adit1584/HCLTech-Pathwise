import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import type { LearningResource, RoadmapItem, RecompilationResult } from '../types';
import {
  CheckCircle2,
  Circle,
  Star,
  BookOpen,
  Video,
  Code2,
  FileText,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Search,
  Filter,
  Flame,
  Award,
  Sparkles,
  Zap,
  Clock,
  Edit3,
  X,
  Save,
  Loader2,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { useToast } from './Toast';

// ── Difficulty Config ───────────────────────────────────────────────────────
const DIFFICULTY_CONFIG: Record<number, { label: string; color: string; bg: string; border: string }> = {
  1: { label: 'Easy', color: 'var(--accent-300)', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)' },
  2: { label: 'Easy-Med', color: 'var(--accent-300)', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)' },
  3: { label: 'Medium', color: 'var(--primary-300)', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.28)' },
  4: { label: 'Hard', color: '#f87171', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)' },
  5: { label: 'Expert', color: '#f87171', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)' },
};

// ── Topic Item Interface ───────────────────────────────────────────────────
export interface SheetTopic {
  id: string;
  title: string;
  category: string;
  difficulty: number;
  estimatedHours: number;
  skills: string[];
  description: string;
  source: string;
  videoUrl?: string;
  articleUrl?: string;
  practiceUrl?: string;
  isCompleted?: boolean;
}

interface CurriculumSheetProps {
  onRecompile?: (result: RecompilationResult) => void;
  roadmap?: RoadmapItem[];
}

export const CurriculumSheet: React.FC<CurriculumSheetProps> = ({ onRecompile, roadmap }) => {
  const { success: toastSuccess, error: toastError } = useToast();

  const [resources, setResources] = useState<LearningResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<'ALL' | 'EASY' | 'MEDIUM' | 'HARD'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'COMPLETED' | 'INCOMPLETE' | 'STARRED'>('ALL');

  // Starred / Bookmarked items (persisted to localStorage)
  const [starred, setStarred] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('pathwise_starred_topics');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // User personal notes (persisted to localStorage)
  const [notes, setNotes] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('pathwise_topic_notes');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Completed items
  const [completed, setCompleted] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('pathwise_completed_topics');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Active note editing modal
  const [activeNoteTopic, setActiveNoteTopic] = useState<SheetTopic | null>(null);
  const [noteDraft, setNoteDraft] = useState('');

  // Collapsed modules state
  const [collapsedModules, setCollapsedModules] = useState<Record<string, boolean>>({});

  // Submitting ID
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Load resources from backend
  useEffect(() => {
    setLoading(true);
    api.getResources()
      .then(res => {
        setResources(res.resources || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Sync roadmap completed items
  useEffect(() => {
    if (roadmap?.length) {
      const completedFromRoadmap = new Set(completed);
      roadmap.forEach(r => {
        if (r.status === 'completed') {
          completedFromRoadmap.add(r.id);
          r.resourceIds?.forEach(id => completedFromRoadmap.add(id));
        }
      });
      setCompleted(completedFromRoadmap);
    }
  }, [roadmap]);

  // Persist starred to localStorage
  const toggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setStarred(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem('pathwise_starred_topics', JSON.stringify(Array.from(next)));
      return next;
    });
  };

  // Toggle Completion
  const toggleComplete = async (topic: SheetTopic, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const isCurrentlyDone = completed.has(topic.id);
    setTogglingId(topic.id);

    try {
      const nextCompleted = new Set(completed);
      if (isCurrentlyDone) {
        nextCompleted.delete(topic.id);
        toastSuccess(`Marked "${topic.title}" as incomplete`);
      } else {
        nextCompleted.add(topic.id);

        // Record progress in backend
        await api.recordProgressEvent({
          type: 'RESOURCE_COMPLETED',
          skillIds: topic.skills,
          resourceId: topic.id,
          score: 95,
          metadata: { title: topic.title, source: 'curriculum_sheet' },
        });

        // Trigger recompilation
        const recompileRes = await api.recompilePath(
          topic.skills,
          `Completed "${topic.title}" in Curriculum Sheet`
        );

        if (onRecompile && recompileRes.recompilation) {
          onRecompile(recompileRes.recompilation);
        }

        toastSuccess(`✓ Completed "${topic.title}" (+95% evidence logged!)`);
      }

      setCompleted(nextCompleted);
      localStorage.setItem('pathwise_completed_topics', JSON.stringify(Array.from(nextCompleted)));
    } catch (err: any) {
      console.error('Failed to toggle status:', err);
      toastError('Failed to record completion');
    } finally {
      setTogglingId(null);
    }
  };

  // Save personal note
  const handleSaveNote = () => {
    if (!activeNoteTopic) return;
    const nextNotes = { ...notes, [activeNoteTopic.id]: noteDraft };
    setNotes(nextNotes);
    localStorage.setItem('pathwise_topic_notes', JSON.stringify(nextNotes));
    setActiveNoteTopic(null);
    toastSuccess('Note saved!');
  };

  // Convert resources into categorized sheet topics
  const allTopics = useMemo<SheetTopic[]>(() => {
    return resources.map(r => {
      // Determine canonical direct links
      let videoUrl = r.url;
      let articleUrl = r.url;
      let practiceUrl = r.url;

      if (r.url.includes('youtube.com') || r.url.includes('coursera.org') || r.url.includes('cs50.harvard.edu')) {
        videoUrl = r.url;
      }
      if (r.url.includes('leetcode.com') || r.url.includes('hackerrank.com') || r.url.includes('kaggle.com')) {
        practiceUrl = r.url;
      }
      if (r.url.includes('developer.mozilla.org') || r.url.includes('javascript.info') || r.url.includes('docs.')) {
        articleUrl = r.url;
      }

      return {
        id: r.resourceId,
        title: r.title,
        category: r.skills[0] ? r.skills[0].replace(/-/g, ' ').toUpperCase() : 'GENERAL',
        difficulty: r.difficulty || 2,
        estimatedHours: r.estimatedHours || 5,
        skills: r.skills,
        description: r.description,
        source: r.source || 'Curated Path',
        videoUrl,
        articleUrl,
        practiceUrl,
        isCompleted: completed.has(r.resourceId),
      };
    });
  }, [resources, completed]);

  // Group topics into structured Modules (TUF Step 1, Step 2, etc.)
  const groupedModules = useMemo(() => {
    const groups: Record<string, SheetTopic[]> = {};

    allTopics.forEach(topic => {
      let modName = 'Step 1: Foundations & Core Prerequisites';
      const cat = topic.category.toLowerCase();

      if (cat.includes('python') || cat.includes('html') || cat.includes('sql') || cat.includes('git') || cat.includes('excel')) {
        modName = 'Step 1: Foundations & Core Prerequisites';
      } else if (cat.includes('js') || cat.includes('javascript') || cat.includes('numpy') || cat.includes('pandas') || cat.includes('stats') || cat.includes('data-cleaning')) {
        modName = 'Step 2: Applied Logic, Data Wrangling & Core Libraries';
      } else if (cat.includes('react') || cat.includes('node') || cat.includes('machine-learning') || cat.includes('regression') || cat.includes('classification') || cat.includes('feature')) {
        modName = 'Step 3: Frameworks, Algorithms & System Implementation';
      } else {
        modName = 'Step 4: Advanced Specialization, Deployment & Capstones';
      }

      if (!groups[modName]) groups[modName] = [];
      groups[modName].push(topic);
    });

    return groups;
  }, [allTopics]);

  // Filtered modules
  const filteredModules = useMemo(() => {
    const result: Record<string, SheetTopic[]> = {};

    Object.entries(groupedModules).forEach(([modName, items]) => {
      const filteredItems = items.filter(t => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const match = t.title.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q) ||
            t.skills.some(s => s.toLowerCase().includes(q)) ||
            t.source.toLowerCase().includes(q);
          if (!match) return false;
        }

        // Status filter
        if (filterStatus === 'COMPLETED' && !completed.has(t.id)) return false;
        if (filterStatus === 'INCOMPLETE' && completed.has(t.id)) return false;
        if (filterStatus === 'STARRED' && !starred.has(t.id)) return false;

        // Difficulty filter
        if (filterDifficulty === 'EASY' && t.difficulty > 2) return false;
        if (filterDifficulty === 'MEDIUM' && t.difficulty !== 3) return false;
        if (filterDifficulty === 'HARD' && t.difficulty < 4) return false;

        return true;
      });

      if (filteredItems.length > 0) {
        result[modName] = filteredItems;
      }
    });

    return result;
  }, [groupedModules, searchQuery, filterStatus, filterDifficulty, completed, starred]);

  // Overall Statistics
  const totalCount = allTopics.length;
  const doneCount = allTopics.filter(t => completed.has(t.id)).length;
  const progressPercent = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;

  const easyCount = allTopics.filter(t => t.difficulty <= 2).length;
  const easyDone = allTopics.filter(t => t.difficulty <= 2 && completed.has(t.id)).length;

  const medCount = allTopics.filter(t => t.difficulty === 3).length;
  const medDone = allTopics.filter(t => t.difficulty === 3 && completed.has(t.id)).length;

  const hardCount = allTopics.filter(t => t.difficulty >= 4).length;
  const hardDone = allTopics.filter(t => t.difficulty >= 4 && completed.has(t.id)).length;

  // First unfinished topic (for "Resume Learning" button)
  const nextUnfinishedTopic = allTopics.find(t => !completed.has(t.id));

  const toggleModuleCollapse = (modName: string) => {
    setCollapsedModules(prev => ({ ...prev, [modName]: !prev[modName] }));
  };

  return (
    <div className="space-y-6">

      {/* ── TakeUForward-Style Top Progress Bar & Metrics ──────────────── */}
      <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-5 animate-fade-up">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[rgba(245,158,11,0.12)] border border-[rgba(245,158,11,0.28)] text-[var(--primary-300)]">
                <Flame size={11} /> CURRICULUM TRACKER
              </span>
              <span className="text-[11px] font-mono text-[var(--text-muted)]">
                {doneCount} / {totalCount} Completed
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-[var(--text-primary)] font-display tracking-tight">
              A2Z Learning & Practice Pathway
            </h2>
            <p className="text-[12px] text-[var(--text-secondary)]">
              Curated canonical tutorials, practice sets, and direct links with interactive checkbox tracking.
            </p>
          </div>

          {/* Quick Jump: Next Topic */}
          {nextUnfinishedTopic && (
            <button
              onClick={() => {
                if (nextUnfinishedTopic.videoUrl) window.open(nextUnfinishedTopic.videoUrl, '_blank');
              }}
              className="btn btn-primary self-start md:self-auto text-[12px] py-2.5 px-4"
              title="Jump to the next uncompleted lesson"
            >
              <Zap size={14} />
              <span>Next Up: {nextUnfinishedTopic.title.slice(0, 24)}…</span>
              <ArrowRight size={13} />
            </button>
          )}
        </div>

        {/* Linear Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-[var(--text-secondary)] font-semibold flex items-center gap-1">
              <TrendingUp size={12} className="text-[var(--primary-400)]" />
              Overall Progress
            </span>
            <span className="font-bold text-[var(--primary-300)]">{progressPercent}%</span>
          </div>
          <div className="w-full h-3 rounded-full bg-[var(--bg-void)] border border-[var(--border-dim)] overflow-hidden p-0.5">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progressPercent}%`,
                background: 'linear-gradient(90deg, #f59e0b 0%, #10b981 100%)',
                boxShadow: '0 0 12px rgba(245,158,11,0.5)',
              }}
            />
          </div>
        </div>

        {/* Difficulty Breakdown Badges (like TUF Sheet) */}
        <div className="grid grid-cols-3 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-[var(--bg-void)] border border-[var(--border-dim)] flex items-center justify-between">
            <div className="text-left">
              <span className="text-[10px] font-mono font-bold text-[var(--accent-300)] uppercase block">Easy</span>
              <span className="text-[13px] font-bold text-[var(--text-primary)] font-mono">{easyDone} / {easyCount}</span>
            </div>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[rgba(16,185,129,0.1)] text-[var(--accent-300)] font-mono text-[11px] font-bold">
              {easyCount ? Math.round((easyDone / easyCount) * 100) : 0}%
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[var(--bg-void)] border border-[var(--border-dim)] flex items-center justify-between">
            <div className="text-left">
              <span className="text-[10px] font-mono font-bold text-[var(--primary-300)] uppercase block">Medium</span>
              <span className="text-[13px] font-bold text-[var(--text-primary)] font-mono">{medDone} / {medCount}</span>
            </div>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[rgba(245,158,11,0.1)] text-[var(--primary-300)] font-mono text-[11px] font-bold">
              {medCount ? Math.round((medDone / medCount) * 100) : 0}%
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[var(--bg-void)] border border-[var(--border-dim)] flex items-center justify-between">
            <div className="text-left">
              <span className="text-[10px] font-mono font-bold text-[#f87171] uppercase block">Hard</span>
              <span className="text-[13px] font-bold text-[var(--text-primary)] font-mono">{hardDone} / {hardCount}</span>
            </div>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[rgba(239,68,68,0.1)] text-[#f87171] font-mono text-[11px] font-bold">
              {hardCount ? Math.round((hardDone / hardCount) * 100) : 0}%
            </div>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Controls ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 animate-fade-up">
        {/* Search */}
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border bg-[var(--bg-surface)] border-[var(--border-subtle)] flex-1 max-w-md">
          <Search size={14} className="text-[var(--text-muted)] shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search topics, skills, or sources…"
            className="flex-1 bg-transparent outline-none text-[13px] text-[var(--text-primary)] placeholder-[var(--text-muted)] font-sans"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              <X size={12} />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Status Filter */}
          {(['ALL', 'INCOMPLETE', 'COMPLETED', 'STARRED'] as const).map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-mono border transition-all cursor-pointer ${
                filterStatus === st
                  ? 'bg-[var(--primary-500)] text-slate-950 font-bold border-transparent shadow-sm'
                  : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-muted)]'
              }`}
            >
              {st === 'STARRED' ? '★ Revision' : st.toLowerCase()}
            </button>
          ))}

          {/* Difficulty Filter */}
          {(['ALL', 'EASY', 'MEDIUM', 'HARD'] as const).map(diff => (
            <button
              key={diff}
              onClick={() => setFilterDifficulty(diff)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-mono border transition-all cursor-pointer ${
                filterDifficulty === diff
                  ? 'bg-[var(--primary-500)] text-slate-950 font-bold border-transparent shadow-sm'
                  : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-muted)]'
              }`}
            >
              {diff}
            </button>
          ))}
        </div>
      </div>

      {/* ── Structured Accordion Modules ─────────────────────────────── */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton h-44 rounded-2xl" />
          ))}
        </div>
      ) : Object.keys(filteredModules).length === 0 ? (
        <div className="py-16 text-center card space-y-2 animate-fade-in">
          <BookOpen size={28} className="mx-auto text-[var(--text-muted)]" />
          <p className="text-[13px] text-[var(--text-secondary)]">No topics match your current filter.</p>
          <button
            onClick={() => { setSearchQuery(''); setFilterStatus('ALL'); setFilterDifficulty('ALL'); }}
            className="btn btn-ghost mx-auto text-[11px] font-mono"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(filteredModules).map(([modName, topics], modIndex) => {
            const isCollapsed = collapsedModules[modName];
            const modDoneCount = topics.filter(t => completed.has(t.id)).length;
            const modPercent = topics.length ? Math.round((modDoneCount / topics.length) * 100) : 0;

            return (
              <div
                key={modName}
                className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] overflow-hidden transition-all animate-fade-up"
                style={{ animationDelay: `${modIndex * 50}ms` }}
              >
                {/* Module Accordion Header */}
                <div
                  onClick={() => toggleModuleCollapse(modName)}
                  className="flex items-center justify-between p-4 px-5 cursor-pointer hover:bg-[var(--bg-raised)] transition-colors border-b border-[var(--border-dim)] select-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-[rgba(245,158,11,0.1)] text-[var(--primary-400)]">
                      {isCollapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
                    </div>
                    <div>
                      <h3 className="text-[14px] font-bold text-[var(--text-primary)] font-display">
                        {modName}
                      </h3>
                      <div className="text-[11px] font-mono text-[var(--text-muted)]">
                        {topics.length} topics • {topics.reduce((sum, t) => sum + t.estimatedHours, 0)} hours total
                      </div>
                    </div>
                  </div>

                  {/* Module Progress */}
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <span className="text-[11px] font-mono font-bold text-[var(--primary-300)]">
                        {modDoneCount} / {topics.length} Done
                      </span>
                    </div>
                    <div className="w-16 h-2 rounded-full bg-[var(--bg-void)] border border-[var(--border-dim)] overflow-hidden">
                      <div
                        className="h-full bg-[var(--primary-500)] rounded-full transition-all"
                        style={{ width: `${modPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Module Topics Table */}
                {!isCollapsed && (
                  <div className="divide-y divide-[var(--border-dim)] overflow-x-auto">
                    {topics.map((topic, i) => {
                      const isDone = completed.has(topic.id);
                      const isStar = starred.has(topic.id);
                      const isToggling = togglingId === topic.id;
                      const hasNote = Boolean(notes[topic.id]);
                      const diffStyle = DIFFICULTY_CONFIG[topic.difficulty] || DIFFICULTY_CONFIG[2];

                      return (
                        <div
                          key={topic.id}
                          className={`flex items-center justify-between gap-3 p-3.5 px-5 hover:bg-[var(--bg-void)] transition-colors ${
                            isDone ? 'bg-[rgba(16,185,129,0.03)]' : ''
                          }`}
                        >
                          {/* Left: Checkbox + Star + Title */}
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {/* Interactive Checkbox */}
                            <button
                              onClick={(e) => toggleComplete(topic, e)}
                              disabled={isToggling}
                              className="shrink-0 p-1 text-[var(--text-muted)] hover:text-[var(--accent-400)] transition-colors cursor-pointer"
                              title={isDone ? 'Mark Incomplete' : 'Mark Complete'}
                            >
                              {isToggling ? (
                                <Loader2 size={18} className="animate-spin text-[var(--primary-400)]" />
                              ) : isDone ? (
                                <CheckCircle2 size={18} className="text-[var(--accent-400)] fill-[rgba(16,185,129,0.2)]" />
                              ) : (
                                <Circle size={18} className="text-[var(--border-muted)] hover:text-[var(--accent-400)]" />
                              )}
                            </button>

                            {/* Bookmark / Star for Revision */}
                            <button
                              onClick={(e) => toggleStar(topic.id, e)}
                              className={`shrink-0 p-1 transition-colors cursor-pointer ${
                                isStar ? 'text-amber-400 fill-amber-400' : 'text-[var(--text-muted)] hover:text-amber-400'
                              }`}
                              title={isStar ? 'Remove from Revision' : 'Add to Revision'}
                            >
                              <Star size={15} className={isStar ? 'fill-amber-400' : ''} />
                            </button>

                            {/* Title & metadata */}
                            <div className="flex-1 min-w-0 pr-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[13px] font-semibold transition-all ${
                                  isDone ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text-primary)]'
                                }`}>
                                  {topic.title}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono text-[var(--text-muted)]">
                                <span>{topic.source}</span>
                                <span>•</span>
                                <span className="flex items-center gap-0.5">
                                  <Clock size={10} /> ~{topic.estimatedHours}h
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Right: Difficulty + Single Clean Action CTA + Note */}
                          <div className="flex items-center gap-2.5 shrink-0">
                            {/* Difficulty badge */}
                            <span
                              className="badge text-[9px] hidden sm:inline-flex"
                              style={{ background: diffStyle.bg, borderColor: diffStyle.border, color: diffStyle.color }}
                            >
                              {diffStyle.label}
                            </span>

                            {/* Single Primary Action Link */}
                            {topic.practiceUrl || topic.videoUrl || topic.articleUrl ? (
                              <a
                                href={topic.practiceUrl || topic.videoUrl || topic.articleUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-primary btn-xs font-mono flex items-center gap-1.5 text-[11px] py-1.5 px-3"
                                title={`Open ${topic.title}`}
                              >
                                <span>{topic.practiceUrl?.includes('leetcode') || topic.practiceUrl?.includes('kaggle') ? 'Practice' : 'Start'}</span>
                                <ExternalLink size={11} />
                              </a>
                            ) : null}

                            {/* Personal Note button */}
                            <button
                              onClick={() => {
                                setActiveNoteTopic(topic);
                                setNoteDraft(notes[topic.id] || '');
                              }}
                              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                hasNote
                                  ? 'bg-[rgba(245,158,11,0.15)] text-[var(--primary-300)] border-[rgba(245,158,11,0.4)]'
                                  : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
                              }`}
                              title={hasNote ? 'Edit your revision note' : 'Add revision note'}
                            >
                              <Edit3 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Revision Notes Drawer / Modal ────────────────────────────── */}
      {activeNoteTopic && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
          style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)' }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-lg rounded-2xl border p-6 space-y-4 animate-fade-up"
            style={{
              background: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
              boxShadow: '0 24px 64px -12px rgba(0,0,0,0.7)',
            }}
          >
            <div className="flex items-center justify-between border-b border-[var(--border-dim)] pb-3">
              <div>
                <h3 className="text-[15px] font-bold text-[var(--text-primary)] font-display flex items-center gap-2">
                  <Edit3 size={16} className="text-[var(--primary-400)]" />
                  Personal Revision Notes
                </h3>
                <p className="text-[11px] text-[var(--text-muted)] font-mono">{activeNoteTopic.title}</p>
              </div>
              <button onClick={() => setActiveNoteTopic(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X size={16} />
              </button>
            </div>

            <textarea
              rows={6}
              value={noteDraft}
              onChange={e => setNoteDraft(e.target.value)}
              placeholder="Write your key takeaways, formulas, edge cases, or code snippets here…"
              className="w-full p-3.5 text-[13px] rounded-xl bg-[var(--bg-void)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary-500)] font-mono leading-relaxed"
            />

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-dim)]">
              <button onClick={() => setActiveNoteTopic(null)} className="btn btn-ghost text-[12px]">
                Cancel
              </button>
              <button onClick={handleSaveNote} className="btn btn-primary text-[12px] px-4">
                <Save size={13} /> Save Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
