import React, { useState, useEffect } from 'react';
import {
  X,
  Zap,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Trophy,
  Flame,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { MICRO_SPARK_CHALLENGES, type MicroSparkChallenge } from '../data/retentionData';
import { useToast } from './Toast';
import { api } from '../services/api';

interface MicroSparkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (skillId: string) => void;
}

export const MicroSparkModal: React.FC<MicroSparkModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { success: toastSuccess, error: toastError } = useToast();
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(90);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const challenge: MicroSparkChallenge = MICRO_SPARK_CHALLENGES[challengeIndex % MICRO_SPARK_CHALLENGES.length];

  // 90s countdown timer
  useEffect(() => {
    if (!isOpen || isAnswered) return;
    setSecondsRemaining(90);
    const interval = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsAnswered(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, challengeIndex, isAnswered]);

  if (!isOpen) return null;

  const isCorrect = selectedOption === challenge.correctAnswer;
  const timerPercent = Math.round((secondsRemaining / 90) * 100);

  const handleSelectOption = async (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);

    if (index === challenge.correctAnswer) {
      try {
        await api.recordProgressEvent({
          type: 'RESOURCE_COMPLETED',
          skillIds: [challenge.skillId],
          resourceId: `micro-spark-${challenge.id}`,
          score: 100,
          metadata: { type: 'micro_spark', skillName: challenge.skillName },
        });
        toastSuccess(`⚡ Skill Memory Restored! ${challenge.skillName} retention is back at 100%!`);
        onSuccess(challenge.skillId);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleNextChallenge = () => {
    setSelectedOption(null);
    setIsAnswered(false);
    setChallengeIndex(prev => prev + 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-scale-up">

        {/* Header with 90s Timer */}
        <div className="p-5 px-6 border-b border-[var(--border-dim)] bg-[var(--bg-raised)]/60 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="badge badge-amber text-[9px] font-mono flex items-center gap-1 font-bold">
                <Zap size={10} /> 90-SECOND DAILY MICRO-SPARK
              </span>
              <span className="text-[10px] font-mono text-[var(--accent-300)]">
                +150 XP Retention Boost
              </span>
            </div>
            <h3 className="text-base font-bold text-[var(--text-primary)] font-display">
              {challenge.skillName} Retention Recall
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-raised)] transition-all cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Timer Bar */}
        <div className="w-full h-1.5 bg-[var(--bg-void)] overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ${
              secondsRemaining > 30 ? 'bg-[var(--primary-500)]' : 'bg-red-500 animate-pulse'
            }`}
            style={{ width: `${timerPercent}%` }}
          />
        </div>

        {/* Question Body */}
        <div className="p-6 space-y-5 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
            <span>Challenge #{challengeIndex + 1}</span>
            <span className={`font-bold flex items-center gap-1 ${secondsRemaining <= 15 ? 'text-red-400' : 'text-[var(--primary-300)]'}`}>
              <Clock size={12} /> {secondsRemaining}s remaining
            </span>
          </div>

          <h4 className="text-[15px] font-bold text-[var(--text-primary)] font-display leading-snug">
            {challenge.question}
          </h4>

          {challenge.codeSnippet && (
            <div className="p-4 rounded-xl bg-[var(--bg-void)] border border-[var(--border-subtle)] font-mono text-[12px] text-emerald-400 overflow-x-auto shadow-inner leading-relaxed">
              <pre>{challenge.codeSnippet}</pre>
            </div>
          )}

          {/* Options */}
          <div className="space-y-2.5">
            {challenge.options.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrectOption = idx === challenge.correctAnswer;

              let btnClass = 'border-[var(--border-subtle)] bg-[var(--bg-void)]/60 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-muted)]';
              if (isAnswered) {
                if (isCorrectOption) {
                  btnClass = 'border-[rgba(16,185,129,0.5)] bg-[rgba(16,185,129,0.15)] text-[var(--accent-300)] font-bold';
                } else if (isSelected && !isCorrectOption) {
                  btnClass = 'border-[rgba(239,68,68,0.5)] bg-[rgba(239,68,68,0.15)] text-[#f87171]';
                } else {
                  btnClass = 'opacity-40 border-[var(--border-dim)]';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  disabled={isAnswered}
                  className={`w-full p-3.5 px-4 rounded-xl border text-left text-[13px] transition-all cursor-pointer flex items-center justify-between gap-3 ${btnClass}`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-lg text-[11px] font-mono font-bold flex items-center justify-center shrink-0 ${
                        isAnswered && isCorrectOption
                          ? 'bg-[var(--accent-500)] text-slate-950'
                          : isAnswered && isSelected
                          ? 'bg-red-500 text-white'
                          : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-dim)]'
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="leading-snug">{opt}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Answer Explanation */}
          {isAnswered && (
            <div className={`p-4 rounded-2xl border space-y-2 animate-fade-in ${
              isCorrect
                ? 'bg-[rgba(16,185,129,0.08)] border-[rgba(16,185,129,0.3)]'
                : 'bg-[rgba(239,68,68,0.08)] border-[rgba(239,68,68,0.3)]'
            }`}>
              <div className="flex items-center gap-2">
                {isCorrect ? (
                  <CheckCircle2 size={16} className="text-[var(--accent-400)] shrink-0" />
                ) : (
                  <AlertCircle size={16} className="text-red-400 shrink-0" />
                )}
                <span className="text-[13px] font-bold font-display text-[var(--text-primary)]">
                  {isCorrect ? 'Correct! +150 XP Earned' : 'Incorrect — Review Concept'}
                </span>
              </div>
              <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">
                {challenge.explanation}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {isAnswered && (
          <div className="p-4 px-6 border-t border-[var(--border-dim)] bg-[var(--bg-raised)]/40 flex items-center justify-between">
            <button
              onClick={handleNextChallenge}
              className="btn btn-secondary text-xs px-4 py-2 flex items-center gap-1.5"
            >
              <RotateCcw size={13} />
              <span>Next Micro-Spark</span>
            </button>
            <button
              onClick={onClose}
              className="btn btn-primary text-xs px-5 py-2 flex items-center gap-1.5"
            >
              <span>Done & Close</span>
              <ArrowRight size={13} />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
