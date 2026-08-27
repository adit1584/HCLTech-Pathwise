import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { TargetRole } from '../types';
import {
  Compass,
  Sparkles,
  ArrowRight,
  Briefcase,
  Target,
  CheckCircle2,
  Loader2,
  Search,
  X,
  Plus,
  Zap,
  Globe,
  Code,
  BarChart2,
  Cpu,
  Palette,
  Shield,
  Database,
  ChevronDown,
  RotateCcw,
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

// ── Domain Specific Baseline Skill Mappings ────────────────────────────────
const ROLE_DEFAULT_SKILLS: Record<string, Record<string, number>> = {
  'data-scientist': {
    python: 65,
    sql: 50,
    statistics: 45,
    'data-analysis': 50,
    'machine-learning': 30,
    'data-visualization': 40,
  },
  'ml-engineer': {
    python: 70,
    'deep-learning': 40,
    'machine-learning': 50,
    docker: 35,
    'linear-algebra': 45,
    mlops: 25,
  },
  'ai-engineer': {
    python: 65,
    'large-language-models': 50,
    'prompt-engineering': 60,
    'deep-learning': 35,
    'vector-databases': 40,
    'rest-apis': 50,
  },
  'full-stack-developer': {
    'html-css': 70,
    javascript: 65,
    react: 50,
    nodejs: 50,
    sql: 45,
    'rest-apis': 55,
  },
  'frontend-developer': {
    'html-css': 75,
    javascript: 70,
    react: 60,
    typescript: 45,
    'responsive-design': 65,
    'tailwind-css': 55,
  },
  'backend-developer': {
    nodejs: 60,
    python: 50,
    sql: 60,
    'rest-apis': 65,
    docker: 40,
    'system-design': 30,
  },
  'data-analyst': {
    sql: 65,
    excel: 75,
    'data-visualization': 60,
    tableau: 50,
    python: 40,
    statistics: 45,
  },
  'data-engineer': {
    sql: 70,
    python: 60,
    'data-pipelines': 50,
    'apache-spark': 35,
    docker: 40,
    'data-warehousing': 45,
  },
  'devops-engineer': {
    linux: 65,
    docker: 60,
    kubernetes: 35,
    'ci-cd': 55,
    'cloud-architecture': 45,
    terraform: 30,
  },
  'cloud-architect': {
    'cloud-architecture': 60,
    'aws-services': 55,
    docker: 50,
    networking: 50,
    'security-compliance': 40,
    terraform: 35,
  },
  'cybersecurity-analyst': {
    networking: 60,
    linux: 55,
    'vulnerability-assessment': 45,
    cryptography: 40,
    'web-security': 50,
    'incident-response': 35,
  },
  '3d-animator': {
    '3d-modeling': 60,
    blender: 65,
    'animation-principles': 50,
    'lighting-shading': 45,
    texturing: 45,
    rigging: 40,
  },
  'game-developer': {
    csharp: 60,
    'unity-engine': 55,
    'game-physics': 45,
    '3d-math': 45,
    'game-design': 50,
    cplusplus: 40,
  },
  'ui-ux-designer': {
    'ui-ux-design': 70,
    figma: 75,
    wireframing: 65,
    'user-research': 50,
    'design-systems': 55,
    prototyping: 60,
  },
  'product-manager': {
    'product-management': 65,
    'agile-scrum': 60,
    'product-analytics': 50,
    'user-research': 55,
    roadmapping: 60,
    'market-analysis': 45,
  },
  'blockchain-developer': {
    solidity: 50,
    'smart-contracts': 45,
    ethereum: 50,
    javascript: 60,
    cryptography: 40,
    web3js: 45,
  },
  'robotics-engineer': {
    cplusplus: 60,
    python: 55,
    'ros-robotics': 45,
    microcontrollers: 50,
    kinematics: 40,
    linux: 50,
  },
  'embedded-systems-engineer': {
    'c-programming': 70,
    microcontrollers: 60,
    'embedded-linux': 45,
    rtos: 40,
    'hardware-protocols': 50,
    'pcb-basics': 35,
  },
};

// Dynamically generate skills for ANY role ID or custom name
export function getSkillsForRole(
  roleId: string,
  roleName?: string,
  presetRoles?: TargetRole[]
): Record<string, number> {
  const normId = (roleId || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');

  // 1. Direct match in preset role table
  if (ROLE_DEFAULT_SKILLS[normId]) {
    return { ...ROLE_DEFAULT_SKILLS[normId] };
  }

  // 2. Check if preset role has requiredSkills array from backend
  const preset = presetRoles?.find(
    r => r.id === normId || r.name.toLowerCase() === (roleName || '').toLowerCase()
  );
  if (preset?.requiredSkills && preset.requiredSkills.length > 0) {
    const result: Record<string, number> = {};
    preset.requiredSkills.forEach(r => {
      result[r.skillId] = 50;
    });
    return result;
  }

  // 3. Keyword / Category heuristic for any custom role
  const text = `${normId} ${roleName || ''}`.toLowerCase();

  if (
    text.includes('web') ||
    text.includes('front') ||
    text.includes('react') ||
    text.includes('full') ||
    text.includes('script')
  ) {
    return { 'html-css': 65, javascript: 60, react: 50, typescript: 45, 'rest-apis': 45 };
  }
  if (text.includes('data') || text.includes('analytic') || text.includes('bi')) {
    return { sql: 60, excel: 70, 'data-visualization': 55, python: 45, statistics: 40 };
  }
  if (
    text.includes('ai') ||
    text.includes('ml') ||
    text.includes('learn') ||
    text.includes('vision') ||
    text.includes('nlp')
  ) {
    return { python: 65, 'machine-learning': 45, statistics: 50, 'deep-learning': 30, sql: 40 };
  }
  if (
    text.includes('cloud') ||
    text.includes('devops') ||
    text.includes('infra') ||
    text.includes('sre')
  ) {
    return { linux: 60, docker: 55, 'cloud-architecture': 45, 'ci-cd': 40, kubernetes: 30 };
  }
  if (text.includes('sec') || text.includes('cyber') || text.includes('hack')) {
    return { networking: 60, linux: 55, 'web-security': 45, cryptography: 35, 'incident-response': 30 };
  }
  if (
    text.includes('game') ||
    text.includes('3d') ||
    text.includes('animat') ||
    text.includes('unity')
  ) {
    return { '3d-modeling': 55, blender: 50, csharp: 45, 'animation-principles': 40, 'game-physics': 35 };
  }
  if (
    text.includes('block') ||
    text.includes('crypto') ||
    text.includes('solidity') ||
    text.includes('web3')
  ) {
    return { solidity: 45, 'smart-contracts': 40, ethereum: 45, javascript: 55, cryptography: 35 };
  }

  // Clean, versatile baseline for any novel technical field
  return {
    'programming-fundamentals': 60,
    'core-problem-solving': 60,
    'git-version-control': 50,
    'technical-documentation': 55,
    'software-best-practices': 45,
  };
}

// ── Role Search Dropdown ────────────────────────────────────────────────────
interface RoleSearchProps {
  value: string;
  displayName: string;
  onChange: (roleId: string, displayName: string, dynamicSkills?: Record<string, number>) => void;
  presetRoles: TargetRole[];
}

const RoleSearchDropdown: React.FC<RoleSearchProps> = ({
  value,
  displayName,
  onChange,
  presetRoles,
}) => {
  const [query, setQuery] = useState(displayName);
  const [isOpen, setIsOpen] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [synthesizedInfo, setSynthesizedInfo] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Keep query in sync if displayName changes externally
  useEffect(() => {
    setQuery(displayName);
  }, [displayName]);

  // Build combined list: preset roles + popular suggestions
  const allSuggestions = React.useMemo(() => {
    const presets = presetRoles.map(r => ({
      id: r.id,
      name: r.name,
      category: 'Your Paths',
      isPreset: true,
    }));
    const popular = POPULAR_ROLES.filter(p => !presetRoles.some(r => r.id === p.id)).map(p => ({
      ...p,
      isPreset: false,
    }));
    return [...presets, ...popular];
  }, [presetRoles]);

  const filtered =
    query.trim().length > 0
      ? allSuggestions.filter(
          r =>
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
    const dynamicSkills = getSkillsForRole(roleId, roleName, presetRoles);
    onChange(roleId, roleName, dynamicSkills);
    setIsOpen(false);
    setSynthesizedInfo(null);
  };

  const handleCustomSubmit = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    const normalizedId = trimmed
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Check if it's already in suggestions
    const found = allSuggestions.find(
      s => s.name.toLowerCase() === trimmed.toLowerCase() || s.id === normalizedId
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
      const dynamicSkills: Record<string, number> = {};
      if (role.requiredSkills && role.requiredSkills.length > 0) {
        role.requiredSkills.forEach(r => {
          dynamicSkills[r.skillId] = 50;
        });
      } else {
        Object.assign(dynamicSkills, getSkillsForRole(role.id, role.name, presetRoles));
      }

      onChange(role.id, role.name, dynamicSkills);
      setQuery(role.name);
      setSynthesizedInfo(
        `AI synthesized a ${role.requiredSkills?.length || 5}-skill learning pathway for "${role.name}"`
      );
    } catch {
      // Fallback: use the typed text
      const dynamicSkills = getSkillsForRole(normalizedId, trimmed, presetRoles);
      onChange(normalizedId, trimmed, dynamicSkills);
      setSynthesizedInfo(`Learning pathway generated for "${trimmed}"`);
    } finally {
      setIsSynthesizing(false);
    }
  }, [query, allSuggestions, onChange, presetRoles]);

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
        onClick={() => {
          setIsOpen(true);
          inputRef.current?.focus();
        }}
      >
        <Search size={15} className="text-[var(--text-muted)] shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSynthesizedInfo(null);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Type any career role… e.g. Full Stack Developer, 3D Animator"
          className="flex-1 bg-transparent outline-none text-[14px] text-[var(--text-primary)] placeholder-[var(--text-muted)]"
          disabled={isSynthesizing}
        />
        {isSynthesizing && (
          <Loader2 size={14} className="animate-spin text-[var(--primary-400)] shrink-0" />
        )}
        {!isSynthesizing && query && (
          <button
            onClick={e => {
              e.stopPropagation();
              setQuery('');
              onChange('', '');
              setSynthesizedInfo(null);
              setIsOpen(true);
            }}
            className="shrink-0 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            <X size={13} />
          </button>
        )}
        <ChevronDown
          size={14}
          className={`shrink-0 text-[var(--text-muted)] transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </div>

      {/* Synthesized info banner */}
      {synthesizedInfo && (
        <div
          className="mt-2 px-3 py-2.5 rounded-xl border flex items-center gap-2 animate-fade-in"
          style={{ background: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.3)' }}
        >
          <Zap size={12} className="text-[var(--accent-400)] shrink-0" />
          <span className="text-[11px] text-[var(--accent-300)]">{synthesizedInfo}</span>
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute top-full left-0 right-0 mt-2 rounded-xl border z-50 overflow-hidden animate-fade-up"
          style={{
            background: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
            boxShadow: '0 16px 48px -8px rgba(0,0,0,0.6)',
            maxHeight: '320px',
            overflowY: 'auto',
          }}
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
                  <div className="text-[11px] text-[var(--text-muted)]">
                    AI will synthesize a custom learning DAG
                  </div>
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
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all cursor-pointer hover:bg-[var(--bg-raised)] ${
                        value === role.id ? 'bg-[rgba(245,158,11,0.08)]' : ''
                      }`}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--primary-400)' }}
                      >
                        {ROLE_ICONS[role.id] || <Briefcase size={14} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] text-[var(--text-primary)] font-semibold truncate">
                          {role.name}
                        </div>
                        {(role as any).isPreset && (
                          <div className="text-[10px] text-[var(--accent-400)] font-mono">
                            preset pathway
                          </div>
                        )}
                      </div>
                      {value === role.id && (
                        <CheckCircle2 size={14} className="text-[var(--primary-400)] shrink-0" />
                      )}
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
                      <div className="text-[11px] text-[var(--text-muted)]">
                        AI synthesizes a custom DAG for this role
                      </div>
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
    'I know basic Python and HTML. I want to become a full stack developer in six months. I can study 10 hours a week and prefer project-based learning.'
  );
  const [isInterpreting, setIsInterpreting] = useState(false);

  // Step 2: Fine-Tuning & Self-Report
  const [targetRole, setTargetRole] = useState('full-stack-developer');
  const [targetRoleDisplay, setTargetRoleDisplay] = useState('Full Stack Developer');
  const [weeklyHours, setWeeklyHours] = useState(10);
  const [timeframeWeeks, setTimeframeWeeks] = useState(24);
  const [currentLevel, setCurrentLevel] = useState('beginner_intermediate');
  const [preferredMode, setPreferredMode] = useState<string[]>(['project_based']);

  // Dynamic self-reported skill proficiencies
  const [selfSkills, setSelfSkills] = useState<{ [key: string]: number }>(() =>
    getSkillsForRole('full-stack-developer', 'Full Stack Developer')
  );

  const [newSkillInput, setNewSkillInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    api
      .getRoles()
      .then(res => setRoles(res.roles || []))
      .catch(err => console.error('Failed to load roles:', err));
  }, []);

  // Update dynamic skills whenever the selected role changes
  const handleRoleChange = (
    roleId: string,
    roleDisplayName: string,
    dynamicSkills?: Record<string, number>
  ) => {
    setTargetRole(roleId);
    setTargetRoleDisplay(roleDisplayName);
    const resolvedSkills = dynamicSkills || getSkillsForRole(roleId, roleDisplayName, roles);
    setSelfSkills(resolvedSkills);
  };

  const handleInterpret = async () => {
    if (!nlText.trim()) return;
    setIsInterpreting(true);
    try {
      const res = await api.interpretGoal(nlText);
      const parsed = res.interpreted;

      let detectedRole = targetRole;
      let detectedDisplay = targetRoleDisplay;

      if (parsed.targetRole) {
        detectedRole = parsed.targetRole as string;
        detectedDisplay =
          (parsed.targetRoleDisplayName as string) ||
          (parsed.targetRole as string).replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

        setTargetRole(detectedRole);
        setTargetRoleDisplay(detectedDisplay);
      }
      if (parsed.weeklyHours) setWeeklyHours(parsed.weeklyHours as number);
      if (parsed.timeframeWeeks) setTimeframeWeeks(parsed.timeframeWeeks as number);
      if (parsed.currentLevel) setCurrentLevel(parsed.currentLevel as string);
      if (parsed.learningPreference) setPreferredMode(parsed.learningPreference as string[]);

      // Dynamically calibrate skills for the interpreted role
      const dynamicSkills = getSkillsForRole(detectedRole, detectedDisplay, roles);
      setSelfSkills(dynamicSkills);

      setStep(2);
    } catch (err) {
      console.error('Goal interpretation failed:', err);
      setStep(2);
    } finally {
      setIsInterpreting(false);
    }
  };

  const handleAddCustomSkill = () => {
    const trimmed = newSkillInput.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (!trimmed || selfSkills[trimmed] !== undefined) return;
    setSelfSkills(prev => ({ ...prev, [trimmed]: 50 }));
    setNewSkillInput('');
  };

  const handleRemoveSkill = (skillKey: string) => {
    setSelfSkills(prev => {
      const copy = { ...prev };
      delete copy[skillKey];
      return copy;
    });
  };

  const handleResetSkills = () => {
    setSelfSkills(getSkillsForRole(targetRole, targetRoleDisplay, roles));
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
      navigate('/dashboard');
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
    <div className="max-w-3xl mx-auto px-4 py-8 page-enter space-y-6">
      {/* Top Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold">
          <Sparkles size={13} />
          <span>STEP {step} OF 2 · AI ADAPTIVE ONBOARDING</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white font-display tracking-tight">
          {step === 1 ? 'Describe Your Career Aspiration' : 'Fine-Tune Your Learning Target'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
          {step === 1
            ? 'Tell us what you already know, what career role you want to pursue, and how many hours you can commit.'
            : 'Review your personalized curriculum parameters and set your starting confidence.'}
        </p>
      </div>

      {/* ── STEP 1: Natural Language Goal Interpreter ── */}
      {step === 1 && (
        <div className="card p-6 sm:p-8 space-y-6 animate-fade-up">
          <div className="space-y-2">
            <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Compass size={14} className="text-amber-400" />
              <span>Your Career Goal & Background</span>
            </label>
            <textarea
              rows={4}
              value={nlText}
              onChange={e => setNlText(e.target.value)}
              placeholder="e.g. I know basic JavaScript and HTML. I want to become a Full Stack Developer in 6 months. I can study 10 hours a week..."
              className="w-full p-4 rounded-2xl bg-[var(--bg-void)] border border-[var(--border-subtle)] focus:border-amber-400 text-white text-sm outline-none transition-all resize-none shadow-inner"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-slate-500 font-mono hidden sm:block">
              ✨ Groq LLaMA 3.3 auto-extracts target roles, hours & skills
            </div>
            <button
              type="button"
              onClick={handleInterpret}
              disabled={isInterpreting || !nlText.trim()}
              className="w-full sm:w-auto btn btn-primary text-xs px-6 py-3 font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
            >
              {isInterpreting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Analyzing Career Profile…</span>
                </>
              ) : (
                <>
                  <span>Compile Career Target</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Role Selector & Dynamic Role-Specific Skills ── */}
      {step === 2 && (
        <div className="card p-6 sm:p-8 space-y-6 animate-fade-up">
          {/* Target Role Selector */}
          <div className="space-y-2">
            <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Target size={14} className="text-amber-400" />
              <span>Target Career Role</span>
            </label>
            <RoleSearchDropdown
              value={targetRole}
              displayName={targetRoleDisplay}
              onChange={handleRoleChange}
              presetRoles={roles}
            />
          </div>

          {/* Time & Velocity Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[var(--bg-void)] border border-[var(--border-dim)] space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Weekly Commitment</span>
                <span className="font-bold text-amber-400">{weeklyHours} hrs/week</span>
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

            <div className="p-4 rounded-2xl bg-[var(--bg-void)] border border-[var(--border-dim)] space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Target Timeframe</span>
                <span className="font-bold text-emerald-400">{timeframeWeeks} weeks (~{Math.round(timeframeWeeks / 4)} mo)</span>
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

          {/* Learning Style Preferences */}
          <div className="space-y-2.5">
            <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Briefcase size={14} className="text-amber-400" />
              <span>Learning Preferences</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {LEARNING_MODES.map(mode => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => toggleMode(mode.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono border transition-all cursor-pointer ${
                    preferredMode.includes(mode.id)
                      ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 font-bold shadow-sm'
                      : 'bg-white/[0.03] border-white/[0.08] text-slate-400 hover:text-white'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Dynamic Role-Specific Baseline Skills Section ── */}
          <div className="space-y-4 pt-4 border-t border-white/[0.08]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
                  <span>Baseline Skills for {targetRoleDisplay}</span>
                  <span className="badge badge-amber text-[9px] font-mono font-bold">
                    {Object.keys(selfSkills).length} SKILLS
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Adjust sliders for skills you already know. Skills rated ≥ 70% will be fast-tracked in your DAG!
                </p>
              </div>

              <button
                type="button"
                onClick={handleResetSkills}
                className="text-[11px] font-mono text-slate-400 hover:text-amber-400 flex items-center gap-1 transition-colors self-start sm:self-auto cursor-pointer"
                title="Reset to default role skills"
              >
                <RotateCcw size={11} />
                <span>Reset to Role Defaults</span>
              </button>
            </div>

            {/* Grid of Dynamic Skill Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {Object.entries(selfSkills).map(([skill, val]) => (
                <div
                  key={skill}
                  className="p-3.5 rounded-2xl bg-[var(--bg-void)] border border-white/[0.08] space-y-2 hover:border-white/[0.18] transition-all"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white capitalize font-mono truncate">
                      {skill.replace(/-/g, ' ')}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-400">{val}%</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="p-0.5 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Remove this skill"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={val}
                    onChange={e =>
                      setSelfSkills(prev => ({ ...prev, [skill]: parseInt(e.target.value) }))
                    }
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              ))}
            </div>

            {/* Add Custom Skill Inline Input */}
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-dashed border-white/[0.12] flex items-center gap-2">
              <input
                type="text"
                value={newSkillInput}
                onChange={e => setNewSkillInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomSkill();
                  }
                }}
                placeholder="Know another skill? e.g. Docker, TypeScript, Figma..."
                className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 outline-none px-2 font-mono"
              />
              <button
                type="button"
                onClick={handleAddCustomSkill}
                disabled={!newSkillInput.trim()}
                className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold hover:bg-amber-500/25 disabled:opacity-40 transition-all cursor-pointer flex items-center gap-1 shrink-0"
              >
                <Plus size={12} />
                <span>Add Skill</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="btn btn-ghost text-xs cursor-pointer"
            >
              ← Back
            </button>

            <button
              type="button"
              onClick={handleFinish}
              disabled={isSaving || !targetRole}
              className="btn btn-primary text-xs px-6 py-3 font-bold flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Compiling Topological DAG…</span>
                </>
              ) : (
                <>
                  <span>Compile Learning Path</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
