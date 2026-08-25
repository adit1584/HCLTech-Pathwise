import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../services/api';
import type { RecommendationTrace } from '../types';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Unlock,
  Info,
  ArrowRight,
  TrendingUp,
  HelpCircle,
  Cpu,
} from 'lucide-react';

interface RecommendationTraceModalProps {
  skillId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const RecommendationTraceModal: React.FC<RecommendationTraceModalProps> = ({
  skillId,
  isOpen,
  onClose,
}) => {
  const [traceData, setTraceData] = useState<{
    trace: RecommendationTrace;
    unlocks: Array<{ id: string; name: string }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // Lock body scroll when modal is open
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

  useEffect(() => {
    if (!isOpen || !skillId) return;
    setLoading(true);
    api
      .getRecommendationTrace(skillId)
      .then(res => setTraceData(res))
      .catch(err => console.error('Failed to load trace:', err))
      .finally(() => setLoading(false));
  }, [isOpen, skillId]);

  if (!isOpen) return null;

  const { trace, unlocks } = traceData || {};

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 animate-fade-in"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0,0,0,0.78)',
        backdropFilter: 'blur(12px)',
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Recommendation Trace"
    >
      <div
        className="flex flex-col w-full max-w-2xl max-h-[90vh] rounded-2xl overflow-hidden animate-fade-up m-auto"
        style={{
          background: 'var(--bg-base)',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 24px 64px -12px rgba(0,0,0,0.8)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-dim)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(245,158,11,0.12)', border: '1.5px solid rgba(245,158,11,0.3)' }}
            >
              <Cpu size={16} className="text-[var(--primary-400)]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[15px] font-bold text-[var(--text-primary)] font-display">
                  Recommendation Trace
                </h3>
                <span className="badge badge-amber text-[9px]">
                  AUDITABLE ENGINE
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">
                Deterministic scoring factors & mathematical proof
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-raised)] transition-all cursor-pointer"
            aria-label="Close trace modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading || !trace ? (
            <div className="py-16 text-center space-y-3 animate-fade-in">
              <div className="relative mx-auto w-10 h-10">
                <div className="absolute inset-0 rounded-full border-2 border-[var(--primary-500)] border-t-transparent animate-spin" />
              </div>
              <p className="text-[12px] text-[var(--text-muted)]">
                Evaluating recommendation scoring matrix…
              </p>
            </div>
          ) : (
            <>
              {/* Skill Highlight Banner */}
              <div
                className="p-4 rounded-xl flex items-center justify-between"
                style={{
                  background: 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, var(--bg-surface) 100%)',
                  border: '1px solid rgba(245,158,11,0.22)',
                }}
              >
                <div>
                  <span className="text-[10px] text-[var(--primary-400)] uppercase tracking-wider font-mono font-semibold">
                    Evaluated Skill Node
                  </span>
                  <h4 className="text-[18px] font-bold text-[var(--text-primary)] font-display mt-0.5">
                    {trace.skillName}
                  </h4>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-mono">
                    Priority Score
                  </span>
                  <div className="text-[24px] font-mono font-black text-[var(--primary-300)]">
                    {trace.priorityScore.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Mathematical Formula Breakdown */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5 font-mono">
                    <TrendingUp size={13} className="text-[var(--primary-400)]" />
                    Priority Formula Weights
                  </h5>
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">
                    (Gap × Role × Centrality × Unlock) ÷ Cost
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: 'Skill Gap', val: `${trace.gap.toFixed(2)}%`, pct: Math.min(100, trace.gap), color: 'var(--primary-500)' },
                    { label: 'Role Importance', val: `${(trace.roleImportance * 100).toFixed(2)}%`, pct: trace.roleImportance * 100, color: 'var(--accent-500)' },
                    { label: 'Centrality Score', val: trace.centrality.toFixed(2), pct: trace.centrality * 100, color: 'var(--cyan-500)' },
                    { label: 'Unlock Multiplier', val: trace.unlockValue.toFixed(2), pct: trace.unlockValue * 100, color: 'var(--primary-400)' },
                    { label: 'Goal Relevance', val: `${(trace.goalRelevance * 100).toFixed(2)}%`, pct: trace.goalRelevance * 100, color: 'var(--accent-400)' },
                    { label: 'Learning Cost', val: trace.estimatedCost.toFixed(2), pct: trace.estimatedCost * 100, color: 'var(--danger-400)' },
                  ].map(({ label, val, pct, color }) => (
                    <div
                      key={label}
                      className="p-3 rounded-xl border"
                      style={{ background: 'var(--bg-void)', borderColor: 'var(--border-dim)' }}
                    >
                      <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] mb-2">
                        <span>{label}</span>
                        <span className="font-mono text-[var(--text-primary)] font-bold">{val}</span>
                      </div>
                      <div className="progress-track h-[4px]">
                        <div
                          className="progress-fill"
                          style={{
                            transform: `scaleX(${Math.max(0.04, pct / 100)})`,
                            background: color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Unlocks Section */}
              {unlocks && unlocks.length > 0 && (
                <div
                  className="p-4 rounded-xl space-y-2"
                  style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.22)' }}
                >
                  <h5 className="text-[11px] font-bold text-[var(--accent-300)] uppercase tracking-wider flex items-center gap-1.5 font-mono">
                    <Unlock size={13} />
                    Downstream Graph Unlocks ({unlocks.length} nodes)
                  </h5>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {unlocks.map(item => (
                      <span
                        key={item.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium"
                        style={{
                          background: 'rgba(16,185,129,0.1)',
                          border: '1px solid rgba(16,185,129,0.25)',
                          color: 'var(--accent-300)',
                        }}
                      >
                        <ArrowRight size={10} />
                        {item.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Prerequisite Reasoning */}
              {trace.prerequisiteReason && trace.prerequisiteReason.length > 0 && (
                <div
                  className="p-4 rounded-xl space-y-2"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
                >
                  <h5 className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider font-mono">
                    Prerequisite Dependency Status
                  </h5>
                  <ul className="space-y-1.5 text-[12px] text-[var(--text-secondary)]">
                    {trace.prerequisiteReason.map((reason, i) => (
                      <li key={i} className="flex items-center gap-2">
                        {reason.includes('Mastered') ? (
                          <CheckCircle2 size={14} className="text-[var(--accent-400)] shrink-0" />
                        ) : (
                          <AlertCircle size={14} className="text-[var(--warn-400)] shrink-0" />
                        )}
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* "Why Not Alternatives?" Section */}
              {trace.excludedAlternatives && trace.excludedAlternatives.length > 0 && (
                <div className="space-y-2.5">
                  <h5 className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5 font-mono">
                    <HelpCircle size={13} className="text-[var(--text-muted)]" />
                    Why Not Other Topics First? (Deferred Nodes)
                  </h5>
                  <div className="space-y-2">
                    {trace.excludedAlternatives.map((alt, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl flex items-start justify-between gap-3 text-[12px]"
                        style={{ background: 'var(--bg-void)', border: '1px solid var(--border-dim)' }}
                      >
                        <div>
                          <span className="font-semibold text-[var(--text-primary)]">{alt.skillName}</span>
                          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{alt.reason}</p>
                        </div>
                        <span className="badge badge-slate text-[9px] shrink-0">
                          DEFERRED
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-6 py-3.5 flex justify-end"
          style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border-dim)' }}
        >
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm"
          >
            Close Trace
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
