import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { DiagnosticQuestion } from '../types';
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  TrendingUp,
  Loader2,
  Sparkles,
  SkipForward,
  Keyboard,
} from 'lucide-react';

export const DiagnosticPage: React.FC = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<DiagnosticQuestion[]>([]);
  const [targetRole, setTargetRole] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [qId: string]: number }>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);

  const DEFAULT_DIAGNOSTIC_QUESTIONS: DiagnosticQuestion[] = [
    {
      id: 'diag-sql-1',
      skillId: 'sql',
      skillName: 'SQL & Relational Databases',
      difficulty: 2,
      question: 'Which SQL clause is executed first in query processing order?',
      options: ['SELECT', 'FROM / JOIN', 'WHERE', 'ORDER BY'],
      correctAnswer: 1,
      explanation: 'The FROM clause (and JOINs) are evaluated first to establish the working dataset before filtering (WHERE) or projecting (SELECT).',
    },
    {
      id: 'diag-py-1',
      skillId: 'python',
      skillName: 'Python Core',
      difficulty: 2,
      question: 'What is the time complexity of looking up a key in a standard Python dictionary?',
      options: ['O(n)', 'O(log n)', 'O(1) average', 'O(n^2)'],
      correctAnswer: 2,
      explanation: 'Python dictionaries use hash tables, providing average O(1) time complexity for key lookups.',
    },
    {
      id: 'diag-ml-1',
      skillId: 'machine-learning',
      skillName: 'Machine Learning',
      difficulty: 3,
      question: 'Why is train/test data leakage problematic when evaluating ML models?',
      options: ['It slows down training', 'It inflates test metrics unrealistically without generalizing to real-world data', 'It requires more memory', 'It causes compiler errors'],
      correctAnswer: 1,
      explanation: 'Data leakage gives the model access to target or test distribution info during training, creating falsely high evaluation scores that fail in production.',
    },
    {
      id: 'diag-stat-1',
      skillId: 'statistics',
      skillName: 'Statistics & Probability',
      difficulty: 2,
      question: 'Which metric is resistant to extreme outliers in skewed distributions?',
      options: ['Mean', 'Median', 'Variance', 'Range'],
      correctAnswer: 1,
      explanation: 'The median represents the central 50th percentile rank and is unaffected by extreme outlier values.',
    },
  ];

  useEffect(() => {
    setLoading(true);
    api.startDiagnostic()
      .then(res => {
        if (res.questions && res.questions.length > 0) {
          setQuestions(res.questions);
          setTargetRole(res.targetRole || 'Software Engineering');
        } else {
          setQuestions(DEFAULT_DIAGNOSTIC_QUESTIONS);
          setTargetRole('Software Engineering');
        }
      })
      .catch(() => {
        setQuestions(DEFAULT_DIAGNOSTIC_QUESTIONS);
        setTargetRole('Software Engineering');
      })
      .finally(() => setLoading(false));
  }, []);

  const currentQ = questions[currentIndex];
  const selectedOption = currentQ ? selectedAnswers[currentQ.id] : undefined;
  const progressRatio = questions.length ? (currentIndex + 1) / questions.length : 0;

  const handleSelectOption = useCallback((idx: number) => {
    if (showExplanation || results || !currentQ) return;
    setSelectedAnswers(prev => ({ ...prev, [currentQ.id]: idx }));
    setShowExplanation(true);
  }, [showExplanation, results, currentQ]);

  const handleNext = useCallback(() => {
    setShowExplanation(false);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      handleSubmitAll();
    }
  }, [currentIndex, questions.length]);

  const handleSubmitAll = async () => {
    setSubmitting(true);
    try {
      const answersPayload = questions.map(q => ({
        questionId: q.id,
        selectedAnswer: selectedAnswers[q.id] ?? -1,
      }));
      const res = await api.submitDiagnostic(answersPayload);
      setResults(res.results);
      const changedSkills = res.results.map((r: any) => r.skillId);
      if (changedSkills.length > 0) {
        await api.recompilePath(changedSkills, 'Diagnostic completed');
      }
    } catch (err) {
      console.error('Diagnostic submit failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Keyboard Shortcuts (A-D, 1-4, Enter) ──────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      const key = e.key.toUpperCase();

      if (!showExplanation && currentQ) {
        if (key === 'A' || key === '1') { e.preventDefault(); handleSelectOption(0); }
        else if (key === 'B' || key === '2') { e.preventDefault(); handleSelectOption(1); }
        else if (key === 'C' || key === '3') { e.preventDefault(); handleSelectOption(2); }
        else if (key === 'D' || key === '4') { e.preventDefault(); handleSelectOption(3); }
      } else if (showExplanation && (key === 'ENTER' || key === ' ' || key === 'ARROW_RIGHT')) {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showExplanation, currentQ, handleSelectOption, handleNext]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center space-y-4 animate-fade-in">
          <div className="relative mx-auto w-12 h-12">
            <div className="absolute inset-0 rounded-full border-2 border-[var(--primary-500)] border-t-transparent animate-spin" />
          </div>
          <p className="text-[13px] text-[var(--text-secondary)]">
            Generating adaptive diagnostic calibrated to your skill profile…
          </p>
        </div>
      </div>
    );
  }

  // ── Results ──────────────────────────────────────────────────────────────
  if (results) {
    const avgGain = results.reduce((s, r) => s + (r.after - r.before), 0) / results.length;
    return (
      <div className="page-shell max-w-2xl mx-auto space-y-8 page-enter">
        {/* Success header */}
        <div className="text-center space-y-4 pt-8">
          <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center bg-[rgba(16,185,129,0.12)] border border-[rgba(16,185,129,0.3)] glow-emerald">
            <CheckCircle2 size={28} className="text-[var(--success-400)]" />
          </div>
          <h1 className="section-title">Diagnostic Complete</h1>
          <p className="text-[13px] text-[var(--text-secondary)] max-w-sm mx-auto">
            Mastery model updated with high-confidence assessment evidence.
            Average proficiency gain: <strong className="text-[var(--success-400)] font-mono">+{Math.round(avgGain)}%</strong>
          </p>
        </div>

        {/* Results table */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--border-dim)] flex items-center gap-2">
            <TrendingUp size={14} className="text-[var(--primary-400)]" />
            <h2 className="text-[12px] font-bold uppercase tracking-wider text-[var(--text-secondary)] font-mono">
              Calibrated Proficiencies
            </h2>
          </div>
          <div className="divide-y divide-[var(--border-dim)]">
            {results.map((r, i) => {
              const gain = r.after - r.before;
              return (
                <div
                  key={r.skillId}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-[var(--bg-raised)] transition-colors animate-fade-up"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-[var(--text-primary)]">{r.skillName}</div>
                    <div className="text-[10px] font-mono text-[var(--text-muted)] mt-0.5">
                      Confidence: {(r.confidenceAfter * 100).toFixed(2)}%
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-[12px] text-[var(--text-muted)] line-through">{Number(r.before.toFixed(2))}%</span>
                    <span className="font-mono text-[16px] font-bold text-[var(--text-primary)]">{Number(r.after.toFixed(2))}%</span>
                    <span
                      className="badge font-mono text-[9px]"
                      style={{
                        background: gain > 0 ? 'rgba(16,185,129,0.1)' : gain < 0 ? 'rgba(239,68,68,0.1)' : 'var(--bg-overlay)',
                        borderColor: gain > 0 ? 'rgba(16,185,129,0.3)' : gain < 0 ? 'rgba(239,68,68,0.3)' : 'var(--border-dim)',
                        color: gain > 0 ? 'var(--success-300)' : gain < 0 ? 'var(--danger-300)' : 'var(--text-muted)',
                      }}
                    >
                      {gain >= 0 ? '+' : ''}{Number(gain.toFixed(2))}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-center pb-8">
          <button
            id="diagnostic-proceed-btn"
            onClick={() => navigate('/dashboard')}
            className="btn btn-primary"
            style={{ padding: '0.875rem 2.5rem', fontSize: '0.9375rem' }}
          >
            View Recompiled Roadmap <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  // ── No questions ─────────────────────────────────────────────────────────
  if (questions.length === 0) {
    return (
      <div className="page-shell max-w-lg mx-auto py-24 text-center space-y-4">
        <p className="text-[var(--text-secondary)]">No diagnostic questions available for this profile.</p>
        <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
          Go to Dashboard
        </button>
      </div>
    );
  }

  // ── Question view ────────────────────────────────────────────────────────
  return (
    <div className="page-shell max-w-2xl mx-auto space-y-6 page-enter">

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[var(--border-dim)] animate-fade-up">
        <div>
          <p className="section-eyebrow">Diagnostic · {targetRole.replace(/-/g, ' ')}</p>
          <h1 className="text-[1.35rem] font-bold text-[var(--text-primary)] font-display">Calibrating Mastery</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-[var(--text-muted)] bg-[var(--bg-surface)] px-2 py-1 rounded-md border border-[var(--border-dim)]">
            <Keyboard size={12} /> Press A–D to answer
          </span>
          <div className="font-mono text-[12px] text-[var(--text-secondary)]">
            <span className="text-[var(--primary-300)] font-bold text-[15px]">{currentIndex + 1}</span>
            <span className="text-[var(--text-muted)]"> / {questions.length}</span>
          </div>
        </div>
      </div>

      {/* Progress bar — GPU accelerated scaleX */}
      <div className="progress-track h-[4px] animate-fade-up delay-100">
        <div
          className="progress-fill progress-fill-amber"
          style={{ transform: `scaleX(${progressRatio})` }}
        />
      </div>

      {/* Question card */}
      <div className="card p-6 sm:p-8 space-y-6 animate-fade-up">
        {/* Meta row */}
        <div className="flex items-center justify-between">
          <span className="badge badge-amber font-mono text-[9px]">
            {currentQ.skillName}
          </span>
          <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] font-mono">
            Difficulty
            {Array.from({ length: 5 }, (_, i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: i < currentQ.difficulty ? 'var(--primary-400)' : 'var(--bg-overlay)' }}
              />
            ))}
          </div>
        </div>

        {/* Question text */}
        <h2 className="text-[16px] font-semibold text-[var(--text-primary)] leading-relaxed font-sans">
          {currentQ.question}
        </h2>

        {/* Options */}
        <div className="space-y-2.5" role="radiogroup" aria-label="Answer options">
          {currentQ.options.map((option, idx) => {
            const isSelected = selectedOption === idx;
            const isCorrect  = currentQ.correctAnswer === idx;
            let cls = 'diag-option';
            if (showExplanation) {
              if (isCorrect) cls += ' selected-correct';
              else if (isSelected && !isCorrect) cls += ' selected-wrong';
            } else if (isSelected) {
              cls = 'diag-option border-[var(--primary-500)] bg-[rgba(245,158,11,0.1)] text-[var(--text-primary)]';
            }

            const letter = String.fromCharCode(65 + idx);

            return (
              <button
                key={idx}
                type="button"
                role="radio"
                aria-checked={isSelected}
                id={`option-${currentQ.id}-${idx}`}
                onClick={() => handleSelectOption(idx)}
                disabled={!!showExplanation}
                className={cls}
              >
                <span className="flex items-center gap-3">
                  <span
                    className="shrink-0 w-6 h-6 rounded-lg border flex items-center justify-center text-[10px] font-bold font-mono transition-all"
                    style={{
                      borderColor: showExplanation && isCorrect ? 'var(--success-500)' :
                                   showExplanation && isSelected && !isCorrect ? 'var(--danger-500)' :
                                   isSelected ? 'var(--primary-500)' : 'var(--border-muted)',
                      color: showExplanation && isCorrect ? 'var(--success-400)' :
                             showExplanation && isSelected && !isCorrect ? 'var(--danger-400)' :
                             isSelected ? 'var(--primary-300)' : 'var(--text-muted)',
                      background: showExplanation && isCorrect ? 'rgba(16,185,129,0.15)' :
                                  showExplanation && isSelected && !isCorrect ? 'rgba(239,68,68,0.15)' : 'var(--bg-void)',
                    }}
                  >
                    {letter}
                  </span>
                  <span className="text-[13px]">{option}</span>
                </span>
                {showExplanation && isCorrect && <CheckCircle2 size={16} className="shrink-0 text-[var(--success-400)]" />}
                {showExplanation && isSelected && !isCorrect && <XCircle size={16} className="shrink-0 text-[var(--danger-400)]" />}
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {showExplanation && (
          <div
            className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-void)] space-y-2 animate-fade-in"
            role="note"
            aria-label="Explanation"
          >
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--primary-400)] font-mono">
              <Sparkles size={12} /> EXPLANATION
            </div>
            <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">
              {currentQ.explanation}
            </p>
          </div>
        )}

        {/* Next / Finish */}
        {showExplanation && (
          <div className="flex items-center justify-between pt-2 animate-fade-up">
            <span className="text-[11px] text-[var(--text-muted)] font-mono">
              Press Enter or Space ↵
            </span>
            <button
              id="diagnostic-next-btn"
              onClick={handleNext}
              disabled={submitting}
              className="btn btn-primary"
            >
              {submitting ? (
                <><Loader2 size={14} className="animate-spin" /> Submitting…</>
              ) : currentIndex < questions.length - 1 ? (
                <>Next Question <ArrowRight size={14} /></>
              ) : (
                <>Finish Diagnostic <SkipForward size={14} /></>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
