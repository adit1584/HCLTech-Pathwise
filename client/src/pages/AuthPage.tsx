import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../stores/authContext';
import {
  Compass,
  ArrowRight,
  Lock,
  Mail,
  User,
  Loader2,
  Sparkles,
  Eye,
  EyeOff,
  CheckCircle2,
  Cpu,
  GitMerge,
  ShieldCheck,
} from 'lucide-react';

export const AuthPage: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register, demoLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await register(name, email, password);
        navigate('/onboarding');
      } else {
        await login(email, password);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setError('');
    setLoading(true);
    try {
      await demoLogin();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-60px)] flex items-center justify-center p-4 sm:p-6 page-enter">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden shadow-2xl">

        {/* ── Left Hero / Brand Showcase (5 cols on lg) ──────────────── */}
        <div className="lg:col-span-5 p-8 sm:p-10 bg-[linear-gradient(135deg,rgba(30,22,12,0.9)_0%,var(--bg-raised)_100%)] border-b lg:border-b-0 lg:border-r border-[var(--border-dim)] flex flex-col justify-between relative overflow-hidden">
          <div aria-hidden="true" className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-[rgba(245,158,11,0.12)] blur-[60px] pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-900 shadow-lg"
                style={{
                  background: 'var(--primary-500)',
                  boxShadow: '0 4px 14px -2px rgba(245,158,11,0.5)',
                }}
              >
                <Compass size={20} className="text-slate-950 stroke-[2.4]" />
              </div>
              <span className="text-[17px] font-extrabold tracking-tight text-[var(--text-primary)] font-display">
                Pathwise
              </span>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-[var(--text-primary)] font-display tracking-tight leading-snug">
                Your deterministic learning compiler.
              </h2>
              <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
                Prerequisite-aware DAG pathfinding tailored to your exact career milestones and study capacity.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {[
                { icon: Cpu, label: 'Deterministic topological sort' },
                { icon: GitMerge, label: 'Incremental DAG recompilation' },
                { icon: ShieldCheck, label: 'Cryptographic skill passport' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2.5 text-[12px] text-[var(--text-secondary)] font-mono">
                  <span className="w-5 h-5 rounded-md flex items-center justify-center bg-[rgba(16,185,129,0.12)] text-[var(--accent-400)] border border-[rgba(16,185,129,0.25)] shrink-0">
                    <CheckCircle2 size={12} />
                  </span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 pt-6 border-t border-[var(--border-dim)] text-[11px] font-mono text-[var(--text-muted)]">
            Deterministic Curriculum Compiler & Dynamic Skill Architecture
          </div>
        </div>

        {/* ── Right Auth Form (7 cols on lg) ─────────────────────────── */}
        <div className="lg:col-span-7 p-8 sm:p-10 space-y-6">

          {/* Tab Switcher */}
          <div className="flex rounded-xl bg-[var(--bg-void)] p-1 border border-[var(--border-dim)]">
            <button
              type="button"
              onClick={() => { setIsRegister(false); setError(''); }}
              className={`flex-1 py-2 rounded-lg text-[13px] font-bold font-display transition-all cursor-pointer ${
                !isRegister
                  ? 'bg-[var(--primary-500)] text-slate-950 shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsRegister(true); setError(''); }}
              className={`flex-1 py-2 rounded-lg text-[13px] font-bold font-display transition-all cursor-pointer ${
                isRegister
                  ? 'bg-[var(--primary-500)] text-slate-950 shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* 1-Click Demo Login */}
          <button
            id="auth-demo-btn"
            type="button"
            onClick={handleDemo}
            disabled={loading}
            className="w-full p-3 px-4 rounded-xl text-[12px] font-mono font-bold flex items-center justify-center gap-2 border border-[rgba(245,158,11,0.3)] bg-[rgba(245,158,11,0.08)] text-[var(--primary-300)] hover:bg-[rgba(245,158,11,0.15)] transition-all cursor-pointer shadow-sm disabled:opacity-50"
          >
            <Sparkles size={14} className="text-[var(--primary-400)] animate-pulse" />
            <span>1-Click Live Demo as "Alex" (Data Scientist)</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[var(--border-dim)]" />
            <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">or with email</span>
            <div className="flex-1 h-px bg-[var(--border-dim)]" />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] text-[#f87171] text-[12px] font-mono flex items-center gap-2">
              <span>⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div className="space-y-1.5">
                <label className="text-[12px] font-mono text-[var(--text-secondary)] font-medium">Full Name</label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Alex Mercer"
                    className="w-full bg-[var(--bg-void)] border border-[var(--border-subtle)] focus:border-[var(--primary-400)] rounded-xl py-2.5 pl-10 pr-4 text-[13px] text-[var(--text-primary)] outline-none transition-all"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[12px] font-mono text-[var(--text-secondary)] font-medium">Email Address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="alex@pathwise.dev"
                  className="w-full bg-[var(--bg-void)] border border-[var(--border-subtle)] focus:border-[var(--primary-400)] rounded-xl py-2.5 pl-10 pr-4 text-[13px] text-[var(--text-primary)] outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-mono text-[var(--text-secondary)] font-medium">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[var(--bg-void)] border border-[var(--border-subtle)] focus:border-[var(--primary-400)] rounded-xl py-2.5 pl-10 pr-10 text-[13px] text-[var(--text-primary)] outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary text-xs py-3 font-bold flex items-center justify-center gap-2 shadow-md disabled:opacity-50 mt-2"
            >
              {loading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <>
                  <span>{isRegister ? 'Create Account & Begin Onboarding' : 'Sign In to Dashboard'}</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};
