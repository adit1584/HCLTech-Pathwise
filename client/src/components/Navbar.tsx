import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../stores/authContext';
import {
  LayoutDashboard,
  Map,
  Network,
  LogOut,
  Sparkles,
  Zap,
  Menu,
  X,
  Compass,
  BookOpen,
  Code2,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import { AssistantModal } from './AssistantModal';

const NAV_LINKS = [
  { to: '/dashboard',   label: 'Dashboard',   icon: LayoutDashboard },
  { to: '/roadmap',     label: 'Roadmap',      icon: Map },
  { to: '/skill-graph', label: 'Skill Graph',  icon: Network },
  { to: '/courses',     label: 'Courses',      icon: BookOpen },
  { to: '/practice',    label: 'Practice',     icon: Code2 },
  { to: '/what-if',     label: 'What-If',      icon: Zap },
  { to: '/passport',    label: 'Passport',     icon: ShieldCheck },
];

export const Navbar: React.FC = () => {
  const { user, logout, demoLogin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsAssistantOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'py-2.5 bg-[#06080e]/90 backdrop-blur-2xl border-b border-white/[0.08] shadow-[0_12px_40px_-12px_rgba(0,0,0,0.75)]'
            : 'py-3.5 bg-[#07090e]/60 backdrop-blur-md border-b border-white/[0.04]'
        }`}
      >
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex h-11 items-center justify-between gap-4">

            {/* ── Brand & Telemetry Badge (Flush Left) ─────────── */}
            <Link
              to={user ? '/dashboard' : '/'}
              className="flex items-center gap-2.5 group shrink-0"
              aria-label="Pathwise Home"
            >
              {/* Gold Compass Token with Smooth Hover Rotation */}
              <div
                className="relative flex h-8.5 w-8.5 items-center justify-center rounded-xl text-slate-950 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #fbbf24, #d97706)',
                  boxShadow: '0 3px 14px -2px rgba(245,158,11,0.45), inset 0 1px 1px rgba(255,255,255,0.4)',
                }}
              >
                <Compass size={18} className="stroke-[2.5]" />
              </div>

              <div className="flex flex-col">
                <span className="text-[17px] font-extrabold tracking-tight text-white font-display leading-none">
                  Pathwise
                </span>
                <span className="text-[9.5px] font-mono text-slate-400 tracking-wider">
                  LEARNING NAVIGATOR
                </span>
              </div>
            </Link>

            {/* ── Center Desktop Nav Pills ────────────────────── */}
            {user && (
              <nav
                className="hidden lg:flex items-center gap-1 p-1 rounded-full bg-white/[0.03] border border-white/[0.07] backdrop-blur-xl shadow-inner"
                aria-label="Main Navigation"
              >
                {NAV_LINKS.map(({ to, label, icon: Icon }) => {
                  const active = isActive(to);
                  return (
                    <Link
                      key={to}
                      to={to}
                      className={`relative px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5 select-none whitespace-nowrap ${
                        active
                          ? 'text-amber-300 font-semibold bg-amber-500/15 border border-amber-500/30 shadow-[0_0_16px_rgba(245,158,11,0.2)]'
                          : 'text-slate-300 hover:text-white hover:bg-white/[0.05]'
                      }`}
                    >
                      <Icon size={13} strokeWidth={active ? 2.3 : 1.8} className={`${active ? 'text-amber-400' : 'text-slate-400'} shrink-0`} />
                      <span className="whitespace-nowrap">{label}</span>
                      {active && (
                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-0.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
                      )}
                    </Link>
                  );
                })}
              </nav>
            )}

            {/* ── Right Actions ──────────────────────────────── */}
            <div className="flex items-center gap-2.5">
              {user ? (
                <>
                  {/* AI Assistant Button — Compact Single-Line Pill */}
                  <button
                    id="nav-ai-assistant"
                    onClick={() => setIsAssistantOpen(true)}
                    className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium border border-amber-500/25 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 hover:border-amber-500/40 transition-all duration-150 cursor-pointer"
                    aria-label="Ask AI Assistant"
                    title="Ask AI (⌘K)"
                  >
                    <Sparkles size={11} className="text-amber-400" />
                    <span>Ask AI</span>
                  </button>

                  {/* Diagnostic Quick Action — Compact Single-Line Pill */}
                  <button
                    id="nav-diagnostic"
                    onClick={() => navigate('/diagnostic')}
                    className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium border border-emerald-500/25 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-500/40 transition-all duration-150 cursor-pointer"
                    aria-label="Run Diagnostic Assessment"
                  >
                    <Zap size={11} className="text-emerald-400" />
                    <span>Diagnostic</span>
                  </button>

                  {/* User Profile Pill */}
                  <div className="flex items-center gap-2 pl-2 border-l border-white/[0.08]">
                    <div
                      className="h-8 w-8 rounded-xl flex items-center justify-center text-xs font-bold font-mono text-slate-950 shrink-0 shadow-md"
                      style={{
                        background: 'linear-gradient(135deg, #38bdf8, #0ea5e9)',
                        boxShadow: '0 2px 10px rgba(14,165,233,0.3)',
                      }}
                      title={`Logged in as ${user.name}`}
                    >
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>

                    <button
                      id="nav-logout"
                      onClick={logout}
                      title="Log Out"
                      className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-200 cursor-pointer"
                      aria-label="Log Out"
                    >
                      <LogOut size={15} />
                    </button>
                  </div>

                  {/* Mobile Hamburger */}
                  <button
                    id="nav-mobile-menu"
                    className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.06] border border-white/[0.06] transition-all cursor-pointer"
                    onClick={() => setMobileOpen(v => !v)}
                    aria-label={mobileOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
                    aria-expanded={mobileOpen}
                  >
                    {mobileOpen ? <X size={18} /> : <Menu size={18} />}
                  </button>
                </>
              ) : (
                /* Logged-out State */
                <div className="flex items-center gap-3">
                  <button
                    id="nav-demo-login"
                    onClick={async () => { await demoLogin(); navigate('/dashboard'); }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-medium rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 transition-all cursor-pointer"
                  >
                    <Sparkles size={12} />
                    <span>Alex Demo</span>
                  </button>
                  <Link
                    to="/auth"
                    id="nav-sign-in"
                    className="btn btn-primary btn-sm px-4 py-1.5 text-xs rounded-xl shadow-md"
                  >
                    Sign In
                  </Link>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* ── Mobile Navigation Drawer ────────────────────────── */}
        {mobileOpen && user && (
          <div className="lg:hidden mt-3 border-t border-white/[0.08] bg-[#07090e]/95 backdrop-blur-2xl animate-fade-in">
            <nav className="px-4 py-4 space-y-1.5" aria-label="Mobile Navigation">
              {NAV_LINKS.map(({ to, label, icon: Icon }) => {
                const active = isActive(to);
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                      active
                        ? 'bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/30'
                        : 'text-slate-300 hover:bg-white/[0.04] hover:text-white'
                    }`}
                  >
                    <Icon size={16} strokeWidth={active ? 2.2 : 1.8} className={`${active ? 'text-amber-400' : 'text-slate-400'} shrink-0`} />
                    <span className="whitespace-nowrap">{label}</span>
                  </Link>
                );
              })}

              <div className="pt-3 mt-2 border-t border-white/[0.06] grid grid-cols-2 gap-2">
                <button
                  onClick={() => { setMobileOpen(false); navigate('/diagnostic'); }}
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs text-emerald-300 font-medium bg-emerald-500/10 border border-emerald-500/25"
                >
                  <Zap size={14} className="text-emerald-400" />
                  <span>Diagnostic</span>
                </button>
                <button
                  onClick={() => { setMobileOpen(false); setIsAssistantOpen(true); }}
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs text-amber-300 font-medium bg-amber-500/10 border border-amber-500/25"
                >
                  <Sparkles size={14} className="text-amber-400" />
                  <span>Ask AI</span>
                </button>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* AI Assistant Modal */}
      {isAssistantOpen && (
        <AssistantModal isOpen={isAssistantOpen} onClose={() => setIsAssistantOpen(false)} />
      )}
    </>
  );
};
