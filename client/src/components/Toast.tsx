import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, X, Info } from 'lucide-react';

// ── Types ────────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'warning' | 'info';
interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}
interface ToastContextValue {
  toast: (opts: Omit<Toast, 'id'>) => void;
  success: (title: string, message?: string) => void;
  error:   (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info:    (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// ── Hook ─────────────────────────────────────────────────────
export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
};

// ── Icon map ─────────────────────────────────────────────────
const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 size={16} />,
  error:   <XCircle size={16} />,
  warning: <AlertTriangle size={16} />,
  info:    <Info size={16} />,
};
const COLORS: Record<ToastType, { bg: string; border: string; icon: string }> = {
  success: { bg: 'rgba(16,185,129,0.1)',  border: 'rgba(52,211,153,0.3)',  icon: 'var(--success-400)' },
  error:   { bg: 'rgba(239,68,68,0.1)',   border: 'rgba(248,113,113,0.3)', icon: 'var(--danger-400)'  },
  warning: { bg: 'rgba(245,158,11,0.1)',  border: 'rgba(251,191,36,0.3)',  icon: 'var(--warn-400)'    },
  info:    { bg: 'rgba(99,102,241,0.1)',  border: 'rgba(129,140,248,0.3)', icon: 'var(--primary-400)' },
};

// ── Single Toast Item ────────────────────────────────────────
const ToastItem: React.FC<{ toast: Toast; onDismiss: () => void }> = ({ toast, onDismiss }) => {
  const colors = COLORS[toast.type];
  return (
    <div
      className="animate-slide-right flex items-start gap-3 p-4 rounded-xl max-w-sm w-full"
      style={{
        background: 'rgba(14,20,37,0.96)',
        border: `1px solid ${colors.border}`,
        backdropFilter: 'blur(16px)',
        boxShadow: '0 8px 32px -8px rgba(0,0,0,0.6)',
      }}
      role="alert"
    >
      <span style={{ color: colors.icon }} className="shrink-0 mt-0.5">{ICONS[toast.type]}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-[var(--text-primary)] leading-snug">{toast.title}</p>
        {toast.message && (
          <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-snug">{toast.message}</p>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="shrink-0 p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
        aria-label="Dismiss"
      >
        <X size={12} />
      </button>
    </div>
  );
};

// ── Provider ─────────────────────────────────────────────────
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((opts: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { ...opts, id }]);
    setTimeout(() => dismiss(id), opts.duration ?? 4000);
  }, [dismiss]);

  const success = useCallback((title: string, message?: string) => toast({ type: 'success', title, message }), [toast]);
  const error   = useCallback((title: string, message?: string) => toast({ type: 'error',   title, message }), [toast]);
  const warning = useCallback((title: string, message?: string) => toast({ type: 'warning', title, message }), [toast]);
  const info    = useCallback((title: string, message?: string) => toast({ type: 'info',    title, message }), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      {children}
      {/* Toast stack */}
      <div
        className="fixed bottom-5 right-5 z-[200] flex flex-col gap-2.5 pointer-events-none"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onDismiss={() => dismiss(t.id)} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
