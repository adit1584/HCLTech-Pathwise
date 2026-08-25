import React, { useState, useMemo, useEffect } from 'react';
import {
  BookOpen,
  Search,
  ExternalLink,
  Clock,
  Unlock,
  Award,
  X,
  Sparkles,
  Loader2,
  CheckCircle2,
  Trophy,
  Flame,
  Zap,
} from 'lucide-react';
import { GOLD_STANDARD_COURSES, type GoldStandardCourse } from '../data/goldStandardCourses';
import { api } from '../services/api';
import { useToast } from '../components/Toast';

interface CourseRec {
  title: string;
  provider: string;
  platform: string;
  url: string;
  description: string;
  estimatedHours: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  isFree: boolean;
  type: 'course' | 'practice' | 'project' | 'paper' | 'assignment';
  skills: string[];
}

interface SkillBundle {
  skillId: string;
  skillName: string;
  recommendations: CourseRec[];
}

export const CoursesPage: React.FC = () => {
  const { success: toastSuccess, error: toastError } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'catalog' | 'ai_search'>('catalog');

  // Course Completion State
  const [completedCourses, setCompletedCourses] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('pathwise_completed_courses');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('pathwise_completed_courses', JSON.stringify(Array.from(completedCourses)));
    } catch (e) {
      console.error(e);
    }
  }, [completedCourses]);

  const toggleCourseComplete = async (
    courseKey: string,
    skillId: string,
    title: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    const wasCompleted = completedCourses.has(courseKey);
    const next = new Set(completedCourses);

    if (wasCompleted) {
      next.delete(courseKey);
      setCompletedCourses(next);
      toastSuccess(`Marked ${title} as uncompleted.`);
    } else {
      next.add(courseKey);
      setCompletedCourses(next);
      try {
        await api.recordProgressEvent({
          type: 'RESOURCE_COMPLETED',
          skillIds: [skillId],
          resourceId: courseKey,
          score: 100,
          metadata: { title, type: 'course' },
        });
        await api.recompilePath([skillId], `Completed course: ${title}`);
        toastSuccess(`🎉 Awesome! Completed ${title}! DAG recompiled.`);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // AI Live Search State
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [bundles, setBundles] = useState<SkillBundle[]>([]);

  // Filtered Courses
  const filteredCourses = useMemo(() => {
    return GOLD_STANDARD_COURSES.filter(c => {
      if (selectedCategory !== 'ALL' && c.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match = c.topicName.toLowerCase().includes(q) ||
          c.freeCourse.title.toLowerCase().includes(q) ||
          c.paidCourse.title.toLowerCase().includes(q) ||
          c.freeCourse.provider.toLowerCase().includes(q) ||
          c.paidCourse.provider.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [selectedCategory, searchQuery]);

  const totalCourseSlots = GOLD_STANDARD_COURSES.length * 2;
  const completedSlotsCount = completedCourses.size;
  const courseCompletionPercent = Math.min(100, Math.round((completedSlotsCount / totalCourseSlots) * 100));

  const handleCustomSkillSearch = async () => {
    const trimmed = customSkillInput.trim();
    if (!trimmed) return;
    setAiLoading(true);
    try {
      const skillId = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const result = await api.getAIRecommendations(skillId, trimmed);
      const newBundle: SkillBundle = {
        skillId,
        skillName: result.skill || trimmed,
        recommendations: result.recommendations || [],
      };
      setBundles(prev => [newBundle, ...prev.filter(b => b.skillId !== skillId)]);
      setCustomSkillInput('');
    } catch {
      toastError('Failed to fetch recommendations');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="page-shell space-y-6 page-enter">

      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[var(--border-dim)] animate-fade-up">
        <div className="space-y-1">
          <p className="section-eyebrow">Learning Tracks & Credentials</p>
          <h1 className="section-title">Courses</h1>
          <p className="text-[13px] text-[var(--text-secondary)]">
            Explore Free Courses and Certification Courses across every technical topic.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-2 self-start sm:self-end flex-wrap">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2 rounded-xl text-[12px] font-mono border transition-all cursor-pointer font-bold flex items-center gap-1.5 ${
              activeTab === 'catalog'
                ? 'bg-[var(--primary-500)] text-slate-950 border-transparent shadow-[0_4px_14px_-4px_rgba(245,158,11,0.5)]'
                : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-muted)]'
            }`}
          >
            <BookOpen size={13} /> Course Catalog
          </button>
          <button
            onClick={() => setActiveTab('ai_search')}
            className={`px-4 py-2 rounded-xl text-[12px] font-mono border transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'ai_search'
                ? 'bg-[var(--primary-500)] text-slate-950 border-transparent shadow-[0_4px_14px_-4px_rgba(245,158,11,0.5)]'
                : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-muted)]'
            }`}
          >
            <Sparkles size={13} /> Custom Skill Search
          </button>
        </div>
      </div>

      {/* ── CATALOG TAB ────────────────────────────────────────────── */}
      {activeTab === 'catalog' && (
        <div className="space-y-6 animate-fade-up">

          {/* Real-time Progress Card & Filter Toolbar */}
          <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="badge badge-emerald text-[10px] font-mono">
                    <Trophy size={10} /> REAL-TIME COURSE PROGRESS
                  </span>
                  <span className="text-[11px] font-mono text-[var(--text-muted)]">
                    {completedSlotsCount} / {totalCourseSlots} Tracks Completed
                  </span>
                </div>
                <h3 className="text-base font-bold text-[var(--text-primary)] font-display">
                  Track Your Course Completion
                </h3>
              </div>

              {/* Progress Gauge */}
              <div className="text-right sm:w-56 space-y-1.5 shrink-0">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-[var(--text-muted)]">Course Completion</span>
                  <span className="font-bold text-[var(--accent-300)]">{courseCompletionPercent}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-[var(--bg-void)] border border-[var(--border-dim)] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[var(--primary-500)] to-[var(--accent-400)] rounded-full transition-all duration-500"
                    style={{ width: `${courseCompletionPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Filter Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3 border-t border-[var(--border-dim)]">
              {/* Search Bar */}
              <div className="flex items-center gap-2 flex-1 px-3.5 py-2 rounded-xl bg-[var(--bg-void)] border border-[var(--border-subtle)]">
                <Search size={13} className="text-[var(--text-muted)] shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Filter courses e.g. Python, Harvard, React, SQL, Machine Learning…"
                  className="flex-1 bg-transparent outline-none text-[12px] text-[var(--text-primary)] placeholder-[var(--text-muted)]"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-[var(--text-muted)]">
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {(['ALL', 'Programming', 'Web Development', 'Data & SQL', 'Machine Learning & AI', 'DevOps & Systems'] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-mono border transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-[var(--primary-500)] text-slate-950 font-bold border-transparent'
                        : 'bg-[var(--bg-void)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Course Topic Cards */}
          <div className="space-y-6">
            {filteredCourses.map((topic, idx) => {
              const freeKey = `${topic.skillId}-free`;
              const paidKey = `${topic.skillId}-paid`;
              const isFreeCompleted = completedCourses.has(freeKey);
              const isPaidCompleted = completedCourses.has(paidKey);

              return (
                <div
                  key={topic.skillId}
                  className="p-5 sm:p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-5 animate-fade-up"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  {/* Topic Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-[var(--border-dim)] flex-wrap gap-2">
                    <div>
                      <span className="badge badge-cyan text-[9px] mb-1">
                        {topic.category}
                      </span>
                      <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] font-display">
                        {topic.topicName}
                      </h3>
                    </div>
                    <span className="text-[11px] font-mono text-[var(--text-muted)]">
                      Free & Certification Tracks
                    </span>
                  </div>

                  {/* Free vs Paid Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                    {/* ── Free Course ──────────────────────────────── */}
                    <div className={`p-4 sm:p-5 rounded-xl border space-y-4 flex flex-col justify-between transition-all ${
                      isFreeCompleted
                        ? 'bg-[rgba(16,185,129,0.06)] border-[rgba(16,185,129,0.4)]'
                        : 'bg-[rgba(16,185,129,0.02)] border-[rgba(16,185,129,0.25)]'
                    }`}>
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="badge badge-emerald text-[10px] font-mono font-bold flex items-center gap-1">
                            <Unlock size={10} /> FREE COURSE
                          </span>
                          <span className="text-[11px] font-mono text-[var(--accent-300)] font-bold">
                            ★ {topic.freeCourse.rating} / 5.0
                          </span>
                        </div>

                        <h4 className="text-[15px] font-bold text-[var(--text-primary)] font-display">
                          {topic.freeCourse.title}
                        </h4>

                        <div className="text-[11px] font-mono text-[var(--text-muted)] flex items-center gap-2">
                          <span>{topic.freeCourse.provider}</span>
                          <span>•</span>
                          <span>{topic.freeCourse.platform}</span>
                        </div>

                        <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">
                          {topic.freeCourse.description}
                        </p>

                        <div className="p-2.5 rounded-lg bg-[var(--bg-void)] border border-[var(--border-dim)] text-[11px] font-mono text-[var(--accent-400)]">
                          ✦ {topic.freeCourse.highlight}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-[var(--border-dim)] flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[11px] font-mono text-[var(--text-muted)] flex items-center gap-1">
                          <Clock size={11} /> ~{topic.freeCourse.durationHours}h total
                        </span>

                        <div className="flex items-center gap-2">
                          {/* Mark Complete Toggle */}
                          <button
                            onClick={(e) => toggleCourseComplete(freeKey, topic.skillId, topic.freeCourse.title, e)}
                            className={`btn btn-xs font-mono text-[11px] py-1.5 px-3 flex items-center gap-1.5 cursor-pointer ${
                              isFreeCompleted
                                ? 'bg-[rgba(16,185,129,0.2)] text-[var(--accent-300)] border border-[rgba(16,185,129,0.4)]'
                                : 'btn-ghost text-[var(--text-muted)] border border-[var(--border-dim)] hover:text-[var(--text-primary)]'
                            }`}
                            title={isFreeCompleted ? 'Completed (click to unmark)' : 'Mark course as completed'}
                          >
                            <CheckCircle2 size={12} className={isFreeCompleted ? 'text-[var(--accent-400)]' : 'text-[var(--text-muted)]'} />
                            <span>{isFreeCompleted ? 'Completed ✓' : 'Mark Complete'}</span>
                          </button>

                          <a
                            href={topic.freeCourse.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary text-[11px] py-1.5 px-3.5 flex items-center gap-1.5"
                          >
                            <span>Start</span>
                            <ExternalLink size={11} />
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* ── Paid / Certification Course ──────────────── */}
                    <div className={`p-4 sm:p-5 rounded-xl border space-y-4 flex flex-col justify-between transition-all ${
                      isPaidCompleted
                        ? 'bg-[rgba(245,158,11,0.06)] border-[rgba(245,158,11,0.4)]'
                        : 'bg-[rgba(245,158,11,0.02)] border-[rgba(245,158,11,0.25)]'
                    }`}>
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="badge badge-amber text-[10px] font-mono font-bold flex items-center gap-1">
                            <Award size={10} /> CERTIFICATION COURSE
                          </span>
                          <span className="text-[11px] font-mono text-[var(--primary-300)] font-bold">
                            ★ {topic.paidCourse.rating} / 5.0
                          </span>
                        </div>

                        <h4 className="text-[15px] font-bold text-[var(--text-primary)] font-display">
                          {topic.paidCourse.title}
                        </h4>

                        <div className="text-[11px] font-mono text-[var(--text-muted)] flex items-center gap-2">
                          <span>{topic.paidCourse.provider}</span>
                          <span>•</span>
                          <span>{topic.paidCourse.platform}</span>
                        </div>

                        <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">
                          {topic.paidCourse.description}
                        </p>

                        <div className="p-2.5 rounded-lg bg-[var(--bg-void)] border border-[var(--border-dim)] text-[11px] font-mono text-[var(--primary-300)]">
                          ✦ {topic.paidCourse.highlight}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-[var(--border-dim)] flex items-center justify-between gap-2 flex-wrap">
                        <div className="text-[11px] font-mono text-[var(--text-muted)] space-x-2">
                          <span>~{topic.paidCourse.durationHours}h</span>
                          <span>•</span>
                          <span className="font-bold text-[var(--text-primary)]">{topic.paidCourse.price}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Mark Complete Toggle */}
                          <button
                            onClick={(e) => toggleCourseComplete(paidKey, topic.skillId, topic.paidCourse.title, e)}
                            className={`btn btn-xs font-mono text-[11px] py-1.5 px-3 flex items-center gap-1.5 cursor-pointer ${
                              isPaidCompleted
                                ? 'bg-[rgba(245,158,11,0.2)] text-[var(--primary-300)] border border-[rgba(245,158,11,0.4)]'
                                : 'btn-ghost text-[var(--text-muted)] border border-[var(--border-dim)] hover:text-[var(--text-primary)]'
                            }`}
                            title={isPaidCompleted ? 'Completed (click to unmark)' : 'Mark course as completed'}
                          >
                            <CheckCircle2 size={12} className={isPaidCompleted ? 'text-[var(--primary-400)]' : 'text-[var(--text-muted)]'} />
                            <span>{isPaidCompleted ? 'Completed ✓' : 'Mark Complete'}</span>
                          </button>

                          <a
                            href={topic.paidCourse.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary text-[11px] py-1.5 px-3.5 flex items-center gap-1.5"
                          >
                            <span>Enroll</span>
                            <ExternalLink size={11} />
                          </a>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ── AI LIVE SEARCH TAB ──────────────────────────────────────── */}
      {activeTab === 'ai_search' && (
        <div className="space-y-6 animate-fade-up">
          <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-4">
            <div className="space-y-1">
              <span className="badge badge-amber text-[10px]">
                <Sparkles size={10} /> REAL-TIME AI COURSE SEARCH
              </span>
              <h2 className="text-xl font-bold text-[var(--text-primary)] font-display">
                Find Courses for Any Custom Skill
              </h2>
              <p className="text-[12px] text-[var(--text-secondary)]">
                Search courses dynamically across Coursera, edX, YouTube, Kaggle, and fast.ai.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <div className="flex items-center gap-2 flex-1 px-4 py-2.5 rounded-xl border bg-[var(--bg-void)] border-[var(--border-subtle)]">
                <Search size={14} className="text-[var(--text-muted)] shrink-0" />
                <input
                  type="text"
                  value={customSkillInput}
                  onChange={e => setCustomSkillInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCustomSkillSearch()}
                  placeholder="Search courses for any skill… e.g. Java, Rust, PyTorch, GraphQL, Kubernetes"
                  className="flex-1 bg-transparent outline-none text-[13px] text-[var(--text-primary)] placeholder-[var(--text-muted)]"
                />
                {customSkillInput && (
                  <button onClick={() => setCustomSkillInput('')} className="shrink-0 text-[var(--text-muted)]">
                    <X size={12} />
                  </button>
                )}
              </div>
              <button
                onClick={handleCustomSkillSearch}
                disabled={aiLoading || !customSkillInput.trim()}
                className="btn btn-primary shrink-0 text-[12px] px-5 disabled:opacity-40"
              >
                {aiLoading ? <Loader2 size={13} className="animate-spin" /> : <><Sparkles size={13} /> Find Courses</>}
              </button>
            </div>
          </div>

          {/* AI Results */}
          {aiLoading ? (
            <div className="py-16 text-center space-y-3 card animate-fade-in">
              <Loader2 size={32} className="text-[var(--primary-500)] animate-spin mx-auto" />
              <p className="text-[13px] text-[var(--text-secondary)]">Searching live courses with Groq AI…</p>
            </div>
          ) : bundles.length === 0 ? (
            <div className="py-16 text-center card space-y-2">
              <Sparkles size={28} className="mx-auto text-[var(--text-muted)]" />
              <p className="text-[13px] text-[var(--text-secondary)]">Type any skill name above to discover courses.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {bundles.map(b => (
                <div key={b.skillId} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-bold text-[var(--text-primary)] font-display">
                      {b.skillName}
                    </h3>
                    <div className="flex-1 h-px bg-[var(--border-dim)]" />
                    <span className="text-[11px] font-mono text-[var(--text-muted)]">
                      {b.recommendations.length} recommendations
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {b.recommendations.map((rec, rIdx) => (
                      <article
                        key={rIdx}
                        className="card p-5 flex flex-col justify-between gap-4 hover:border-[var(--border-muted)] hover:scale-[1.01] transition-all"
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="badge text-[9px] bg-[var(--bg-void)] text-[var(--text-muted)] border-[var(--border-dim)]">
                              {rec.platform}
                            </span>
                            {rec.isFree ? (
                              <span className="badge badge-emerald text-[9px]">FREE</span>
                            ) : (
                              <span className="badge badge-amber text-[9px]">PAID</span>
                            )}
                          </div>
                          <h4 className="text-[14px] font-bold text-[var(--text-primary)] font-display">
                            {rec.title}
                          </h4>
                          <p className="text-[11px] font-mono text-[var(--text-muted)]">{rec.provider}</p>
                          <p className="text-[12px] text-[var(--text-secondary)] line-clamp-3">
                            {rec.description}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-[var(--border-dim)] flex items-center justify-between">
                          <span className="text-[10px] font-mono text-[var(--text-muted)]">
                            ~{rec.estimatedHours}h total
                          </span>
                          <a
                            href={rec.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary btn-xs font-mono text-[10px] py-1 px-3 flex items-center gap-1"
                          >
                            <span>Enroll</span>
                            <ExternalLink size={10} />
                          </a>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
