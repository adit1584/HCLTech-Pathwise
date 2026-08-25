import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import {
  Code2,
  CheckCircle2,
  Clock,
  Loader2,
  ExternalLink,
  Search,
  Star,
  X,
  Circle,
  Flame,
} from 'lucide-react';
import { PRACTICE_QUESTIONS, type PracticeQuestion } from '../data/practiceQuestions';

export const PracticePage: React.FC = () => {
  const { success: toastSuccess, error: toastError } = useToast();

  const [completedQuestions, setCompletedQuestions] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('pathwise_completed_questions');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [starredQuestions, setStarredQuestions] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('pathwise_starred_questions');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [selectedTopicFilter, setSelectedTopicFilter] = useState<string>('ALL');
  const [selectedDiffFilter, setSelectedDiffFilter] = useState<'ALL' | 'EASY' | 'MEDIUM' | 'HARD'>('ALL');
  const [questionSearch, setQuestionSearch] = useState<string>('');
  const [togglingQuestionId, setTogglingQuestionId] = useState<string | null>(null);

  // Persist progress in localStorage
  useEffect(() => {
    try {
      localStorage.setItem('pathwise_completed_questions', JSON.stringify(Array.from(completedQuestions)));
    } catch (e) {
      console.error(e);
    }
  }, [completedQuestions]);

  useEffect(() => {
    try {
      localStorage.setItem('pathwise_starred_questions', JSON.stringify(Array.from(starredQuestions)));
    } catch (e) {
      console.error(e);
    }
  }, [starredQuestions]);

  // Toggle Question Completion
  const toggleQuestionComplete = async (q: PracticeQuestion, e: React.MouseEvent) => {
    e.stopPropagation();
    setTogglingQuestionId(q.id);
    const wasDone = completedQuestions.has(q.id);

    try {
      if (!wasDone) {
        // Record progress on backend and trigger DAG recompilation
        await api.recordProgressEvent({
          type: 'RESOURCE_COMPLETED',
          skillIds: q.skills,
          resourceId: q.id,
          score: 95,
          metadata: { title: q.title, platform: q.platform },
        });
        await api.recompilePath(q.skills, `Solved ${q.title} (${q.platform})`);

        setCompletedQuestions(prev => new Set(prev).add(q.id));
        toastSuccess(`✓ Solved: ${q.title}! DAG recompiled.`);
      } else {
        setCompletedQuestions(prev => {
          const next = new Set(prev);
          next.delete(q.id);
          return next;
        });
        toastSuccess(`Marked ${q.title} as unsolved.`);
      }
    } catch (err) {
      console.error(err);
      toastError('Could not record progress.');
    } finally {
      setTogglingQuestionId(null);
    }
  };

  const toggleQuestionStar = (qId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setStarredQuestions(prev => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  // Filtered Practice Questions
  const filteredQuestions = useMemo(() => {
    return PRACTICE_QUESTIONS.filter(q => {
      if (selectedTopicFilter !== 'ALL' && q.topicId !== selectedTopicFilter) return false;
      if (selectedDiffFilter !== 'ALL' && q.difficulty !== selectedDiffFilter) return false;
      if (questionSearch.trim()) {
        const query = questionSearch.toLowerCase();
        const match = q.title.toLowerCase().includes(query) ||
          q.problemStatement.toLowerCase().includes(query) ||
          q.tags.some(t => t.toLowerCase().includes(query));
        if (!match) return false;
      }
      return true;
    });
  }, [selectedTopicFilter, selectedDiffFilter, questionSearch]);

  const solvedCount = completedQuestions.size;
  const totalQuestionsCount = PRACTICE_QUESTIONS.length;
  const solvedPercent = Math.round((solvedCount / totalQuestionsCount) * 100);

  return (
    <div className="page-shell space-y-6 page-enter">

      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[var(--border-dim)] animate-fade-up">
        <div className="space-y-1">
          <p className="section-eyebrow">Interactive Coding Arena</p>
          <h1 className="section-title">Practice Questions & Challenges</h1>
          <p className="text-[13px] text-[var(--text-secondary)]">
            Hand-curated problem sets from LeetCode, Kaggle, and hands-on coding environments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-[var(--text-muted)]">
            Solved: <strong className="text-[var(--primary-300)]">{solvedCount} / {totalQuestionsCount}</strong>
          </span>
        </div>
      </div>

      {/* ── Progress Card & Toolbar ─────────────────────────────────── */}
      <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-4 animate-fade-up">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="badge badge-amber text-[10px]">
                <Flame size={10} /> PROBLEM SETS
              </span>
              <span className="text-[11px] font-mono text-[var(--text-muted)]">
                {solvedCount} / {totalQuestionsCount} Completed
              </span>
            </div>
            <h2 className="text-lg font-bold text-[var(--text-primary)] font-display">
              Curated Problem Sets
            </h2>
            <p className="text-[12px] text-[var(--text-secondary)]">
              Solve problems and check them off to record evidence and unlock downstream milestones.
            </p>
          </div>

          {/* Progress Gauge */}
          <div className="text-right sm:w-48 space-y-1.5 shrink-0">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-[var(--text-muted)]">Progress</span>
              <span className="font-bold text-[var(--primary-300)]">{solvedPercent}%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-[var(--bg-void)] border border-[var(--border-dim)] overflow-hidden">
              <div
                className="h-full bg-[var(--primary-500)] rounded-full transition-all"
                style={{ width: `${solvedPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-[var(--border-dim)]">
          {/* Search */}
          <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-xl bg-[var(--bg-void)] border border-[var(--border-subtle)]">
            <Search size={13} className="text-[var(--text-muted)] shrink-0" />
            <input
              type="text"
              value={questionSearch}
              onChange={e => setQuestionSearch(e.target.value)}
              placeholder="Filter practice challenges e.g. SQL, Hash Map, Titanic, Two Sum…"
              className="flex-1 bg-transparent outline-none text-[12px] text-[var(--text-primary)] placeholder-[var(--text-muted)]"
            />
            {questionSearch && (
              <button onClick={() => setQuestionSearch('')} className="text-[var(--text-muted)]">
                <X size={12} />
              </button>
            )}
          </div>

          {/* Topic Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {(['ALL', 'sql', 'python', 'javascript', 'react', 'machine-learning', 'nodejs', 'docker'] as const).map(t => (
              <button
                key={t}
                onClick={() => setSelectedTopicFilter(t)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-mono border transition-all cursor-pointer shrink-0 ${
                  selectedTopicFilter === t
                    ? 'bg-[var(--primary-500)] text-slate-950 font-bold border-transparent'
                    : 'bg-[var(--bg-void)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {t === 'ALL' ? 'All Topics' : t.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Difficulty Filters */}
          <div className="flex items-center gap-1.5">
            {(['ALL', 'EASY', 'MEDIUM', 'HARD'] as const).map(d => (
              <button
                key={d}
                onClick={() => setSelectedDiffFilter(d)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-mono border transition-all cursor-pointer shrink-0 ${
                  selectedDiffFilter === d
                    ? 'bg-[var(--primary-500)] text-slate-950 font-bold border-transparent'
                    : 'bg-[var(--bg-void)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Question List ────────────────────────────────────────────── */}
      <div className="space-y-3">
        {filteredQuestions.length === 0 ? (
          <div className="py-16 text-center card space-y-2">
            <Code2 size={28} className="mx-auto text-[var(--text-muted)]" />
            <p className="text-[13px] text-[var(--text-secondary)]">No practice problems match your filter.</p>
            <button
              onClick={() => { setSelectedTopicFilter('ALL'); setSelectedDiffFilter('ALL'); setQuestionSearch(''); }}
              className="btn btn-ghost mx-auto text-[11px] font-mono"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          filteredQuestions.map((q, idx) => {
            const isSolved = completedQuestions.has(q.id);
            const isStarred = starredQuestions.has(q.id);
            const isToggling = togglingQuestionId === q.id;

            const diffBadge =
              q.difficulty === 'EASY'
                ? 'bg-[rgba(16,185,129,0.15)] text-[var(--accent-300)] border-[rgba(16,185,129,0.3)]'
                : q.difficulty === 'MEDIUM'
                ? 'bg-[rgba(245,158,11,0.15)] text-[var(--primary-300)] border-[rgba(245,158,11,0.3)]'
                : 'bg-[rgba(239,68,68,0.15)] text-[#f87171] border-[rgba(239,68,68,0.3)]';

            return (
              <article
                key={q.id}
                className={`p-4 px-5 rounded-2xl border transition-all animate-fade-up ${
                  isSolved
                    ? 'bg-[rgba(16,185,129,0.03)] border-[rgba(16,185,129,0.25)]'
                    : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] hover:border-[var(--border-muted)]'
                }`}
                style={{ animationDelay: `${idx * 25}ms` }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left: Checkbox + Star + Problem Details */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      onClick={(e) => toggleQuestionComplete(q, e)}
                      disabled={isToggling}
                      className="mt-0.5 shrink-0 text-[var(--text-muted)] hover:text-[var(--accent-400)] transition-colors cursor-pointer"
                      title={isSolved ? 'Mark as Unsolved' : 'Mark as Solved'}
                    >
                      {isToggling ? (
                        <Loader2 size={20} className="animate-spin text-[var(--primary-400)]" />
                      ) : isSolved ? (
                        <CheckCircle2 size={20} className="text-[var(--accent-400)] fill-[rgba(16,185,129,0.2)]" />
                      ) : (
                        <Circle size={20} className="text-[var(--border-muted)] hover:text-[var(--accent-400)]" />
                      )}
                    </button>

                    <button
                      onClick={(e) => toggleQuestionStar(q.id, e)}
                      className={`mt-0.5 shrink-0 transition-colors cursor-pointer ${
                        isStarred ? 'text-amber-400 fill-amber-400' : 'text-[var(--text-muted)] hover:text-amber-400'
                      }`}
                      title={isStarred ? 'Remove Star' : 'Star for Revision'}
                    >
                      <Star size={17} className={isStarred ? 'fill-amber-400' : ''} />
                    </button>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`text-[14px] font-bold font-display ${isSolved ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text-primary)]'}`}>
                          {q.title}
                        </h3>
                        <span className={`badge text-[9px] font-mono uppercase border ${diffBadge}`}>
                          {q.difficulty}
                        </span>
                        <span className="badge text-[9px] font-mono bg-[var(--bg-void)] border-[var(--border-dim)] text-[var(--text-muted)]">
                          {q.platform}
                        </span>
                      </div>

                      <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">
                        {q.problemStatement}
                      </p>

                      <div className="flex items-center gap-2 flex-wrap pt-0.5">
                        {q.tags.map(t => (
                          <span key={t} className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[var(--bg-void)] text-[var(--text-muted)] border border-[var(--border-dim)]">
                            #{t}
                          </span>
                        ))}
                        <span className="text-[10px] font-mono text-[var(--text-muted)] flex items-center gap-1 ml-2">
                          <Clock size={10} /> ~{q.estimatedMinutes} mins
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Direct Solve Link */}
                  <div className="shrink-0 self-start sm:self-center">
                    <a
                      href={q.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary text-[11px] py-2 px-3.5 flex items-center gap-1.5"
                      title={`Solve ${q.title} on ${q.platform}`}
                    >
                      <span>Solve Challenge</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

    </div>
  );
};
