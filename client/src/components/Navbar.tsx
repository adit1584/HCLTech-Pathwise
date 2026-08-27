import React, { useState, useEffect, useRef } from 'react';
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
  Share2,
  ChevronDown,
  User,
} from 'lucide-react';
import { AssistantModal } from './AssistantModal';

// Centered Main Nav Links (Diagnostic moved exclusively to Profile dropdown)
const NAV_LINKS = [
  { to: '/dashboard',   label: 'Dashboard',        icon: LayoutDashboard, glow: '#f59e0b' },
  { to: '/roadmap',     label: 'Roadmap',          icon: Map,             glow: '#0ea5e9' },
  { to: '/simulator',   label: 'Career Simulator', icon: Sparkles,        glow: '#fbbf24' },
  { to: '/courses',     label: 'Courses',          icon: BookOpen,        glow: '#10b981' },
  { to: '/practice',    label: 'Practice',         icon: Code2,           glow: '#f43f5e' },
  { to: '/skill-graph', label: 'Skill Graph',      icon: Network,         glow: '#a855f7' },
];

export const Navbar: React.FC = () => {
  const { user, logout, demoLogin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [clickedItem, setClickedItem] = useState<string | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Scroll listener for dynamic backdrop blur and shrink
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut (⌘K / Ctrl+K) to open AI Assistant
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

  useEffect(() => {
    setMobileOpen(false);
    setIsProfileMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) =>
    location.pathname === path ||
    (path === '/simulator' && (location.pathname === '/what-if' || location.pathname === '/career-simulator'));

  const handleNavClick = (to: string) => {
    setClickedItem(to);
    setTimeout(() => setClickedItem(null), 300);
  };

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'py-2 bg-[#04060d]/92 backdrop-blur-2xl border-b border-white/[0.08] shadow-[0_16px_40px_-16px_rgba(0,0,0,0.85)]'
            : 'py-3.5 bg-[#050811]/75 backdrop-blur-xl border-b border-white/[0.06]'
        }`}
      >
        <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Centric 3-Column Grid / Flex Layout */}
          <div className="flex items-center justify-between gap-4">

            {/* ── Left Column: Brand & Logo ── */}
            <div className="flex-1 flex justify-start items-center min-w-0">
              <Link
                to={user ? '/dashboard' : '/'}
                className="flex items-center gap-3 group shrink-0 active:scale-95 transition-transform duration-150"
                aria-label="Pathwise Home"
              >
                {/* Golden Holographic Compass Token */}
                <div
                  className="relative flex h-9 w-9 items-center justify-center rounded-2xl text-slate-950 transition-all duration-300 group-hover:rotate-12 group-hover:scale-110 group-active:scale-90 shadow-md"
                  style={{
                    background: 'linear-gradient(135deg, #fef08a 0%, #f59e0b 50%, #d97706 100%)',
                    boxShadow: '0 4px 18px -2px rgba(245,158,11,0.5), inset 0 1px 1px rgba(255,255,255,0.7)',
                  }}
                >
                  <Compass size={19} className="stroke-[2.5] text-slate-950 group-hover:animate-pulse" />
                  <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-300"></span>
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-[17px] font-black tracking-tight bg-gradient-to-r from-white via-amber-100 to-amber-300 bg-clip-text text-transparent font-display leading-none group-hover:to-amber-400 transition-all">
                    Pathwise
                  </span>
                  <span className="text-[9px] font-mono font-bold text-amber-400/80 tracking-wider flex items-center gap-1 mt-0.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    ADAPTIVE NAVIGATOR
                  </span>
                </div>
              </Link>
            </div>

            {/* ── Center Column: Centered Desktop Nav Pill Capsule ── */}
            {user && (
              <div className="hidden lg:flex flex-shrink-0 justify-center items-center">
                <nav
                  className="flex items-center gap-1 p-1 rounded-full bg-gradient-to-r from-white/[0.04] via-white/[0.07] to-white/[0.04] border border-white/[0.1] backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.12),0_8px_32px_rgba(0,0,0,0.4)]"
                  aria-label="Main Navigation"
                >
                  {NAV_LINKS.map(({ to, label, icon: Icon, glow }) => {
                    const active = isActive(to);
                    const isClicked = clickedItem === to;

                    return (
                      <Link
                        key={to}
                        to={to}
                        onClick={() => handleNavClick(to)}
                        className={`relative px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5 select-none whitespace-nowrap group ${
                          isClicked ? 'scale-90' : 'active:scale-95'
                        } ${
                          active
                            ? 'text-amber-200 font-bold bg-gradient-to-r from-amber-500/20 via-amber-500/15 to-transparent border border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                            : 'text-slate-300 hover:text-white hover:bg-white/[0.06] border border-transparent hover:border-white/[0.08]'
                        }`}
                      >
                        <Icon
                          size={13}
                          strokeWidth={active ? 2.4 : 1.9}
                          className={`transition-all duration-200 group-hover:-translate-y-0.5 group-hover:scale-110 ${
                            active ? 'text-amber-400 scale-110 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]' : 'text-slate-400 group-hover:text-amber-300'
                          }`}
                        />
                        <span className="whitespace-nowrap font-medium tracking-tight">{label}</span>

                        {/* Active Indicator Underline */}
                        {active && (
                          <span
                            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full shadow-[0_0_10px_#f59e0b] animate-pulse"
                            style={{ backgroundColor: glow }}
                          />
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            )}

            {/* ── Right Column: Action Controls (Ask AI + Profile Dropdown) ── */}
            <div className="flex-1 flex justify-end items-center gap-2 sm:gap-3">
              {user ? (
                <>
                  {/* Glowing, Ultra-Slick Ask AI Button */}
                  <button
                    id="nav-ai-assistant"
                    onClick={() => setIsAssistantOpen(true)}
                    className="relative inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold font-mono text-white bg-gradient-to-r from-purple-600/30 via-indigo-600/25 to-cyan-500/20 border border-purple-500/40 hover:border-purple-400/80 hover:shadow-[0_0_24px_rgba(168,85,247,0.45)] active:scale-95 transition-all duration-200 cursor-pointer group overflow-hidden"
                    aria-label="Ask AI Assistant"
                    title="Ask Pathwise AI (⌘K)"
                  >
                    {/* Ambient Light Sweep */}
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                    
                    <Sparkles size={13} className="text-purple-300 group-hover:text-amber-300 group-hover:rotate-12 transition-all duration-300" />
                    <span className="bg-gradient-to-r from-purple-200 via-indigo-100 to-cyan-200 bg-clip-text text-transparent font-bold">
                      Ask AI
                    </span>
                    <span className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 rounded-md bg-black/40 text-[9.5px] font-mono text-purple-300 border border-purple-500/30">
                      ⌘K
                    </span>
                  </button>

                  {/* Profile Avatar Trigger & Dropdown Menu */}
                  <div className="relative pl-1" ref={profileMenuRef}>
                    <button
                      id="nav-user-profile-btn"
                      onClick={() => setIsProfileMenuOpen(prev => !prev)}
                      className={`flex items-center gap-1.5 p-1 pr-2 rounded-2xl border transition-all cursor-pointer select-none group ${
                        isProfileMenuOpen
                          ? 'bg-white/[0.08] border-cyan-400/50 shadow-[0_0_16px_rgba(14,165,233,0.3)]'
                          : 'bg-white/[0.03] border-white/[0.08] hover:border-white/[0.2]'
                      } active:scale-95`}
                      title="User Profile & Quick Actions"
                      aria-expanded={isProfileMenuOpen}
                    >
                      {/* Avatar */}
                      <div
                        className="h-8 w-8 rounded-xl flex items-center justify-center text-xs font-black font-mono text-slate-950 shrink-0 shadow-lg group-hover:scale-105 transition-transform"
                        style={{
                          background: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)',
                          boxShadow: '0 3px 14px rgba(14,165,233,0.4), inset 0 1px 1px rgba(255,255,255,0.4)',
                        }}
                      >
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <ChevronDown
                        size={12}
                        className={`text-slate-400 group-hover:text-white transition-transform duration-200 ${
                          isProfileMenuOpen ? 'rotate-180 text-cyan-300' : ''
                        }`}
                      />
                    </button>

                    {/* ── Interactive Profile Dropdown Popover ── */}
                    {isProfileMenuOpen && (
                      <div className="absolute right-0 mt-2.5 w-72 p-2 rounded-2xl bg-[#090d16]/95 backdrop-blur-2xl border border-white/[0.12] shadow-[0_20px_50px_rgba(0,0,0,0.8)] animate-fade-up z-50 space-y-1">
                        
                        {/* Header User Card */}
                        <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-500/10 via-amber-500/5 to-transparent border border-white/[0.06] space-y-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-white truncate font-display">
                              {user.name || 'Learner'}
                            </h4>
                            <span className="badge badge-cyan text-[8px] font-mono font-bold uppercase">
                              Active
                            </span>
                          </div>
                          <p className="text-[11px] font-mono text-[var(--text-muted)] truncate">
                            {user.email || 'learner@pathwise.dev'}
                          </p>
                        </div>

                        {/* Menu Options */}
                        <div className="pt-1 space-y-1">
                          {/* Option 1: Profile */}
                          <button
                            onClick={() => {
                              setIsProfileMenuOpen(false);
                              navigate('/profile');
                            }}
                            className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left text-xs font-medium text-slate-200 hover:bg-cyan-500/15 hover:text-cyan-300 border border-transparent hover:border-cyan-500/30 transition-all cursor-pointer group"
                          >
                            <div className="p-1.5 rounded-lg bg-cyan-500/15 text-cyan-400 group-hover:bg-cyan-500/25 transition-colors">
                              <User size={15} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold text-white group-hover:text-cyan-300">
                                My Profile
                              </div>
                              <div className="text-[10px] text-[var(--text-muted)] truncate">
                                Roadmap stats, skills & readiness
                              </div>
                            </div>
                          </button>

                          {/* Option 2: Share Portfolio */}
                          <button
                            onClick={() => {
                              setIsProfileMenuOpen(false);
                              navigate('/share');
                            }}
                            className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left text-xs font-medium text-slate-200 hover:bg-amber-500/15 hover:text-amber-300 border border-transparent hover:border-amber-500/30 transition-all cursor-pointer group"
                          >
                            <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400 group-hover:bg-amber-500/25 transition-colors">
                              <Share2 size={15} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold text-white group-hover:text-amber-300">
                                Share Public Portfolio
                              </div>
                              <div className="text-[10px] text-[var(--text-muted)] truncate">
                                Recruiter-ready verified certificate
                              </div>
                            </div>
                          </button>
                        </div>

                        {/* Divider & Log Out */}
                        <div className="pt-1 border-t border-white/[0.08]">
                          <button
                            onClick={() => {
                              setIsProfileMenuOpen(false);
                              logout();
                            }}
                            className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/15 hover:border-rose-500/30 border border-transparent transition-all cursor-pointer"
                          >
                            <LogOut size={14} />
                            <span>Sign Out</span>
                          </button>
                        </div>

                      </div>
                    )}
                  </div>

                  {/* Mobile Hamburger Toggle */}
                  <button
                    id="nav-mobile-menu"
                    className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.06] border border-white/[0.08] active:scale-90 transition-all cursor-pointer"
                    onClick={() => setMobileOpen(v => !v)}
                    aria-label={mobileOpen ? 'Close Menu' : 'Open Menu'}
                    aria-expanded={mobileOpen}
                  >
                    {mobileOpen ? <X size={18} /> : <Menu size={18} />}
                  </button>
                </>
              ) : (
                /* Logged-out Action Buttons */
                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    id="nav-demo-login"
                    onClick={async () => { await demoLogin(); navigate('/dashboard'); }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-bold rounded-xl border border-amber-500/40 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 hover:shadow-[0_0_16px_rgba(245,158,11,0.3)] active:scale-95 transition-all cursor-pointer"
                  >
                    <Sparkles size={12} className="text-amber-400" />
                    <span>Demo Mode</span>
                  </button>
                  <Link
                    to="/auth"
                    id="nav-sign-in"
                    className="btn btn-primary btn-sm px-4 py-1.5 text-xs rounded-xl shadow-lg active:scale-95 transition-transform"
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
          <div className="lg:hidden mt-3 border-t border-white/[0.08] bg-[#070912]/95 backdrop-blur-2xl animate-fade-in shadow-2xl">
            <nav className="px-4 py-4 space-y-1.5" aria-label="Mobile Navigation">
              {NAV_LINKS.map(({ to, label, icon: Icon }) => {
                const active = isActive(to);
                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => handleNavClick(to)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all active:scale-95 whitespace-nowrap ${
                      active
                        ? 'bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30 shadow-[0_0_16px_rgba(245,158,11,0.2)]'
                        : 'text-slate-300 hover:bg-white/[0.05] hover:text-white'
                    }`}
                  >
                    <Icon size={16} strokeWidth={active ? 2.3 : 1.8} className={`${active ? 'text-amber-400' : 'text-slate-400'} shrink-0`} />
                    <span className="whitespace-nowrap font-medium">{label}</span>
                  </Link>
                );
              })}

              <div className="pt-3 mt-2 border-t border-white/[0.08] space-y-2">
                <button
                  onClick={() => { setMobileOpen(false); navigate('/profile'); }}
                  className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs text-cyan-300 font-bold bg-cyan-500/10 border border-cyan-500/30 active:scale-95 transition-transform"
                >
                  <User size={14} className="text-cyan-400" />
                  <span>My Profile</span>
                </button>
                <button
                  onClick={() => { setMobileOpen(false); navigate('/share'); }}
                  className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs text-amber-300 font-bold bg-amber-500/10 border border-amber-500/30 active:scale-95 transition-transform"
                >
                  <Share2 size={14} className="text-amber-400" />
                  <span>Share Public Portfolio</span>
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
