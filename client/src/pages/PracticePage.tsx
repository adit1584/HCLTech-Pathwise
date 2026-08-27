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
  Sparkles,
  Layers,
  Send,
  ListOrdered,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { PRACTICE_QUESTIONS, type PracticeQuestion } from '../data/practiceQuestions';

interface DynamicPracticeChallenge {
  id: string;
  title: string;
  skillId: string;
  skillName: string;
  milestone: number;
  category: string;
  platform: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  estimatedMinutes: number;
  url: string;
  problemStatement: string;
  tags: string[];
  skills: string[];
}

interface TopicPlaylist {
  skillId: string;
  skillName: string;
  milestone: number;
  category: string;
  questions: DynamicPracticeChallenge[];
  solvedCount: number;
  totalCount: number;
}

const DIFFICULTY_ORDER: Record<string, number> = {
  'EASY': 1,
  'MEDIUM': 2,
  'HARD': 3,
};

export const PracticePage: React.FC = () => {
  const { success: toastSuccess, error: toastError } = useToast();

  const [loading, setLoading] = useState(true);
  const [targetRole, setTargetRole] = useState('Full Stack Developer');
  const [roadmapSkills, setRoadmapSkills] = useState<Array<{ skillId: string; skillName: string; milestone: number }>>([]);
  const [questions, setQuestions] = useState<DynamicPracticeChallenge[]>([]);

  // Persistent Completion & Star Sets
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

  // Filters
  const [selectedMilestoneFilter, setSelectedMilestoneFilter] = useState<'ALL' | number>('ALL');
  const [selectedSkillFilter, setSelectedSkillFilter] = useState<string>('ALL');
  const [selectedDiffFilter, setSelectedDiffFilter] = useState<'ALL' | 'EASY' | 'MEDIUM' | 'HARD'>('ALL');
  const [questionSearch, setQuestionSearch] = useState<string>('');

  // Custom AI Question Generation State
  const [isAiGeneratorOpen, setIsAiGeneratorOpen] = useState(false);
  const [customTopicInput, setCustomTopicInput] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Load Roadmap-aligned questions on mount
  useEffect(() => {
    loadRoadmapQuestions();
  }, []);

  const loadRoadmapQuestions = async () => {
    setLoading(true);
    try {
      const res = await api.getRoadmapPracticeQuestions();
      setTargetRole(res.targetRoleName || res.targetRole || 'Full Stack Developer');
      setRoadmapSkills(res.roadmapSkills || []);
      if (res.questions && res.questions.length > 0) {
        setQuestions(res.questions as DynamicPracticeChallenge[]);
      } else {
        // Fallback to static practice set
        setQuestions(PRACTICE_QUESTIONS.map((q, i) => ({
          ...q,
          skillId: q.skills[0] || 'general',
          skillName: q.topicName,
          milestone: Math.min(4, Math.floor(i / 3) + 1),
        })));
      }
    } catch (err) {
      console.warn('Failed to load roadmap practice questions, using default pool:', err);
      setQuestions(PRACTICE_QUESTIONS.map((q, i) => ({
        ...q,
        skillId: q.skills[0] || 'general',
        skillName: q.topicName,
        milestone: Math.min(4, Math.floor(i / 3) + 1),
      })));
    } finally {
      setLoading(false);
    }
  };

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
  const toggleQuestionComplete = async (q: DynamicPracticeChallenge, e: React.MouseEvent) => {
    e.stopPropagation();
    const wasDone = completedQuestions.has(q.id);

    try {
      if (!wasDone) {
        await api.submitPracticeAnswer({
          questionId: q.id,
          skillId: q.skillId,
          title: q.title,
        });
        setCompletedQuestions(prev => new Set(prev).add(q.id));
        toastSuccess(`✓ Solved: ${q.title}! +50 XP Earned.`);
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
      toastError('Could not record practice progress.');
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

  // AI On-Demand Generator Handler
  const handleGenerateAiChallenges = async () => {
    const topic = customTopicInput.trim();
    if (!topic) return;

    setIsGeneratingAi(true);
    try {
      const skillId = topic.toLowerCase().replace(/\s+/g, '-');
      const res = await api.generatePracticeQuestions({
        skillId,
        skillName: topic,
        role: targetRole,
        count: 3,
      });

      if (res.questions && res.questions.length > 0) {
        const newChallenges: DynamicPracticeChallenge[] = res.questions.map((item: any, idx: number) => ({
          ...item,
          id: item.id || `custom-${Date.now()}-${idx}`,
          skillId,
          skillName: topic,
          milestone: 1,
        }));

        setQuestions(prev => [...newChallenges, ...prev]);
        setCustomTopicInput('');
        setIsAiGeneratorOpen(false);
        toastSuccess(`✨ Created 3-Challenge Playlist (Easy ➔ Med ➔ Hard) for "${topic}"!`);
      }
    } catch (err) {
      console.error(err);
      toastError('Failed to generate AI practice challenges.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Group and sort questions by Topic Playlists (Easy ➔ Medium ➔ Hard)
  const topicPlaylists = useMemo<TopicPlaylist[]>(() => {
    const map = new Map<string, {
      skillId: string;
      skillName: string;
      milestone: number;
      category: string;
      questions: DynamicPracticeChallenge[];
    }>();

    questions.forEach(q => {
      // Apply filters
      if (selectedMilestoneFilter !== 'ALL' && q.milestone !== selectedMilestoneFilter) return;
      if (selectedSkillFilter !== 'ALL' && q.skillId !== selectedSkillFilter) return;
      if (selectedDiffFilter !== 'ALL' && q.difficulty !== selectedDiffFilter) return;
      if (questionSearch.trim()) {
        const query = questionSearch.toLowerCase();
        const match =
          q.title.toLowerCase().includes(query) ||
          q.problemStatement.toLowerCase().includes(query) ||
          q.skillName.toLowerCase().includes(query) ||
          q.tags.some(t => t.toLowerCase().includes(query));
        if (!match) return;
      }

      const key = q.skillId;
      if (!map.has(key)) {
        map.set(key, {
          skillId: q.skillId,
          skillName: q.skillName,
          milestone: q.milestone,
          category: q.category || 'Engineering',
          questions: [],
        });
      }
      map.get(key)!.questions.push(q);
    });

    // Sort each playlist questions strictly: EASY ➔ MEDIUM ➔ HARD
    const playlists: TopicPlaylist[] = [];
    map.forEach(group => {
      const sortedQuestions = [...group.questions].sort((a, b) => {
        const diffA = DIFFICULTY_ORDER[a.difficulty] || 2;
        const diffB = DIFFICULTY_ORDER[b.difficulty] || 2;
        return diffA - diffB;
      });

      const solved = sortedQuestions.filter(q => completedQuestions.has(q.id)).length;
      playlists.push({
        skillId: group.skillId,
        skillName: group.skillName,
        milestone: group.milestone,
        category: group.category,
        questions: sortedQuestions,
        solvedCount: solved,
        totalCount: sortedQuestions.length,
      });
    });

    // Sort playlists by Milestone ascending
    return playlists.sort((a, b) => a.milestone - b.milestone);
  }, [questions, selectedMilestoneFilter, selectedSkillFilter, selectedDiffFilter, questionSearch, completedQuestions]);

  const totalQuestionsCount = questions.length;
  const totalSolvedCount = useMemo(() => {
    return questions.filter(q => completedQuestions.has(q.id)).length;
  }, [questions, completedQuestions]);

  const solvedPercent = totalQuestionsCount > 0 ? Math.round((totalSolvedCount / totalQuestionsCount) * 100) : 0;

  return (
    <div className="page-shell space-y-6 page-enter pb-16">

      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[var(--border-dim)] animate-fade-up">
        <div className="space-y-1">
          <p className="section-eyebrow">Interactive Coding Arena</p>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="section-title">Topic Practice Playlists</h1>
            <span className="badge badge-amber text-[10px] font-mono uppercase font-bold">
              {targetRole}
            </span>
          </div>
          <p className="text-[13px] text-[var(--text-secondary)]">
            Curated challenge playlists ordered from <strong className="text-emerald-400">Easy</strong> ➔ <strong className="text-amber-400">Medium</strong> ➔ <strong className="text-red-400">Hard</strong> for each skill on your roadmap.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setIsAiGeneratorOpen(prev => !prev)}
            className="btn btn-secondary btn-sm text-[12px] font-mono flex items-center gap-1.5 border-[rgba(245,158,11,0.3)] bg-[rgba(245,158,11,0.06)] text-[var(--primary-300)] hover:bg-[rgba(245,158,11,0.12)] cursor-pointer"
          >
            <Sparkles size={13} className="text-[var(--primary-400)]" />
            <span>+ AI Topic Playlist</span>
          </button>
          <div className="text-right">
            <span className="text-[11px] font-mono text-[var(--text-muted)]">
              Solved: <strong className="text-[var(--primary-300)]">{totalSolvedCount} / {totalQuestionsCount}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* ── AI Generator Collapsible Drawer ─────────────────────────── */}
      {isAiGeneratorOpen && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-cyan-500/10 to-transparent border border-amber-500/30 space-y-3 animate-fade-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-amber-400" />
              <h3 className="text-sm font-bold text-white font-display">
                Create an AI Practice Playlist (Easy ➔ Medium ➔ Hard)
              </h3>
            </div>
            <button
              onClick={() => setIsAiGeneratorOpen(false)}
              className="text-[var(--text-muted)] hover:text-white"
            >
              <X size={15} />
            </button>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            Type any technical topic or skill to generate a graduated 3-challenge playlist with direct links to real problem sets.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={customTopicInput}
              onChange={e => setCustomTopicInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleGenerateAiChallenges()}
              placeholder="e.g. HTML5 Forms, Tailwind CSS, GraphQL Mutations, PyTorch Attention, Rust Memory..."
              className="flex-1 p-3 rounded-xl bg-[var(--bg-void)] border border-[var(--border-subtle)] focus:border-[var(--primary-500)] text-xs text-white outline-none"
            />
            <button
              onClick={handleGenerateAiChallenges}
              disabled={isGeneratingAi || !customTopicInput.trim()}
              className="btn btn-primary text-xs font-mono px-4 flex items-center gap-1.5 shrink-0"
            >
              {isGeneratingAi ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              <span>Generate Playlist</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Progress Card & Toolbar ─────────────────────────────────── */}
      <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-4 animate-fade-up">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="badge badge-amber text-[10px]">
                <Flame size={10} /> GRADUATED PLAYLISTS
              </span>
              <span className="text-[11px] font-mono text-[var(--text-muted)]">
                {topicPlaylists.length} Topic Tracks Available
              </span>
            </div>
            <h2 className="text-lg font-bold text-[var(--text-primary)] font-display">
              Skill-by-Skill Practice Tracks
            </h2>
            <p className="text-[12px] text-[var(--text-secondary)]">
              Master each topic progressively: start with foundational Easy challenges, level up to Medium implementation, and conquer Hard system architecture.
            </p>
          </div>

          {/* Progress Gauge */}
          <div className="text-right sm:w-48 space-y-1.5 shrink-0">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-[var(--text-muted)]">Overall Progress</span>
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

        {/* Milestone Tab Filters */}
        <div className="pt-3 border-t border-[var(--border-dim)] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-[var(--text-muted)] font-bold flex items-center gap-1">
              <Layers size={11} className="text-[var(--primary-400)]" /> ROADMAP MILESTONES:
            </span>
            <span className="text-[10px] font-mono text-[var(--text-muted)]">
              {topicPlaylists.length} playlists showing
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {(['ALL', 1, 2, 3, 4] as const).map(m => {
              const isActive = selectedMilestoneFilter === m;
              return (
                <button
                  key={`m-${m}`}
                  onClick={() => setSelectedMilestoneFilter(m)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-mono border transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                    isActive
                      ? 'bg-[var(--primary-500)] text-slate-950 font-bold border-transparent shadow-sm'
                      : 'bg-[var(--bg-void)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-white'
                  }`}
                >
                  {m === 'ALL' ? 'All Milestones' : `Milestone ${m}`}
                </button>
              );
            })}
          </div>

          {/* Skill Filter Chips */}
          {roadmapSkills.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedSkillFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono border transition-all shrink-0 cursor-pointer ${
                  selectedSkillFilter === 'ALL'
                    ? 'bg-[var(--cyan-400)] text-slate-950 font-bold border-transparent'
                    : 'bg-[var(--bg-void)] border-[var(--border-dim)] text-[var(--text-muted)] hover:text-white'
                }`}
              >
                All Topics
              </button>
              {roadmapSkills.map(sk => {
                const isSelected = selectedSkillFilter === sk.skillId;
                return (
                  <button
                    key={sk.skillId}
                    onClick={() => setSelectedSkillFilter(sk.skillId)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono border transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? 'bg-[var(--cyan-400)] text-slate-950 font-bold border-transparent'
                        : 'bg-[var(--bg-void)] border-[var(--border-dim)] text-[var(--text-muted)] hover:text-white'
                    }`}
                  >
                    <span>{sk.skillName}</span>
                    <span className="opacity-60 text-[9px]">(M{sk.milestone})</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Search & Difficulty Filter Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-[var(--border-dim)]">
          {/* Search */}
          <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-xl bg-[var(--bg-void)] border border-[var(--border-subtle)]">
            <Search size={13} className="text-[var(--text-muted)] shrink-0" />
            <input
              type="text"
              value={questionSearch}
              onChange={e => setQuestionSearch(e.target.value)}
              placeholder="Search challenges by keyword, topic, or tags (e.g. HTML, Flexbox, SQL, React)..."
              className="flex-1 bg-transparent outline-none text-[12px] text-[var(--text-primary)] placeholder-[var(--text-muted)]"
            />
            {questionSearch && (
              <button onClick={() => setQuestionSearch('')} className="text-[var(--text-muted)]">
                <X size={12} />
              </button>
            )}
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

      {/* ── Topic Playlists ─────────────────────────────────────────── */}
      <div className="space-y-6">
        {loading ? (
          <div className="py-16 text-center card space-y-3">
            <Loader2 size={32} className="mx-auto text-[var(--primary-400)] animate-spin" />
            <p className="text-xs font-mono text-[var(--text-secondary)]">Loading topic practice playlists...</p>
          </div>
        ) : topicPlaylists.length === 0 ? (
          <div className="py-16 text-center card space-y-2">
            <Code2 size={28} className="mx-auto text-[var(--text-muted)]" />
            <p className="text-[13px] text-[var(--text-secondary)]">No practice playlists match your filter.</p>
            <button
              onClick={() => {
                setSelectedMilestoneFilter('ALL');
                setSelectedSkillFilter('ALL');
                setSelectedDiffFilter('ALL');
                setQuestionSearch('');
              }}
              className="btn btn-ghost mx-auto text-[11px] font-mono"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          topicPlaylists.map(playlist => {
            const playlistPercent = Math.round((playlist.solvedCount / playlist.totalCount) * 100);
            const isAllSolved = playlist.solvedCount === playlist.totalCount && playlist.totalCount > 0;

            return (
              <section
                key={playlist.skillId}
                className="p-5 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-4 animate-fade-up shadow-sm"
              >
                {/* Playlist Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-dim)]">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="badge text-[9px] font-mono bg-[rgba(14,165,233,0.12)] text-[var(--cyan-300)] border border-[rgba(14,165,233,0.3)]">
                        Milestone {playlist.milestone}
                      </span>
                      <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
                        <ListOrdered size={16} className="text-[var(--primary-400)]" />
                        <span>{playlist.skillName} Playlist</span>
                      </h3>
                      <span className="text-[11px] font-mono text-[var(--text-muted)]">
                        • {playlist.questions.length} Graduated Challenges (Easy ➔ Med ➔ Hard)
                      </span>
                    </div>
                  </div>

                  {/* Playlist Progress */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] font-mono text-[var(--text-muted)]">
                      {playlist.solvedCount} / {playlist.totalCount} Solved ({playlistPercent}%)
                    </span>
                    <div className="w-24 h-2 rounded-full bg-[var(--bg-void)] border border-[var(--border-dim)] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${isAllSolved ? 'bg-emerald-400' : 'bg-[var(--primary-500)]'}`}
                        style={{ width: `${playlistPercent}%` }}
                      />
                    </div>
                    {isAllSolved && (
                      <span className="badge badge-emerald text-[9px] font-mono font-bold">
                        ✓ COMPLETED
                      </span>
                    )}
                  </div>
                </div>

                {/* Playlist Questions (Ordered Easy ➔ Medium ➔ Hard) */}
                <div className="space-y-2.5">
                  {playlist.questions.map((q, idx) => {
                    const isSolved = completedQuestions.has(q.id);
                    const isStarred = starredQuestions.has(q.id);

                    const diffBadge =
                      q.difficulty === 'EASY'
                        ? 'bg-[rgba(16,185,129,0.15)] text-[var(--accent-300)] border-[rgba(16,185,129,0.3)]'
                        : q.difficulty === 'MEDIUM'
                        ? 'bg-[rgba(245,158,11,0.15)] text-[var(--primary-300)] border-[rgba(245,158,11,0.3)]'
                        : 'bg-[rgba(239,68,68,0.15)] text-[#f87171] border-[rgba(239,68,68,0.3)]';

                    const stepLabel = idx === 0 ? 'LEVEL 1' : idx === 1 ? 'LEVEL 2' : 'LEVEL 3';

                    return (
                      <div
                        key={q.id}
                        className={`p-3.5 px-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isSolved
                            ? 'bg-[rgba(16,185,129,0.03)] border-[rgba(16,185,129,0.25)]'
                            : 'bg-[var(--bg-void)] border-[var(--border-subtle)] hover:border-[var(--border-muted)]'
                        }`}
                      >
                        {/* Left: Level Step + Checkbox + Star + Info */}
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          {/* Step Marker */}
                          <span className="mt-0.5 text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-dim)] text-[var(--text-muted)] shrink-0">
                            {stepLabel}
                          </span>

                          {/* Checkbox */}
                          <button
                            onClick={(e) => toggleQuestionComplete(q, e)}
                            className="mt-0.5 shrink-0 text-[var(--text-muted)] hover:text-[var(--accent-400)] transition-colors cursor-pointer"
                            title={isSolved ? 'Mark as Unsolved' : 'Mark as Solved (+50 XP)'}
                          >
                            {isSolved ? (
                              <CheckCircle2 size={18} className="text-[var(--accent-400)] fill-[rgba(16,185,129,0.2)]" />
                            ) : (
                              <Circle size={18} className="text-[var(--border-muted)] hover:text-[var(--accent-400)]" />
                            )}
                          </button>

                          {/* Star */}
                          <button
                            onClick={(e) => toggleQuestionStar(q.id, e)}
                            className={`mt-0.5 shrink-0 transition-colors cursor-pointer ${
                              isStarred ? 'text-amber-400 fill-amber-400' : 'text-[var(--text-muted)] hover:text-amber-400'
                            }`}
                            title={isStarred ? 'Remove Star' : 'Star for Revision'}
                          >
                            <Star size={15} className={isStarred ? 'fill-amber-400' : ''} />
                          </button>

                          {/* Question Text */}
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className={`text-[13px] font-bold font-display ${isSolved ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text-primary)]'}`}>
                                {q.title}
                              </h4>
                              <span className={`badge text-[9px] font-mono uppercase border ${diffBadge}`}>
                                {q.difficulty}
                              </span>
                              <span className="badge text-[9px] font-mono bg-[var(--bg-surface)] border-[var(--border-dim)] text-[var(--text-muted)]">
                                {q.platform}
                              </span>
                            </div>

                            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                              {q.problemStatement}
                            </p>

                            <div className="flex items-center gap-2 flex-wrap pt-0.5">
                              {q.tags.map(t => (
                                <span key={t} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-dim)]">
                                  #{t}
                                </span>
                              ))}
                              <span className="text-[9px] font-mono text-[var(--text-muted)] flex items-center gap-1 ml-2">
                                <Clock size={9} /> ~{q.estimatedMinutes} mins
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Direct Question Open Challenge Button */}
                        <div className="shrink-0 self-start sm:self-center">
                          <a
                            href={q.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary text-[11px] py-1.5 px-3.5 flex items-center gap-1.5 cursor-pointer shadow-sm"
                            title={`Open challenge "${q.title}" on ${q.platform}`}
                          >
                            <span>Open Challenge</span>
                            <ExternalLink size={11} />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })
        )}
      </div>

    </div>
  );
};
