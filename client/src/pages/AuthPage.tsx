import React, { useState, useEffect } from 'react';
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
  KeyRound,
  RotateCcw,
  Check,
} from 'lucide-react';

export const AuthPage: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [step, setStep] = useState<'form' | 'otp'>('form');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const { login, sendOtp, verifyOtp, demoLogin } = useAuth();
  const navigate = useNavigate();

  // Countdown timer for OTP resend
  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setInterval(() => setResendTimer(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [resendTimer]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await sendOtp(name, email, password);
      setDevOtp(res.devOtp || null);
      setSuccessMsg(`Verification code sent to ${res.email}.`);
      setStep('otp');
      setResendTimer(45);
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.trim().length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await verifyOtp(email, otp.trim());
      navigate('/onboarding');
    } catch (err: any) {
      setError(err.message || 'Invalid or expired verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0 || loading) return;
    setError('');
    setLoading(true);

    try {
      const res = await sendOtp(name, email, password);
      setDevOtp(res.devOtp || null);
      setSuccessMsg(`New verification code sent to ${email}.`);
      setResendTimer(45);
    } catch (err: any) {
      setError(err.message || 'Failed to resend code.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
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
                  background: 'linear-gradient(135deg, #fef08a 0%, #f59e0b 50%, #d97706 100%)',
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
                Prerequisite-aware DAG pathfinding verified with secure email authentication and personalized career velocity.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {[
                { icon: ShieldCheck, label: 'Verified single-account security' },
                { icon: Cpu, label: 'Deterministic topological DAG sort' },
                { icon: GitMerge, label: 'Dynamic milestone recompilation' },
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
            Verified Email Authentication · Exactly 1 Account Per Email
          </div>
        </div>

        {/* ── Right Auth Form (7 cols on lg) ─────────────────────────── */}
        <div className="lg:col-span-7 p-8 sm:p-10 space-y-6">

          {/* Tab Switcher */}
          <div className="flex rounded-xl bg-[var(--bg-void)] p-1 border border-[var(--border-dim)]">
            <button
              type="button"
              onClick={() => {
                setIsRegister(false);
                setStep('form');
                setError('');
                setSuccessMsg('');
              }}
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
              onClick={() => {
                setIsRegister(true);
                setStep('form');
                setError('');
                setSuccessMsg('');
              }}
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
          {!isRegister && (
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
          )}

          {/* Feedback Messages */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[12px] font-mono flex items-center gap-2 animate-fade-in">
              <span>⚠</span>
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[12px] font-mono flex items-center gap-2 animate-fade-in">
              <Check size={14} className="text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ── STEP 2: OTP Verification Form ── */}
          {isRegister && step === 'otp' ? (
            <form onSubmit={handleVerifyOtp} className="space-y-4 animate-fade-up">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-2">
                <div className="flex items-center gap-2 text-amber-300 text-xs font-bold font-mono">
                  <KeyRound size={15} />
                  <span>Verify Your Email Address</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  We've sent a 6-digit verification code to <strong className="text-white">{email}</strong>. Please enter the code below to activate your account.
                </p>

                {devOtp && (
                  <div className="pt-2 flex items-center gap-2">
                    <span className="text-[10px] font-mono text-amber-400/80">Developer Code:</span>
                    <button
                      type="button"
                      onClick={() => setOtp(devOtp)}
                      className="px-2 py-0.5 rounded bg-black/50 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold hover:bg-amber-500/20 transition-all cursor-pointer"
                      title="Click to auto-fill code"
                    >
                      {devOtp} (Click to Fill)
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-mono text-[var(--text-secondary)] font-medium">
                  6-Digit Verification Code
                </label>
                <div className="relative">
                  <KeyRound size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="123456"
                    className="w-full bg-[var(--bg-void)] border border-[var(--border-subtle)] focus:border-amber-400 rounded-xl py-3 pl-10 pr-4 text-lg tracking-[0.3em] font-mono text-center font-bold text-amber-300 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  ← Edit details
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendTimer > 0 || loading}
                  className="text-amber-400 hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw size={12} />
                  <span>{resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend Code'}</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full btn btn-primary text-xs py-3 font-bold flex items-center justify-center gap-2 shadow-md disabled:opacity-50 mt-2 cursor-pointer"
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : (
                  <>
                    <span>Verify Code & Start Learning</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>
          ) : isRegister ? (
            /* ── STEP 1: Registration Form ── */
            <form onSubmit={handleSendOtp} className="space-y-4 animate-fade-up">
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

              <div className="space-y-1.5">
                <label className="text-[12px] font-mono text-[var(--text-secondary)] font-medium">Permanent Email Address</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="alex@gmail.com"
                    className="w-full bg-[var(--bg-void)] border border-[var(--border-subtle)] focus:border-[var(--primary-400)] rounded-xl py-2.5 pl-10 pr-4 text-[13px] text-[var(--text-primary)] outline-none transition-all"
                  />
                </div>
                <p className="text-[10px] font-mono text-slate-400 pl-1">
                  * Must be a valid personal or university/work email. Disposable domains are blocked.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-mono text-[var(--text-secondary)] font-medium">Password (min 6 characters)</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
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
                className="w-full btn btn-primary text-xs py-3 font-bold flex items-center justify-center gap-2 shadow-md disabled:opacity-50 mt-2 cursor-pointer"
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : (
                  <>
                    <span>Verify Email & Continue</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* ── Sign In Form ── */
            <form onSubmit={handleLogin} className="space-y-4 animate-fade-up">
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
                className="w-full btn btn-primary text-xs py-3 font-bold flex items-center justify-center gap-2 shadow-md disabled:opacity-50 mt-2 cursor-pointer"
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
