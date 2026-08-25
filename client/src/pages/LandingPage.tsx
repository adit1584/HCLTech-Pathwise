import React, { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../stores/authContext';
import {
  ArrowRight,
  GitMerge,
  Cpu,
  BarChart3,
  Zap,
  ShieldCheck,
  TrendingUp,
  CheckCircle,
  ChevronRight,
  Compass,
  Flame,
} from 'lucide-react';

const FEATURES = [
  {
    icon: Cpu,
    title: 'DAG-Optimized Learning Paths',
    desc: 'Prerequisite-aware topological sorting with unlock-value scoring builds your shortest path to role readiness.',
    accent: 'amber',
  },
  {
    icon: BarChart3,
    title: 'Auditable Recommendation Traces',
    desc: 'Every suggestion exposes its exact formula: gap size, role importance, centrality score, and unlock multiplier.',
    accent: 'cyan',
  },
  {
    icon: GitMerge,
    title: 'Incremental Recompilation',
    desc: 'Pass a skill assessment and your entire path recompiles in milliseconds — only affected graph nodes update.',
    accent: 'emerald',
  },
  {
    icon: TrendingUp,
    title: 'Mastery-Calibrated Progress',
    desc: 'Confidence scoring turns raw milestone quiz and project results into calibrated proficiency estimates.',
    accent: 'amber',
  },
  {
    icon: Flame,
    title: 'Ebbinghaus Memory Retention Radar',
    desc: 'Daily 90-second rapid Micro-Sparks counteract skill half-life decay and maintain peak recall.',
    accent: 'cyan',
  },
  {
    icon: ShieldCheck,
    title: 'Cryptographic Proof-of-Skill Passport',
    desc: 'Shareable tamper-proof credentials with 1-click LinkedIn/X posting and embeddable GitHub badges.',
    accent: 'emerald',
  },
];

const STATS = [
  { value: '28+', label: 'Skill Nodes Tracked' },
  { value: 'Any', label: 'Target Career Role' },
  { value: '15',  label: 'Engine Tests Passing' },
  { value: '100%', label: 'Auditable Decisions' },
];

const ACCENT_MAP: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  amber:   { bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.28)', text: 'var(--primary-400)', glow: 'glow-amber' },
  emerald: { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.28)', text: 'var(--accent-400)',  glow: 'glow-emerald' },
  cyan:    { bg: 'rgba(14,165,233,0.1)',  border: 'rgba(14,165,233,0.25)', text: 'var(--cyan-400)',    glow: 'glow-cyan' },
};

function addRipple(e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) {
  const btn = e.currentTarget;
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 2;
  const x = e.clientX - rect.left - size / 2;
  const y = e.clientY - rect.top  - size / 2;
  const ripple = document.createElement('span');
  ripple.className = 'ripple-wave';
  ripple.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px;`;
  btn.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove());
}

export const LandingPage: React.FC = () => {
  const { demoLogin } = useAuth();
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);

  const handleDemoClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    addRipple(e);
    await demoLogin();
    navigate('/dashboard');
  };

  // Parallax tilt on hero blobs
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const handle = (e: MouseEvent) => {
      const { left, top, width, height } = hero.getBoundingClientRect();
      const x = (e.clientX - left - width / 2) / width;
      const y = (e.clientY - top - height / 2) / height;
      hero.style.setProperty('--mx', `${x * 25}px`);
      hero.style.setProperty('--my', `${y * 15}px`);
    };
    window.addEventListener('mousemove', handle, { passive: true });
    return () => window.removeEventListener('mousemove', handle);
  }, []);

  return (
    <div className="relative overflow-x-hidden page-enter">

      {/* ───────────────────────── Hero ───────────────────────── */}
      <section
        ref={heroRef}
        className="relative pt-12 sm:pt-16 pb-20 sm:pb-24 flex flex-col items-center px-4 sm:px-6 text-center overflow-hidden"
        style={{ '--mx': '0px', '--my': '0px' } as React.CSSProperties}
      >
        {/* Ambient mesh blobs: Properly positioned in background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div
            className="absolute -top-24 -left-24 w-[500px] h-[400px] rounded-full bg-[rgba(245,158,11,0.12)] blur-[100px]"
          />
          <div
            className="absolute top-1/4 -right-24 w-[450px] h-[380px] rounded-full bg-[rgba(16,185,129,0.08)] blur-[90px]"
          />
          <div
            className="absolute -bottom-20 left-1/3 w-[400px] h-[320px] rounded-full bg-[rgba(14,165,233,0.06)] blur-[80px]"
          />
          {/* Technical grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage: `linear-gradient(var(--border-muted) 1px, transparent 1px),
                                linear-gradient(90deg, var(--border-muted) 1px, transparent 1px)`,
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto space-y-8">
          {/* Feature badge */}
          <div className="animate-fade-up flex justify-center">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-mono font-semibold border border-[rgba(245,158,11,0.3)] bg-[rgba(245,158,11,0.08)] text-[var(--primary-300)]">
              <Compass size={12} className="text-[var(--primary-400)] animate-spin-slow" />
              Autonomous Learning Compiler & Career Navigator
            </span>
          </div>

          {/* Headline */}
          <h1 className="animate-fade-up delay-100 text-[clamp(2.25rem,6vw,4.5rem)] font-black tracking-[-0.04em] leading-[1.05] text-[var(--text-primary)] font-display">
            Build the exact path{' '}
            <span className="block text-[var(--primary-400)]">
              to who you're becoming.
            </span>
          </h1>

          {/* Supporting copy */}
          <p className="animate-fade-up delay-200 text-[clamp(1rem,2vw,1.1875rem)] text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed font-sans">
            Pathwise compiles your career goal, skill gaps, and study capacity into a{' '}
            <strong className="text-[var(--text-primary)] font-semibold">
              prerequisite-optimized DAG roadmap
            </strong>
            {' '}— and incrementally recompiles it the instant you level up.
          </p>

          {/* CTA row */}
          <div className="animate-fade-up delay-300 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/auth"
              id="hero-cta-start"
              className="ripple-container btn btn-primary"
              style={{ padding: '0.75rem 2rem', fontSize: '0.9375rem' }}
            >
              Start Building My Path
              <ArrowRight size={16} />
            </Link>
            <button
              id="hero-cta-demo"
              onClick={handleDemoClick}
              className="ripple-container btn btn-ghost"
              style={{ padding: '0.75rem 2rem', fontSize: '0.9375rem' }}
            >
              Live Demo as Alex
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Trust signals */}
          <div className="animate-fade-up delay-400 flex flex-wrap justify-center gap-x-8 gap-y-3 pt-4">
            {[
              'Deterministic DAG Engine',
              'Auditable Math Traces',
              'Incremental Recompilation',
            ].map(s => (
              <span key={s} className="flex items-center gap-2 text-[12px] text-[var(--text-muted)] font-mono font-medium">
                <CheckCircle size={13} className="text-[var(--accent-400)]" />
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-float opacity-40 pointer-events-none" aria-hidden="true">
          <div className="w-5 h-8 rounded-full border border-[var(--border-muted)] flex items-start justify-center pt-1.5">
            <div className="w-1 h-2 rounded-full bg-[var(--text-muted)]" style={{ animation: 'fadeUp 1.5s ease-in-out infinite' }} />
          </div>
        </div>
      </section>

      {/* ─────────────────────── Stats Strip ──────────────────── */}
      <section className="border-y border-[var(--border-dim)] bg-[var(--bg-surface)]/50">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-8 py-10">
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[var(--border-dim)]">
            {STATS.map(({ value, label }, i) => (
              <div key={label} className="bg-[var(--bg-base)] px-8 py-6 flex flex-col gap-1">
                <dt
                  className="stat-number text-[var(--primary-300)] animate-fade-up"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  {value}
                </dt>
                <dd className="text-[12px] text-[var(--text-muted)] font-mono font-medium">{label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ─────────────────────── Features ─────────────────────── */}
      <section className="page-shell py-24">
        <div className="text-center mb-16 space-y-3">
          <p className="section-eyebrow">Why Pathwise</p>
          <h2 className="section-title max-w-2xl mx-auto">
            Not another course aggregator. A learning compiler.
          </h2>
          <p className="text-[var(--text-secondary)] text-sm max-w-xl mx-auto leading-relaxed">
            Strict separation between AI-driven natural language interpretation and deterministic topological graph optimization.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({ icon: Icon, title, desc, accent }, i) => {
            const colors = ACCENT_MAP[accent];
            return (
              <article
                key={title}
                className="card-interactive p-6 space-y-4 animate-fade-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
                >
                  <Icon size={18} style={{ color: colors.text }} strokeWidth={1.8} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-[15px] font-bold text-[var(--text-primary)] font-display">
                    {title}
                  </h3>
                  <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
                    {desc}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* ─────────────────────── CTA Banner ───────────────────── */}
      <section className="page-shell pt-0 pb-24">
        <div
          className="rounded-2xl p-10 sm:p-16 text-center relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(30,22,12,0.9) 0%, rgba(17,21,31,0.95) 60%, rgba(6,78,59,0.4) 100%)',
            border: '1px solid rgba(245,158,11,0.25)',
          }}
        >
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
            <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-[rgba(245,158,11,0.12)] blur-[60px]" />
            <div className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full bg-[rgba(16,185,129,0.08)] blur-[60px]" />
          </div>

          <div className="relative z-10 space-y-6 max-w-xl mx-auto">
            <h2 className="text-[clamp(1.5rem,3vw,2.25rem)] font-black tracking-[-0.03em] text-[var(--text-primary)] font-display">
              Ready to compile your learning path?
            </h2>
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
              Experience the hackathon demo. Your prerequisite-optimized roadmap is one click away.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                to="/auth"
                id="cta-banner-start"
                className="ripple-container btn btn-primary"
                style={{ padding: '0.75rem 2rem', fontSize: '0.9375rem' }}
              >
                Create Account <ArrowRight size={16} />
              </Link>
              <button
                id="cta-banner-demo"
                onClick={handleDemoClick}
                className="ripple-container btn btn-ghost"
                style={{ padding: '0.75rem 2rem', fontSize: '0.9375rem' }}
              >
                1-Click Demo
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
