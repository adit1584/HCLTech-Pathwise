import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { TargetRole } from '../types';
import {
  Compass,
  Sparkles,
  ArrowRight,
  Clock,
  Briefcase,
  Target,
  CheckCircle2,
  Loader2,
  Search,
  X,
  Star,
  Zap,
  Globe,
  Code,
  BarChart2,
  Cpu,
  Palette,
  Shield,
  Database,
  ChevronDown,
} from 'lucide-react';

// ── Role Icons mapping ──────────────────────────────────────────────────────
const ROLE_ICONS: Record<string, React.ReactNode> = {
  'data-scientist': <BarChart2 size={18} />,
  'ml-engineer': <Cpu size={18} />,
  'full-stack-developer': <Code size={18} />,
  'data-analyst': <Database size={18} />,
  'ai-engineer': <Sparkles size={18} />,
  'web-developer': <Globe size={18} />,
  '3d-animator': <Palette size={18} />,
  'cybersecurity-analyst': <Shield size={18} />,
};

// ── Popular role suggestions shown in the search dropdown ──────────────────
const POPULAR_ROLES = [
  { id: 'data-scientist', name: 'Data Scientist', category: 'Data & AI' },
  { id: 'ml-engineer', name: 'ML Engineer', category: 'Data & AI' },
  { id: 'ai-engineer', name: 'AI Engineer', category: 'Data & AI' },
  { id: 'data-analyst', name: 'Data Analyst', category: 'Data & AI' },
  { id: 'full-stack-developer', name: 'Full Stack Developer', category: 'Web Dev' },
  { id: 'frontend-developer', name: 'Frontend Developer', category: 'Web Dev' },
  { id: 'backend-developer', name: 'Backend Developer', category: 'Web Dev' },
  { id: 'devops-engineer', name: 'DevOps Engineer', category: 'Infrastructure' },
  { id: 'cloud-architect', name: 'Cloud Architect', category: 'Infrastructure' },
  { id: 'cybersecurity-analyst', name: 'Cybersecurity Analyst', category: 'Security' },
  { id: '3d-animator', name: '3D Animator', category: 'Creative' },
  { id: 'game-developer', name: 'Game Developer', category: 'Creative' },
  { id: 'ui-ux-designer', name: 'UI/UX Designer', category: 'Design' },
  { id: 'product-manager', name: 'Product Manager', category: 'Management' },
  { id: 'blockchain-developer', name: 'Blockchain Developer', category: 'Web3' },
  { id: 'robotics-engineer', name: 'Robotics Engineer', category: 'Engineering' },
  { id: 'embedded-systems-engineer', name: 'Embedded Systems Engineer', category: 'Engineering' },
  { id: 'data-engineer', name: 'Data Engineer', category: 'Data & AI' },
  { id: 'nlp-engineer', name: 'NLP Engineer', category: 'Data & AI' },
  { id: 'computer-vision-engineer', name: 'Computer Vision Engineer', category: 'Data & AI' },
];

// ── Role Search Dropdown ────────────────────────────────────────────────────
interface RoleSearchProps {
  value: string;
  displayName: string;
  onChange: (roleId: string, displayName: string) => void;
  presetRoles: TargetRole[];
}

const RoleSearchDropdown: React.FC<RoleSearchProps> = ({ value, displayName, onChange, presetRoles }) => {
  const [query, setQuery] = useState(displayName);
  const [isOpen, setIsOpen] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [synthesizedInfo, setSynthesizedInfo] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Build combined list: preset roles + popular suggestions
  const allSuggestions = React.useMemo(() => {
    const presets = presetRoles.map(r => ({ id: r.id, name: r.name, category: 'Your Paths', isPreset: true }));
    const popular = POPULAR_ROLES.filter(p => !presetRoles.some(r => r.id === p.id))
      .map(p => ({ ...p, isPreset: false }));
    return [...presets, ...popular];
  }, [presetRoles]);

  const filtered = query.trim().length > 0
    ? allSuggestions.filter(r =>
        r.name.toLowerCase().includes(query.toLowerCase()) ||
        r.id.includes(query.toLowerCase().replace(/\s+/g, '-'))
      )
    : allSuggestions;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (roleId: string, roleName: string) => {
    setQuery(roleName);
    onChange(roleId, roleName);
    setIsOpen(false);
    setSynthesizedInfo(null);
  };

  const handleCustomSubmit = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    const normalizedId = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    // Check if it's already in suggestions
    const found = allSuggestions.find(s =>
      s.name.toLowerCase() === trimmed.toLowerCase() || s.id === normalizedId
    );
    if (found) {
      handleSelect(found.id, found.name);
      return;
    }

    // Synthesize via AI
    setIsSynthesizing(true);
    setIsOpen(false);
    setSynthesizedInfo(null);
    try {
      const res = await api.createCustomRole(trimmed);
      const role = res.role;
      onChange(role.id, role.name);
      setQuery(role.name);
      setSynthesizedInfo(`AI synthesized a ${role.requiredSkills?.length || 0}-skill learning pathway for "${role.name}"`);
    } catch {
      // Fallback: use the typed text
      onChange(normalizedId, trimmed);
      setSynthesizedInfo(`Learning pathway will be generated for "${trimmed}"`);
    } finally {
      setIsSynthesizing(false);
    }
  }, [query, allSuggestions, onChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered.length === 1) {
        handleSelect(filtered[0].id, filtered[0].name);
      } else {
        handleCustomSubmit();
      }
    }
    if (e.key === 'Escape') setIsOpen(false);
  };

  const groupedFiltered = React.useMemo(() => {
    const groups: Record<string, typeof filtered> = {};
    filtered.slice(0, 12).forEach(r => {
      const cat = (r as any).category || 'Other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(r);
    });
    return groups;
  }, [filtered]);

  return (
    <div ref={dropdownRef} className="relative">
      {/* Input */}
      <div
        className="flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all cursor-text"
        style={{
          background: 'var(--bg-void)',
          borderColor: isOpen ? 'var(--primary-500)' : 'var(--border-subtle)',
          boxShadow: isOpen ? '0 0 0 3px rgba(245,158,11,0.1)' : 'none',
        }}
        onClick={() => { setIsOpen(true); inputRef.current?.focus(); }}
      >
        <Search size={15} className="text-[var(--text-muted)] shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setIsOpen(true); setSynthesizedInfo(null); }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Type any career role… e.g. Blockchain Developer"
          className="flex-1 bg-transparent outline-none text-[14px] text-[var(--text-primary)] placeholder-[var(--text-muted)]"
          disabled={isSynthesizing}
        />
        {isSynthesizing && <Loader2 size={14} className="animate-spin text-[var(--primary-400)] shrink-0" />}
        {!isSynthesizing && query && (
          <button
            onClick={e => { e.stopPropagation(); setQuery(''); onChange('', ''); setSynthesizedInfo(null); setIsOpen(true); }}
            className="shrink-0 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            <X size={13} />
          </button>
        )}
        <ChevronDown size={14} className={`shrink-0 text-[var(--text-muted)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {/* Synthesized info banner */}
      {synthesizedInfo && (
        <div className="mt-2 px-3 py-2.5 rounded-xl border flex items-center gap-2 animate-fade-in" style={{ background: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.3)' }}>
          <Zap size={12} className="text-[var(--accent-400)] shrink-0" />
          <span className="text-[11px] text-[var(--accent-300)]">{synthesizedInfo}</span>
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute top-full left-0 right-0 mt-2 rounded-xl border z-50 overflow-hidden animate-fade-up"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', boxShadow: '0 16px 48px -8px rgba(0,0,0,0.6)', maxHeight: '320px', overflowY: 'auto' }}
        >
          {Object.keys(groupedFiltered).length === 0 ? (
            <div className="px-4 py-3">
              <button
                onClick={handleCustomSubmit}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all hover:bg-[var(--bg-raised)] cursor-pointer"
              >
                <Sparkles size={14} className="text-[var(--primary-400)] shrink-0" />
                <div>
                  <div className="text-[13px] text-[var(--text-primary)] font-semibold">
                    Generate pathway for "{query}"
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">AI will synthesize a custom learning DAG</div>
                </div>
              </button>
            </div>
          ) : (
            <>
              {Object.entries(groupedFiltered).map(([category, items]) => (
                <div key={category}>
                  <div className="px-4 pt-2.5 pb-1 text-[10px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    {category}
                  </div>
                  {items.map(role => (
                    <button
                      key={role.id}
                      onClick={() => handleSelect(role.id, role.name)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all cursor-pointer hover:bg-[var(--bg-raised)] ${value === role.id ? 'bg-[rgba(245,158,11,0.08)]' : ''}`}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--primary-400)' }}
                      >
                        {ROLE_ICONS[role.id] || <Briefcase size={14} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] text-[var(--text-primary)] font-semibold truncate">{role.name}</div>
                        {(role as any).isPreset && <div className="text-[10px] text-[var(--accent-400)] font-mono">preset pathway</div>}
                      </div>
                      {value === role.id && <CheckCircle2 size={14} className="text-[var(--primary-400)] shrink-0" />}
                    </button>
                  ))}
                </div>
              ))}
              {/* Custom role option */}
              {query.trim() && !filtered.some(f => f.name.toLowerCase() === query.toLowerCase()) && (
                <div className="border-t border-[var(--border-dim)] px-3 py-2">
                  <button
                    onClick={handleCustomSubmit}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all hover:bg-[var(--bg-raised)] cursor-pointer"
                  >
                    <Sparkles size={14} className="text-[var(--primary-400)] shrink-0" />
                    <div>
                      <div className="text-[13px] text-[var(--text-primary)] font-semibold">
                        Generate pathway for "{query}"
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)]">AI synthesizes a custom DAG for this role</div>
                    </div>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ── Main Page ───────────────────────────────────────────────────────────────
export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState<TargetRole[]>([]);
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1: Natural Language Goal
  const [nlText, setNlText] = useState(
    'I know basic Python and Excel. I want to become a data scientist in six months. I can study 8 hours a week and prefer project-based learning.'
  );
  const [isInterpreting, setIsInterpreting] = useState(false);

  // Step 2: Fine-Tuning & Self-Report
  const [targetRole, setTargetRole] = useState('data-scientist');
  const [targetRoleDisplay, setTargetRoleDisplay] = useState('Data Scientist');
  const [weeklyHours, setWeeklyHours] = useState(8);
  const [timeframeWeeks, setTimeframeWeeks] = useState(24);
  const [currentLevel, setCurrentLevel] = useState('beginner_intermediate');
  const [preferredMode, setPreferredMode] = useState<string[]>(['project_based']);

  // Self reported skill proficiencies
  const [selfSkills, setSelfSkills] = useState<{ [key: string]: number }>({
    python: 70,
    excel: 75,
    sql: 50,
    statistics: 40,
    'machine-learning': 20,
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    api
      .getRoles()
      .then(res => setRoles(res.roles || []))
      .catch(err => console.error('Failed to load roles:', err));
  }, []);

  const handleInterpret = async () => {
    if (!nlText.trim()) return;
    setIsInterpreting(true);
    try {
      const res = await api.interpretGoal(nlText);
      const parsed = res.interpreted;

      if (parsed.targetRole) {
        setTargetRole(parsed.targetRole as string);
        setTargetRoleDisplay(
          (parsed.targetRoleDisplayName as string) ||
          (parsed.targetRole as string).replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
        );
      }
      if (parsed.weeklyHours) setWeeklyHours(parsed.weeklyHours as number);
      if (parsed.timeframeWeeks) setTimeframeWeeks(parsed.timeframeWeeks as number);
      if (parsed.currentLevel) setCurrentLevel(parsed.currentLevel as string);
      if (parsed.learningPreference) setPreferredMode(parsed.learningPreference as string[]);

      setStep(2);
    } catch (err) {
      console.error('Goal interpretation failed:', err);
      setStep(2);
    } finally {
      setIsInterpreting(false);
    }
  };

  const handleFinish = async () => {
    if (!targetRole) return;
    setIsSaving(true);
    try {
      const selfReportList = Object.entries(selfSkills).map(([skillId, proficiency]) => ({
        skillId,
        proficiency,
      }));

      await api.setGoal(
        {
          targetRole,
          objective: 'career_transition',
          timeframeWeeks,
          weeklyHours,
          currentLevel,
          learningPreference: preferredMode,
          constraints: [],
          targetSkills: [],
        },
        selfReportList
      );

      await api.compilePath();
      navigate('/diagnostic');
    } catch (err) {
      console.error('Failed to save goal and compile path:', err);
      navigate('/dashboard');
    } finally {
      setIsSaving(false);
    }
  };

  const LEARNING_MODES = [
    { id: 'project_based', label: 'Project-Based' },
    { id: 'video', label: 'Video Courses' },
    { id: 'reading', label: 'Reading / Docs' },
    { id: 'interactive', label: 'Interactive Coding' },
    { id: 'mentored', label: 'Mentored' },
  ];

  const toggleMode = (mode: string) => {
    setPreferredMode(prev =>
      prev.includes(mode) ? prev.filter(m => m !== mode) : [...prev, mode]
    );
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 page-enter">
      {/* Progress header */}
      <div className="mb-8 text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.28)] text-[var(--primary-300)] text-[11px] font-mono">
          <span>STEP {step} OF 2</span>
          <span>•</span>
          <span>{step === 1 ? 'NATURAL LANGUAGE GOAL' : 'CALIBRATION & ROLE'}</span>
        </div>
        <h1 className="text-3xl font-extrabold text-[var(--text-primary)] font-display tracking-tight">
          Define Your Career Goal
        </h1>
        <p className="text-sm text-[var(--text-secondary)] max-w-lg mx-auto">
          Pathwise compiles any career goal into a personalized prerequisite learning DAG.
        </p>
      </div>

      {step === 1 ? (
        /* Step 1: Natural Language Prompt */
        <div className="p-8 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-6 animate-fade-up">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2 font-display">
              <Sparkles size={16} className="text-[var(--primary-400)]" />
              Describe your career goal in plain language
            </label>
            <p className="text-xs text-[var(--text-muted)]">
              Mention any role — Data Scientist, 3D Animator, Game Dev, Blockchain Developer, Robotics Engineer, etc.
            </p>
          </div>

          <textarea
            rows={5}
            value={nlText}
            onChange={e => setNlText(e.target.value)}
            placeholder="e.g. I know basic Python and Excel. I want to become a data scientist in six months. I can study 8 hours a week and prefer project-based learning."
            className="w-full p-4 text-sm bg-[var(--bg-void)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary-500)] leading-relaxed font-sans"
          />

          <div className="flex flex-wrap gap-2 text-xs text-[var(--text-muted)]">
            <span className="font-semibold text-[var(--text-secondary)] font-mono self-center">Templates:</span>
            {[
              { label: 'Data Scientist', text: 'I know basic Python and Excel. I want to become a data scientist in six months with 8 hours a week.' },
              { label: 'ML Engineer', text: 'I am an intermediate Python developer transitioning to ML Engineer in 4 months with 12 hours a week.' },
              { label: 'Full Stack Dev', text: 'I know HTML and CSS. I want to become a Full Stack Developer in 5 months studying 10 hours a week.' },
              { label: '3D Animator', text: 'I want to build a career in 3D Character Animation and Rigging within 6 months studying 10 hours a week.' },
              { label: 'Blockchain Dev', text: 'I know JavaScript. I want to become a Blockchain Developer in 4 months, studying 10 hours per week.' },
              { label: 'Game Developer', text: 'Complete beginner wanting to learn game development with Unity in 6 months, 8 hours a week.' },
            ].map(tpl => (
              <button
                key={tpl.label}
                type="button"
                onClick={() => setNlText(tpl.text)}
                className="px-2.5 py-1 rounded-lg bg-[var(--bg-raised)] hover:bg-[var(--bg-overlay)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all font-mono text-[11px] border border-[var(--border-dim)] cursor-pointer"
              >
                {tpl.label}
              </button>
            ))}
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={handleInterpret}
              disabled={isInterpreting || !nlText.trim()}
              className="btn btn-primary"
              style={{ padding: '0.75rem 1.75rem' }}
            >
              {isInterpreting ? (
                <><Loader2 size={16} className="animate-spin" /> Extracting Intent with AI…</>
              ) : (
                <>Extract & Continue <ArrowRight size={16} /></>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Step 2: Role Search + Calibration */
        <div className="p-8 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-8 animate-fade-up">
          <div className="p-4 rounded-xl bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.25)] flex items-center gap-3">
            <CheckCircle2 size={18} className="text-[var(--primary-400)] shrink-0" />
            <div className="text-xs text-[var(--text-secondary)]">
              <strong className="text-[var(--text-primary)]">AI extraction complete.</strong>{' '}
              Search for any career role below — our AI synthesizes a DAG pathway for any path you choose.
            </div>
          </div>

          {/* Role Search */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2 font-mono">
              <Briefcase size={16} className="text-[var(--primary-400)]" />
              Target Career Role
              <span className="text-[10px] font-normal text-[var(--text-muted)] ml-1">— search or type any role</span>
            </label>

            <RoleSearchDropdown
              value={targetRole}
              displayName={targetRoleDisplay}
              onChange={(id, name) => { setTargetRole(id); setTargetRoleDisplay(name); }}
              presetRoles={roles}
            />

            {targetRole && (
              <div className="flex items-center gap-2 text-[11px] font-mono animate-fade-in">
                <Star size={11} className="text-[var(--primary-400)]" />
                <span className="text-[var(--text-muted)]">Selected:</span>
                <span className="text-[var(--primary-300)] font-semibold">{targetRoleDisplay}</span>
                <span className="text-[var(--text-muted)]">({targetRole})</span>
              </div>
            )}
          </div>

          {/* Time & Study Constraints */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-[var(--text-secondary)] font-mono flex items-center gap-1.5">
                  <Clock size={13} className="text-[var(--primary-400)]" /> Weekly Study Commitment
                </span>
                <span className="font-mono font-bold text-[var(--primary-300)]">{weeklyHours} hrs/week</span>
              </div>
              <input
                type="range"
                min={2}
                max={40}
                step={2}
                value={weeklyHours}
                onChange={e => setWeeklyHours(parseInt(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-[var(--text-secondary)] font-mono flex items-center gap-1.5">
                  <Target size={13} className="text-[var(--accent-400)]" /> Target Timeframe
                </span>
                <span className="font-mono font-bold text-[var(--accent-300)]">{timeframeWeeks} weeks (~{Math.round(timeframeWeeks / 4)} mo)</span>
              </div>
              <input
                type="range"
                min={4}
                max={52}
                step={4}
                value={timeframeWeeks}
                onChange={e => setTimeframeWeeks(parseInt(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Learning Preferences */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2 font-mono">
              <Compass size={15} className="text-[var(--accent-400)]" />
              Learning Style Preferences
            </label>
            <div className="flex flex-wrap gap-2">
              {LEARNING_MODES.map(mode => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => toggleMode(mode.id)}
                  className={`px-3 py-1.5 rounded-xl text-[12px] font-mono border transition-all cursor-pointer ${
                    preferredMode.includes(mode.id)
                      ? 'bg-[rgba(245,158,11,0.15)] border-[var(--primary-500)] text-[var(--primary-300)] font-bold'
                      : 'bg-[var(--bg-void)] border-[var(--border-dim)] text-[var(--text-secondary)] hover:border-[var(--border-muted)]'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          {/* Baseline Self Report */}
          <div className="space-y-4 pt-4 border-t border-[var(--border-dim)]">
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)] font-display">
                Baseline Skill Proficiencies
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Calibrate your starting confidence (verified via Diagnostic afterwards).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(selfSkills).map(([skill, val]) => (
                <div key={skill} className="p-3 rounded-xl bg-[var(--bg-void)] border border-[var(--border-dim)] space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-[var(--text-primary)] capitalize font-mono">
                      {skill.replace(/-/g, ' ')}
                    </span>
                    <span className="font-mono font-bold text-[var(--primary-300)]">{val}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={val}
                    onChange={e => setSelfSkills({ ...selfSkills, [skill]: parseInt(e.target.value) })}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-[var(--border-dim)]">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="btn btn-ghost"
            >
              ← Back
            </button>

            <button
              type="button"
              onClick={handleFinish}
              disabled={isSaving || !targetRole}
              className="btn btn-primary"
              style={{ padding: '0.75rem 2rem' }}
            >
              {isSaving ? (
                <><Loader2 size={16} className="animate-spin" /> Compiling Your DAG…</>
              ) : (
                <>Compile Learning Path <ArrowRight size={16} /></>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
