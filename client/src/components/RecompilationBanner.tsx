import React from 'react';
import type { RecompilationResult } from '../types';
import { Cpu, CheckCircle2, ArrowUpRight, X } from 'lucide-react';

interface RecompilationBannerProps {
  result: RecompilationResult | null;
  onDismiss?: () => void;
}

export const RecompilationBanner: React.FC<RecompilationBannerProps> = ({ result, onDismiss }) => {
  if (!result) return null;

  return (
    <div
      className="recompile-banner"
      role="status"
      aria-live="polite"
      aria-label="Path recompilation notification"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          {/* Icon */}
          <div
            className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center mt-0.5"
            style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.35)' }}
          >
            <Cpu size={16} className="text-[var(--primary-400)] animate-glow-pulse" />
          </div>

          <div className="space-y-1.5">
            {/* Title row */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--primary-400)]">
                Path Recompiled
              </span>
              <span className="badge badge-emerald text-[9px]">
                <CheckCircle2 size={9} /> Incremental
              </span>
            </div>

            <p className="text-[13px] font-semibold text-[var(--text-primary)]">{result.reason}</p>

            {/* Compiler stats */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-mono text-[var(--text-muted)]">
              <span>
                <strong className="text-[var(--primary-300)]">{result.dependenciesChecked}</strong> deps checked
              </span>
              <span>·</span>
              <span>
                <strong className="text-[var(--primary-300)]">{result.skillsRecomputed}</strong> skills recomputed
              </span>
              <span>·</span>
              <span>
                <strong className="text-[var(--primary-300)]">{result.milestonesUpdated}</strong> milestones updated
              </span>
            </div>

            {/* Changes list */}
            {result.changes && result.changes.length > 0 && (
              <div className="pt-2 border-t border-[rgba(99,102,241,0.15)] space-y-1">
                {result.changes.slice(0, 3).map((change: any, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-[11px] text-[var(--text-secondary)]">
                    <ArrowUpRight size={12} className="text-[var(--primary-400)] shrink-0 mt-0.5" />
                    <span>{change.description}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="shrink-0 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-overlay)] transition-all cursor-pointer"
            aria-label="Dismiss notification"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
};
