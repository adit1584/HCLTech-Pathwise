import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Trophy,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Flame,
  Star,
  Award,
  Zap,
  X,
} from 'lucide-react';
import { playVictoryChime, triggerConfetti } from '../utils/celebration';

interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  xpEarned?: number;
  score?: number;
  milestoneNumber?: number;
  nextStepTitle?: string;
}

export const CelebrationModal: React.FC<CelebrationModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  xpEarned = 100,
  score,
  milestoneNumber,
  nextStepTitle,
}) => {
  useEffect(() => {
    if (isOpen) {
      playVictoryChime();
      triggerConfetti(3500);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg p-8 sm:p-10 rounded-3xl bg-gradient-to-b from-[#0e1628] via-[#090d16] to-[#05070d] border-2 border-amber-500/50 shadow-[0_0_80px_rgba(245,158,11,0.35)] text-center space-y-6 animate-scale-up overflow-hidden">
        
        {/* Ambient Top Radiant Shimmer */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-gradient-to-b from-amber-500/25 via-cyan-500/15 to-transparent blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Floating Animated Golden Trophy & Particle Crown */}
        <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
          {/* Pulsing Backlight */}
          <div className="absolute inset-0 rounded-full bg-amber-400/20 blur-xl animate-pulse" />
          
          {/* Holographic Circle Container */}
          <div
            className="relative flex h-20 w-20 items-center justify-center rounded-3xl text-slate-950 shadow-2xl animate-bounce"
            style={{
              background: 'linear-gradient(135deg, #fef08a 0%, #f59e0b 50%, #d97706 100%)',
              boxShadow: '0 8px 30px rgba(245,158,11,0.6), inset 0 2px 2px rgba(255,255,255,0.7)',
            }}
          >
            <Trophy size={42} className="stroke-[2.2] text-slate-950" />
          </div>

          {/* Mini Orbiting Stars */}
          <div className="absolute -top-1 -right-1 text-amber-300 animate-spin" style={{ animationDuration: '6s' }}>
            <Sparkles size={20} />
          </div>
          <div className="absolute -bottom-1 -left-1 text-emerald-400">
            <Star size={16} className="fill-emerald-400" />
          </div>
        </div>

        {/* Header Congratulatory Typography */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold tracking-wider uppercase">
            <Sparkles size={12} className="text-amber-400" />
            <span>Mastery Unlocked!</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white font-display tracking-tight leading-snug">
            {title || 'Milestone Conquered!'}
          </h2>

          <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-sm mx-auto leading-relaxed">
            {subtitle || 'Your assessment has been officially verified. The roadmap has recompiled and unlocked your next milestone!'}
          </p>
        </div>

        {/* Rewards Metric Strip */}
        <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono text-[var(--text-muted)] font-bold uppercase">
              EXPERIENCE EARNED
            </span>
            <div className="text-lg sm:text-xl font-black text-emerald-400 font-mono flex items-center justify-center gap-1">
              <Zap size={16} className="fill-emerald-400" />
              <span>+{xpEarned} XP</span>
            </div>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] font-mono text-[var(--text-muted)] font-bold uppercase">
              VERIFICATION SCORE
            </span>
            <div className="text-lg sm:text-xl font-black text-amber-300 font-mono flex items-center justify-center gap-1">
              <CheckCircle2 size={16} />
              <span>{score !== undefined ? `${score}%` : 'PASSED (100%)'}</span>
            </div>
          </div>
        </div>

        {/* Next Unlocked Step Preview (if applicable) */}
        {nextStepTitle && (
          <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-left flex items-center justify-between gap-3">
            <div className="space-y-0.5 min-w-0">
              <span className="text-[9.5px] font-mono text-cyan-400 font-bold uppercase">
                🚀 NEXT UNLOCKED STEP
              </span>
              <p className="text-xs font-bold text-white truncate">
                {nextStepTitle}
              </p>
            </div>
            <ArrowRight size={16} className="text-cyan-400 shrink-0" />
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full btn btn-primary text-sm font-bold font-mono py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(245,158,11,0.5)] cursor-pointer active:scale-95 transition-transform"
          >
            <span>Continue Your Learning Journey</span>
            <ArrowRight size={15} />
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};
