import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Trophy,
  Zap,
  ArrowRight,
  ArrowLeft,
  Code2,
  HelpCircle,
  RotateCcw,
  Sparkles,
  Loader2,
  Keyboard,
} from 'lucide-react';
import { getQuizForSkill, MILESTONE_QUIZZES, type MilestoneQuiz, type QuizQuestion } from '../data/milestoneQuizzes';
import { api } from '../services/api';
import { useToast } from './Toast';

interface MilestoneAssessmentModalProps {
  skillId: string;
  topicTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onAssessmentPassed: (score: number) => void;
}

export const MilestoneAssessmentModal: React.FC<MilestoneAssessmentModalProps> = ({
  skillId,
  topicTitle,
  isOpen,
  onClose,
  onAssessmentPassed,
}) => {
  const { success: toastSuccess, error: toastError } = useToast();

  const quiz: MilestoneQuiz = useMemo(() => {
    const loaded = getQuizForSkill(skillId || 'sql', topicTitle || 'Milestone Assessment');
    if (!loaded || !loaded.questions || loaded.questions.length === 0) {
      return MILESTONE_QUIZZES.sql;
    }
    return loaded;
  }, [skillId, topicTitle]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string | number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Reset state whenever modal opens or target changes
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setSelectedAnswers({});
      setIsSubmitted(false);
      setSubmitting(false);
    }
  }, [isOpen, skillId, topicTitle]);

  const safeQuestions: QuizQuestion[] = (quiz && quiz.questions && quiz.questions.length > 0)
    ? quiz.questions
    : MILESTONE_QUIZZES.sql.questions;
  const totalQuestions = safeQuestions.length;
  const safeIndex = Math.min(Math.max(0, currentIndex), Math.max(0, totalQuestions - 1));
  const currentQ: QuizQuestion = safeQuestions[safeIndex] || safeQuestions[0] || MILESTONE_QUIZZES.sql.questions[0];
  const answeredCount = Object.keys(selectedAnswers).length;

  const handleSelectOption = (optionIndex: number) => {
    if (isSubmitted || !currentQ) return;
    setSelectedAnswers(prev => ({ ...prev, [currentQ.id]: optionIndex }));
  };

  // Calculate score
  let correctCount = 0;
  safeQuestions.forEach(q => {
    if (selectedAnswers[q.id] === q.correctAnswer) {
      correctCount++;
    }
  });
  const scorePercent = totalQuestions > 0 ? Number(((correctCount / totalQuestions) * 100).toFixed(2)) : 0;
  const isPassed = scorePercent >= (quiz.passingScorePercent || 70);

  const handleSubmitQuiz = async () => {
    if (answeredCount < totalQuestions) {
      toastError(`Please answer all ${totalQuestions} questions before submitting.`);
      return;
    }

    setSubmitting(true);
    try {
      setIsSubmitted(true);

      if (isPassed) {
        // Record assessment completion on backend
        await api.recordProgressEvent({
          type: 'ASSESSMENT_COMPLETED',
          skillIds: [skillId || 'sql'],
          resourceId: `assessment-${skillId || 'topic'}`,
          score: scorePercent,
          metadata: { topicTitle, totalQuestions, correctCount },
        });

        // Trigger dynamic DAG recompilation
        await api.recompilePath([skillId || 'sql'], `Passed assessment for ${topicTitle} (${scorePercent}%)`);

        toastSuccess(`🎉 Milestone Assessment Passed! Score: ${scorePercent}%`);
        onAssessmentPassed(scorePercent);
      }
    } catch (err) {
      console.error('Failed to submit assessment:', err);
      toastError('Could not record assessment result.');
    } finally {
      setSubmitting(false);
    }
  };

  // Keyboard Hotkeys Accelerator (1-4 / A-D to select, Arrows/Enter to navigate)
  useEffect(() => {
    if (!isOpen || isSubmitted) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      const key = e.key.toLowerCase();
      if (['1', 'a'].includes(key) && currentQ?.options?.[0] !== undefined) {
        handleSelectOption(0);
      } else if (['2', 'b'].includes(key) && currentQ?.options?.[1] !== undefined) {
        handleSelectOption(1);
      } else if (['3', 'c'].includes(key) && currentQ?.options?.[2] !== undefined) {
        handleSelectOption(2);
      } else if (['4', 'd'].includes(key) && currentQ?.options?.[3] !== undefined) {
        handleSelectOption(3);
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex(i => Math.min(totalQuestions - 1, i + 1));
      } else if (e.key === 'ArrowLeft') {
        setCurrentIndex(i => Math.max(0, i - 1));
      } else if (e.key === 'Enter') {
        if (currentIndex < totalQuestions - 1) {
          setCurrentIndex(i => Math.min(totalQuestions - 1, i + 1));
        } else if (answeredCount === totalQuestions && !submitting) {
          handleSubmitQuiz();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitted, currentQ, currentIndex, totalQuestions, answeredCount, submitting]);

  // Lock body scroll when modal is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleRetake = () => {
    setSelectedAnswers({});
    setIsSubmitted(false);
    setCurrentIndex(0);
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Milestone Assessment"
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden m-auto"
        style={{
          backgroundColor: '#0c101c',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(245, 158, 11, 0.2)',
          opacity: 1,
          visibility: 'visible',
        }}
        onClick={e => e.stopPropagation()}
      >

        {/* ── Modal Header ────────────────────────────────────────── */}
        <div
          className="p-4 px-6 flex items-center justify-between shrink-0"
          style={{
            backgroundColor: '#121828',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="badge badge-amber text-[9px] font-mono font-bold flex items-center gap-1">
                <Trophy size={10} /> MILESTONE ASSESSMENT
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Pass mark: {quiz.passingScorePercent || 70}%
              </span>
            </div>
            <h2 className="text-base font-bold text-white font-display">
              {topicTitle} Knowledge & Code Assessment
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-slate-400 bg-white/[0.04] px-2 py-1 rounded-md border border-white/[0.08]">
              <Keyboard size={11} /> Hotkeys: [1-4] [↵]
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer"
              aria-label="Close modal"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* ── Question Progress Stepper ────────────────────────────── */}
        <div
          className="px-6 py-2.5 flex items-center justify-between gap-3 text-[11px] font-mono overflow-x-auto shrink-0"
          style={{
            backgroundColor: '#080b14',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <div className="flex items-center gap-1.5 flex-wrap">
            {safeQuestions.map((q, idx) => {
              const isCurrent = idx === safeIndex;
              const isAnswered = selectedAnswers[q.id] !== undefined;
              const isCorrect = isSubmitted && selectedAnswers[q.id] === q.correctAnswer;
              const isWrong = isSubmitted && isAnswered && !isCorrect;

              let btnBg = '#141c2e';
              let btnText = '#94a3b8';
              let btnBorder = 'rgba(255, 255, 255, 0.08)';

              if (isSubmitted) {
                if (isCorrect) {
                  btnBg = '#10b981';
                  btnText = '#022c22';
                  btnBorder = '#10b981';
                } else if (isWrong) {
                  btnBg = '#ef4444';
                  btnText = '#ffffff';
                  btnBorder = '#ef4444';
                }
              } else if (isCurrent) {
                btnBg = '#f59e0b';
                btnText = '#0f172a';
                btnBorder = '#fbbf24';
              } else if (isAnswered) {
                btnBg = 'rgba(245, 158, 11, 0.2)';
                btnText = '#fcd34d';
                btnBorder = 'rgba(245, 158, 11, 0.4)';
              }

              return (
                <button
                  key={q.id || idx}
                  onClick={() => setCurrentIndex(idx)}
                  className="w-6 h-6 rounded-md text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center"
                  style={{
                    backgroundColor: btnBg,
                    color: btnText,
                    border: `1px solid ${btnBorder}`,
                  }}
                  title={`Question ${idx + 1} (${q.difficulty || 'MEDIUM'})`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <span className="text-slate-400 shrink-0 font-mono text-[11px]">
            {answeredCount}/{totalQuestions} Answered
          </span>
        </div>

        {/* ── Quiz Body ────────────────────────────────────────────── */}
        <div className="p-6 flex-1 overflow-y-auto space-y-5" style={{ backgroundColor: '#0c101c' }}>

          {/* ── Result Summary Screen (if submitted) ───────────────── */}
          {isSubmitted ? (
            <div className="text-center py-6 space-y-5">
              <div
                className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center shadow-lg relative"
                style={{
                  backgroundColor: isPassed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  border: isPassed ? '1.5px solid rgba(16, 185, 129, 0.4)' : '1.5px solid rgba(239, 68, 68, 0.4)',
                  color: isPassed ? '#34d399' : '#f87171',
                }}
              >
                {isPassed ? <Trophy size={32} /> : <AlertCircle size={32} />}
                {isPassed && (
                  <div className="absolute -top-2 -right-2 text-base animate-pulse">✨</div>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-center">
                  <span
                    className={`badge text-[10px] font-mono font-bold uppercase tracking-wider ${
                      isPassed ? 'badge-emerald' : 'badge-amber'
                    }`}
                  >
                    {isPassed ? '✓ STATUS: COMPLETED & CALIBRATED' : '⚠️ STATUS: RETRY REQUIRED'}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white font-display">
                  {isPassed ? '🎉 Milestone Assessment Passed!' : 'Assessment Not Passed'}
                </h3>
                <p className="text-[13px] text-slate-300 max-w-md mx-auto leading-relaxed">
                  {isPassed
                    ? `Outstanding work! You scored ${scorePercent}% (${correctCount}/${totalQuestions} correct). This milestone is now marked as Completed on your roadmap and your skill DAG has been dynamically recalibrated.`
                    : `You scored ${scorePercent}% (${correctCount}/${totalQuestions} correct). A score of ${quiz.passingScorePercent || 70}% is required to verify competency. Review your answers below and retake the assessment when ready.`}
                </p>
              </div>

              {/* Score Breakdown Strip */}
              <div
                className="max-w-md mx-auto p-4 rounded-2xl border flex items-center justify-around font-mono text-xs"
                style={{
                  backgroundColor: '#121828',
                  borderColor: isPassed ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
                }}
              >
                <div>
                  <span className="text-slate-400 block text-[10px]">YOUR SCORE</span>
                  <strong className={isPassed ? 'text-emerald-400 text-sm' : 'text-red-400 text-sm'}>{scorePercent}%</strong>
                </div>
                <div className="h-6 w-px bg-white/10" />
                <div>
                  <span className="text-slate-400 block text-[10px]">CORRECT ANSWERS</span>
                  <strong className="text-white text-sm">{correctCount} / {totalQuestions}</strong>
                </div>
                <div className="h-6 w-px bg-white/10" />
                <div>
                  <span className="text-slate-400 block text-[10px]">PASS CRITERIA</span>
                  <strong className="text-amber-400 text-sm">{quiz.passingScorePercent || 70}%</strong>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleRetake}
                  className="btn btn-secondary text-xs px-5 py-2.5 flex items-center gap-1.5 cursor-pointer font-bold"
                >
                  <RotateCcw size={13} />
                  <span>{isPassed ? 'Retake Assessment' : '↺ Try Again (Retake Test)'}</span>
                </button>
                {isPassed ? (
                  <button
                    onClick={onClose}
                    className="btn btn-primary text-xs px-5 py-2.5 flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <span>Continue to Roadmap (Done)</span>
                    <ArrowRight size={13} />
                  </button>
                ) : (
                  <button
                    onClick={onClose}
                    className="btn btn-ghost text-xs px-4 py-2.5 text-slate-300 hover:text-white cursor-pointer"
                  >
                    <span>Close & Review Courses</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* ── Single Question Display ──────────────────────────── */
            <div className="space-y-4">
              {/* Question metadata badge */}
              <div className="flex items-center justify-between">
                <span
                  className="badge text-[9px] font-mono uppercase font-bold"
                  style={{
                    backgroundColor: currentQ.difficulty === 'EASY'
                      ? 'rgba(16, 185, 129, 0.15)'
                      : currentQ.difficulty === 'MEDIUM'
                      ? 'rgba(245, 158, 11, 0.15)'
                      : 'rgba(239, 68, 68, 0.15)',
                    color: currentQ.difficulty === 'EASY'
                      ? '#6ee7b7'
                      : currentQ.difficulty === 'MEDIUM'
                      ? '#fcd34d'
                      : '#fca5a5',
                    border: currentQ.difficulty === 'EASY'
                      ? '1px solid rgba(16, 185, 129, 0.3)'
                      : currentQ.difficulty === 'MEDIUM'
                      ? '1px solid rgba(245, 158, 11, 0.3)'
                      : '1px solid rgba(239, 68, 68, 0.3)',
                  }}
                >
                  Question {safeIndex + 1} of {totalQuestions} • {currentQ.difficulty || 'MEDIUM'}
                </span>

                <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                  {currentQ.type === 'code_snippet' ? <Code2 size={11} className="text-emerald-400" /> : <HelpCircle size={11} className="text-amber-400" />}
                  <span>{currentQ.type === 'code_snippet' ? 'Code Snippet Quiz' : 'Conceptual Knowledge'}</span>
                </span>
              </div>

              {/* Question text */}
              <h3 className="text-[16px] font-bold text-white font-display leading-snug">
                {currentQ.question}
              </h3>

              {/* Code Snippet Box (if present) */}
              {currentQ.codeSnippet && (
                <div
                  className="p-4 rounded-xl font-mono text-[12px] text-emerald-300 overflow-x-auto shadow-inner leading-relaxed"
                  style={{
                    backgroundColor: '#060912',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <pre className="whitespace-pre font-mono">{currentQ.codeSnippet}</pre>
                </div>
              )}

              {/* Options */}
              <div className="space-y-2.5 pt-2">
                {(currentQ.options || []).map((opt, optIdx) => {
                  const isSelected = selectedAnswers[currentQ.id] === optIdx;

                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleSelectOption(optIdx)}
                      className="w-full p-3.5 px-4 rounded-xl text-left text-[13px] transition-all cursor-pointer flex items-center justify-between gap-3 group"
                      style={{
                        backgroundColor: isSelected ? 'rgba(245, 158, 11, 0.14)' : '#131929',
                        border: isSelected ? '1.5px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.08)',
                        color: isSelected ? '#ffffff' : '#cbd5e1',
                        boxShadow: isSelected ? '0 0 16px rgba(245, 158, 11, 0.15)' : 'none',
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="w-6 h-6 rounded-lg text-[11px] font-mono font-bold flex items-center justify-center shrink-0 transition-colors"
                          style={{
                            backgroundColor: isSelected ? '#f59e0b' : '#0c101c',
                            color: isSelected ? '#0f172a' : '#94a3b8',
                            border: isSelected ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                          }}
                        >
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span className="leading-snug">{opt}</span>
                      </div>

                      <span className="text-[10px] font-mono text-slate-500 shrink-0 hidden sm:inline group-hover:text-slate-400">
                        [{optIdx + 1}]
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* ── Modal Footer ────────────────────────────────────────── */}
        {!isSubmitted && (
          <div
            className="p-4 px-6 flex items-center justify-between gap-3 shrink-0"
            style={{
              backgroundColor: '#121828',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <button
              onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
              disabled={safeIndex === 0}
              className="btn btn-ghost text-xs px-3 py-2 disabled:opacity-30 text-slate-300 hover:text-white"
            >
              <ArrowLeft size={13} />
              <span>Previous</span>
            </button>

            <div className="flex items-center gap-2">
              {safeIndex < totalQuestions - 1 ? (
                <button
                  onClick={() => setCurrentIndex(i => Math.min(totalQuestions - 1, i + 1))}
                  className="btn btn-secondary text-xs px-4 py-2"
                >
                  <span>Next</span>
                  <ArrowRight size={13} />
                </button>
              ) : (
                <button
                  onClick={handleSubmitQuiz}
                  disabled={submitting || answeredCount < totalQuestions}
                  className="btn btn-primary text-xs px-5 py-2.5 disabled:opacity-40 shadow-md"
                >
                  {submitting ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <>
                      <Sparkles size={13} />
                      <span>Submit Assessment</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>,
    document.body
  );
};
