import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  Position,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { api } from '../services/api';
import type { SkillNode, SkillState, TargetRole } from '../types';
import {
  Network,
  Info,
  Eye,
  Layers,
  CheckCircle2,
  AlertCircle,
  X,
  Filter,
  Search,
  Sparkles,
  Target,
  Lock,
  Unlock,
  ArrowRight,
  TrendingUp,
  Award,
  Zap,
  BookOpen,
  LayoutGrid,
  GitBranch,
  Briefcase,
} from 'lucide-react';
import { RecommendationTraceModal } from '../components/RecommendationTraceModal';

// ── Tier / Milestone Configuration ─────────────────────────────────────────
const TIER_META: Record<number, { title: string; subtitle: string; color: string; badge: string }> = {
  0: { title: 'Milestone 1: Foundations', subtitle: 'Zero-prerequisite core building blocks & systems', color: '#10b981', badge: 'Milestone 1' },
  1: { title: 'Milestone 2: Applied Core', subtitle: 'Core applied frameworks and essential tooling', color: '#0ea5e9', badge: 'Milestone 2' },
  2: { title: 'Milestone 3: Advanced Systems', subtitle: 'Distributed architectures, security & modeling', color: '#f59e0b', badge: 'Milestone 3' },
  3: { title: 'Milestone 4: Production & Capstones', subtitle: 'Production deployment, cloud architecture & mastery', color: '#8b5cf6', badge: 'Milestone 4' },
};

const POPULAR_GRAPH_ROLES = [
  { id: 'full-stack-developer', name: 'Full Stack Developer' },
  { id: 'frontend-developer', name: 'Frontend Developer' },
  { id: 'backend-developer', name: 'Backend Developer' },
  { id: 'cybersecurity-analyst', name: 'Cybersecurity Analyst' },
  { id: 'devops-engineer', name: 'DevOps & Cloud Engineer' },
  { id: 'blockchain-developer', name: 'Blockchain Developer' },
  { id: 'data-scientist', name: 'Data Scientist' },
  { id: 'machine-learning-engineer', name: 'ML & AI Engineer' },
  { id: 'mobile-developer', name: 'Mobile Developer' },
  { id: 'data-engineer', name: 'Data Engineer' },
  { id: 'ui-ux-designer', name: 'UI/UX Designer' },
  { id: 'product-manager', name: 'Product Manager' },
  { id: 'game-developer', name: 'Game Developer' },
  { id: '3d-animator', name: '3D Animator' },
];

export const SkillGraphPage: React.FC = () => {
  const navigate = useNavigate();

  const [skills, setSkills] = useState<SkillNode[]>([]);
  const [skillStates, setSkillStates] = useState<{ [id: string]: SkillState }>({});
  const [targetRole, setTargetRole] = useState<string>('full-stack-developer');
  const [targetRoleDisplayName, setTargetRoleDisplayName] = useState<string>('Full Stack Developer');
  const [totalRoleSkillsCount, setTotalRoleSkillsCount] = useState<number>(0);
  const [targetRoleSkills, setTargetRoleSkills] = useState<Set<string>>(new Set());
  const [selectedSkill, setSelectedSkill] = useState<SkillNode | null>(null);
  const [traceSkillId, setTraceSkillId] = useState<string | null>(null);

  // View & Filter States
  const [viewMode, setViewMode] = useState<'graph' | 'matrix'>('graph');
  const [roleOnly, setRoleOnly] = useState<boolean>(true);
  const [selectedTier, setSelectedTier] = useState<number | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'IN_PROGRESS' | 'READY' | 'LOCKED'>('ALL');
  const [loading, setLoading] = useState(true);

  // Load Graph for a specific role
  const loadGraphForRole = useCallback(async (roleId?: string) => {
    try {
      setLoading(true);
      const [graphData, profileData] = await Promise.all([
        api.getSkillGraph(roleId),
        api.getProfile().catch(() => null),
      ]);

      setSkills(graphData.nodes || []);
      if (graphData.role) setTargetRoleDisplayName(graphData.role);
      if (graphData.totalRequiredSkills) setTotalRoleSkillsCount(graphData.totalRequiredSkills);

      const stateMap: { [id: string]: SkillState } = {};
      (profileData?.skillStates || []).forEach(s => {
        stateMap[s.skillId] = s;
      });
      setSkillStates(stateMap);

      const roleSkillSet = new Set<string>();
      (graphData.nodes || []).forEach(node => {
        if (node.isRequired) {
          roleSkillSet.add(node.id);
        }
      });
      setTargetRoleSkills(roleSkillSet);
    } catch (err) {
      console.error('Failed to load skill graph:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial Load
  useEffect(() => {
    const init = async () => {
      try {
        const profileData = await api.getProfile().catch(() => null);
        const goalRole = profileData?.goals?.[profileData.goals.length - 1]?.targetRole || 'full-stack-developer';
        setTargetRole(goalRole);
        await loadGraphForRole(goalRole);
      } catch {
        await loadGraphForRole('full-stack-developer');
      }
    };
    init();
  }, [loadGraphForRole]);

  const handleRoleChange = (newRoleId: string) => {
    setTargetRole(newRoleId);
    loadGraphForRole(newRoleId);
  };

  // Compute Topological Depths / Tiers for all skills
  const skillTiers = useMemo<{ [id: string]: number }>(() => {
    const depths: { [id: string]: number } = {};
    const skillMap = new Map<string, SkillNode>(skills.map(s => [s.id, s]));

    const computeDepth = (id: string, visited = new Set<string>()): number => {
      if (depths[id] !== undefined) return depths[id];
      if (visited.has(id)) return 0;
      visited.add(id);

      const skill = skillMap.get(id);
      if (skill?.milestone && skill.milestone >= 1 && skill.milestone <= 4) {
        depths[id] = skill.milestone - 1;
        return depths[id];
      }

      if (!skill || !skill.prerequisites || skill.prerequisites.length === 0) {
        depths[id] = 0;
        return 0;
      }

      let maxPrereqDepth = 0;
      for (const p of skill.prerequisites) {
        maxPrereqDepth = Math.max(maxPrereqDepth, computeDepth(p, new Set(visited)) + 1);
      }

      depths[id] = Math.min(maxPrereqDepth, 3);
      return depths[id];
    };

    skills.forEach(s => computeDepth(s.id));
    return depths;
  }, [skills]);

  // Compute unlocks mapping (which skills are unlocked by this skill)
  const unlocksMap = useMemo<{ [id: string]: string[] }>(() => {
    const map: { [id: string]: string[] } = {};
    skills.forEach(s => {
      (s.prerequisites || []).forEach(p => {
        if (!map[p]) map[p] = [];
        map[p].push(s.name);
      });
    });
    return map;
  }, [skills]);

  // Filter skills based on user controls
  const visibleSkills = useMemo(() => {
    return skills.filter(skill => {
      // Role filter
      if (roleOnly && targetRoleSkills.size > 0 && !targetRoleSkills.has(skill.id)) {
        return false;
      }

      // Tier filter
      const tier = skillTiers[skill.id] ?? 0;
      if (selectedTier !== 'ALL' && tier !== selectedTier) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match = skill.name.toLowerCase().includes(q) ||
          skill.id.toLowerCase().includes(q) ||
          skill.category?.toLowerCase().includes(q);
        if (!match) return false;
      }

      // Status filter
      const state = skillStates[skill.id];
      const prof = state?.proficiency ?? 0;
      const prereqsMet = (skill.prerequisites || []).every(p => (skillStates[p]?.proficiency ?? 0) >= 60);

      if (statusFilter === 'COMPLETED' && prof < 70) return false;
      if (statusFilter === 'IN_PROGRESS' && (prof === 0 || prof >= 70)) return false;
      if (statusFilter === 'READY' && (!prereqsMet || prof >= 70)) return false;
      if (statusFilter === 'LOCKED' && prereqsMet) return false;

      return true;
    });
  }, [skills, roleOnly, targetRoleSkills, selectedTier, searchQuery, statusFilter, skillTiers, skillStates]);

  // Build Topological Graph Flow Nodes & Edges
  const { nodes, edges } = useMemo(() => {
    if (visibleSkills.length === 0) return { nodes: [], edges: [] };

    // Group visible skills by tier
    const tierGroups: { [tier: number]: SkillNode[] } = { 0: [], 1: [], 2: [], 3: [] };
    visibleSkills.forEach(s => {
      const t = skillTiers[s.id] ?? 0;
      if (!tierGroups[t]) tierGroups[t] = [];
      tierGroups[t].push(s);
    });

    const flowNodes: Node[] = [];
    const flowEdges: Edge[] = [];
    const visibleIdSet = new Set(visibleSkills.map(s => s.id));

    // Position each tier in structured vertical columns
    Object.entries(tierGroups).forEach(([tierStr, items]) => {
      const tier = Number(tierStr);
      const meta = TIER_META[tier] || TIER_META[0];
      const colX = tier * 340 + 80;

      // Add column header node
      flowNodes.push({
        id: `header-tier-${tier}`,
        position: { x: colX, y: 20 },
        selectable: false,
        draggable: false,
        data: {
          label: (
            <div
              className="p-3 px-4 rounded-2xl text-left w-64 shadow-lg select-none"
              style={{
                backgroundColor: '#121828',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 8px 24px -6px rgba(0, 0, 0, 0.6)',
              }}
            >
              <span
                className="badge text-[9px] font-bold"
                style={{ background: `${meta.color}22`, borderColor: `${meta.color}50`, color: meta.color }}
              >
                {meta.badge}
              </span>
              <h4 className="text-[12px] font-bold text-white font-display mt-1">{meta.title}</h4>
            </div>
          ),
        },
      });

      items.forEach((skill, rowIdx) => {
        const state = skillStates[skill.id];
        const prof = state?.proficiency ?? 0;
        const conf = Math.round((state?.confidence ?? 0.5) * 100);
        const isTarget = targetRoleSkills.has(skill.id);
        const prereqsMet = (skill.prerequisites || []).every(p => (skillStates[p]?.proficiency ?? 0) >= 60);
        const isSelected = selectedSkill?.id === skill.id;

        // Visual Styling
        let cardBg = '#0e1320';
        let cardBorder = '1px solid rgba(255, 255, 255, 0.08)';
        let cardShadow = '0 6px 18px -4px rgba(0, 0, 0, 0.5)';

        let statusBadge = (
          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1">
            <Lock size={9} /> Locked
          </span>
        );

        if (prof >= 70) {
          cardBg = '#0c1a1f';
          cardBorder = '1.5px solid rgba(16, 185, 129, 0.6)';
          cardShadow = '0 0 20px -4px rgba(16, 185, 129, 0.25)';
          statusBadge = (
            <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
              <CheckCircle2 size={9} /> {prof}% Mastered
            </span>
          );
        } else if (prof > 0) {
          cardBg = '#181512';
          cardBorder = '1.5px solid rgba(245, 158, 11, 0.6)';
          cardShadow = '0 0 20px -4px rgba(245, 158, 11, 0.25)';
          statusBadge = (
            <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-500/40 flex items-center gap-1">
              <TrendingUp size={9} /> {prof}% In Progress
            </span>
          );
        } else if (prereqsMet) {
          cardBg = '#0c1824';
          cardBorder = '1.5px solid rgba(14, 165, 233, 0.6)';
          cardShadow = '0 0 18px -4px rgba(14, 165, 233, 0.25)';
          statusBadge = (
            <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
              <Unlock size={9} /> Ready to Learn
            </span>
          );
        }

        if (isSelected) {
          cardBorder = '2px solid #f59e0b';
          cardShadow = '0 0 24px -2px rgba(245, 158, 11, 0.4)';
        }

        flowNodes.push({
          id: skill.id,
          position: { x: colX, y: rowIdx * 150 + 110 },
          data: {
            label: (
              <div
                onClick={() => setSelectedSkill(skill)}
                className="p-3.5 rounded-2xl cursor-pointer transition-all hover:scale-[1.03] text-left w-64 space-y-2 select-none"
                style={{
                  backgroundColor: cardBg,
                  border: cardBorder,
                  boxShadow: cardShadow,
                }}
              >
                {/* Header row */}
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-[10px] font-mono text-slate-400 truncate max-w-[110px]">
                    {skill.category}
                  </span>
                  {statusBadge}
                </div>

                {/* Skill Name */}
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-[13px] text-white font-display truncate">
                    {skill.name}
                  </h4>
                  {isTarget && (
                    <span className="shrink-0 text-[10px] text-amber-400" title="Target Role Required Skill">
                      🎯
                    </span>
                  )}
                </div>

                {/* Footer metadata */}
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-white/[0.06]">
                  <span>Diff: {skill.difficulty}/5</span>
                  <span>~{skill.estimatedHours}h</span>
                  <span>Conf: {conf}%</span>
                </div>
              </div>
            ),
          },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        });

        // Add prerequisite edges
        (skill.prerequisites || []).forEach(prereqId => {
          if (visibleIdSet.has(prereqId)) {
            const isPrereqDone = (skillStates[prereqId]?.proficiency ?? 0) >= 60;
            flowEdges.push({
              id: `edge-${prereqId}-${skill.id}`,
              source: prereqId,
              target: skill.id,
              animated: !isPrereqDone && prereqsMet,
              style: {
                stroke: isPrereqDone ? '#10b981' : prereqsMet ? '#0ea5e9' : 'rgba(148, 163, 184, 0.25)',
                strokeWidth: 2,
              },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: isPrereqDone ? '#10b981' : prereqsMet ? '#0ea5e9' : 'rgba(148, 163, 184, 0.25)',
              },
            });
          }
        });
      });
    });

    return { nodes: flowNodes, edges: flowEdges };
  }, [visibleSkills, skillTiers, skillStates, targetRoleSkills, selectedSkill]);

  // Group visible skills by Tier for Matrix View
  const tieredMatrix = useMemo(() => {
    const map: Record<number, SkillNode[]> = { 0: [], 1: [], 2: [], 3: [] };
    visibleSkills.forEach(s => {
      const t = skillTiers[s.id] ?? 0;
      if (!map[t]) map[t] = [];
      map[t].push(s);
    });
    return map;
  }, [visibleSkills, skillTiers]);

  return (
    <div className="relative h-[calc(100vh-60px)] w-full overflow-hidden flex flex-col page-enter bg-[var(--bg-base)]">

      {/* ── Top Command Bar ────────────────────────────────────────── */}
      <div className="p-4 px-6 bg-[var(--bg-surface)] border-b border-[var(--border-dim)] flex flex-col md:flex-row md:items-center justify-between gap-3 z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[rgba(245,158,11,0.12)] border border-[rgba(245,158,11,0.28)] text-[var(--primary-300)]">
              <Network size={11} /> DYNAMIC PREREQUISITE DAG
            </span>
            <span className="badge badge-cyan text-[10px] font-mono font-bold flex items-center gap-1">
              <Target size={10} /> {targetRoleDisplayName} ({totalRoleSkillsCount || targetRoleSkills.size} Skills in Path)
            </span>
          </div>
          <h1 className="text-lg font-bold text-[var(--text-primary)] font-display tracking-tight">
            Topological Knowledge & Prerequisite Graph
          </h1>
        </div>

        {/* View Switcher & Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Dynamic Role Switcher Dropdown */}
          <div className="flex items-center gap-1.5 bg-[var(--bg-void)] px-3 py-1.5 rounded-xl border border-[var(--border-subtle)]">
            <Briefcase size={13} className="text-[var(--primary-400)] shrink-0" />
            <select
              value={targetRole}
              onChange={e => handleRoleChange(e.target.value)}
              className="bg-transparent text-[11px] font-mono font-bold text-[var(--text-primary)] outline-none cursor-pointer pr-1"
            >
              <optgroup label="Active Target">
                <option value={targetRole} className="bg-slate-900 text-amber-300 font-bold">
                  ★ Active: {targetRoleDisplayName}
                </option>
              </optgroup>
              <optgroup label="Explore Other Roles">
                {POPULAR_GRAPH_ROLES.filter(r => r.id !== targetRole).map(r => (
                  <option key={r.id} value={r.id} className="bg-slate-900 text-white">
                    {r.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Target Role Only Toggle */}
          <button
            onClick={() => setRoleOnly(r => !r)}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-mono border transition-all cursor-pointer flex items-center gap-1.5 ${
              roleOnly
                ? 'bg-[var(--primary-500)] text-slate-950 font-bold border-transparent shadow-[0_2px_10px_-2px_rgba(245,158,11,0.5)]'
                : 'bg-[var(--bg-void)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            title={roleOnly ? 'Showing only skills required for the selected role' : 'Showing all global skills in the universe'}
          >
            <Target size={12} />
            <span>{roleOnly ? 'Role Roadmap Skills' : 'All Universe Skills'}</span>
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-[var(--bg-void)] p-1 rounded-xl border border-[var(--border-subtle)]">
            <button
              onClick={() => setViewMode('graph')}
              className={`px-3 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'graph' ? 'bg-[var(--bg-surface)] text-[var(--primary-300)] font-bold shadow-sm' : 'text-[var(--text-muted)]'
              }`}
            >
              <GitBranch size={12} /> Canvas
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-3 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'matrix' ? 'bg-[var(--bg-surface)] text-[var(--primary-300)] font-bold shadow-sm' : 'text-[var(--text-muted)]'
              }`}
            >
              <LayoutGrid size={12} /> Tier Matrix
            </button>
          </div>
        </div>
      </div>

      {/* ── Sub-toolbar: Search & Tier Filters ──────────────────────── */}
      <div className="px-6 py-2.5 bg-[var(--bg-surface)]/80 border-b border-[var(--border-dim)] flex items-center justify-between gap-3 overflow-x-auto text-[11px] font-mono">
        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-void)] border border-[var(--border-subtle)] w-60">
          <Search size={12} className="text-[var(--text-muted)] shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Find skill node…"
            className="flex-1 bg-transparent outline-none text-[12px] text-[var(--text-primary)] placeholder-[var(--text-muted)] font-sans"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-[var(--text-muted)]">
              <X size={11} />
            </button>
          )}
        </div>

        {/* Tier filter tabs */}
        <div className="flex items-center gap-1.5">
          <span className="text-[var(--text-muted)] mr-1">Tiers:</span>
          {(['ALL', 0, 1, 2, 3] as const).map(t => (
            <button
              key={String(t)}
              onClick={() => setSelectedTier(t)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono border transition-all cursor-pointer ${
                selectedTier === t
                  ? 'bg-[var(--primary-500)] text-slate-950 font-bold border-transparent'
                  : 'bg-[var(--bg-void)] border-[var(--border-dim)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {t === 'ALL' ? 'All Tiers' : TIER_META[t]?.badge || `Tier ${t + 1}`}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-[var(--text-muted)] mr-1">Status:</span>
          {(['ALL', 'READY', 'IN_PROGRESS', 'COMPLETED'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono border transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-[var(--primary-500)] text-slate-950 font-bold border-transparent'
                  : 'bg-[var(--bg-void)] border-[var(--border-dim)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {st === 'ALL' ? 'All' : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Display Area ──────────────────────────────────────── */}
      <div className="flex-1 relative overflow-hidden flex">

        {/* ── View 1: Canvas Mode ─────────────────────────────────── */}
        {viewMode === 'graph' && (
          <div className="flex-1 h-full relative">
            {loading ? (
              <div className="flex h-full items-center justify-center text-[var(--text-muted)] text-sm">
                <div className="h-6 w-6 border-2 border-[var(--primary-500)] border-t-transparent rounded-full animate-spin mr-2" />
                Computing topological layout…
              </div>
            ) : nodes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-2">
                <Network size={32} className="text-[var(--text-muted)]" />
                <p className="text-sm text-[var(--text-secondary)]">No skills match the current filter.</p>
                <button onClick={() => { setRoleOnly(false); setSelectedTier('ALL'); setSearchQuery(''); setStatusFilter('ALL'); }} className="btn btn-ghost text-xs">
                  Reset Filters
                </button>
              </div>
            ) : (
              <ReactFlow
                nodes={nodes}
                edges={edges}
                fitView
                minZoom={0.2}
                maxZoom={1.5}
                attributionPosition="bottom-left"
              >
                <Background color="#1e2638" gap={28} size={1} />
                <Controls />
                <MiniMap
                  nodeColor="#f59e0b"
                  maskColor="rgba(7, 9, 14, 0.85)"
                  className="bg-[var(--bg-void)]! border! border-[var(--border-subtle)]! rounded-xl!"
                />
              </ReactFlow>
            )}
          </div>
        )}

        {/* ── View 2: Tiered Matrix Mode ──────────────────────────── */}
        {viewMode === 'matrix' && (
          <div className="flex-1 h-full overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 items-start">
              {[0, 1, 2, 3].map(tierNum => {
                const meta = TIER_META[tierNum];
                const items = tieredMatrix[tierNum] || [];

                return (
                  <div
                    key={tierNum}
                    className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-4 shadow-sm"
                  >
                    {/* Tier Column Header */}
                    <div className="pb-3 border-b border-[var(--border-dim)] space-y-1">
                      <div className="flex items-center justify-between">
                        <span
                          className="badge text-[10px] font-bold"
                          style={{ background: `${meta.color}18`, borderColor: `${meta.color}35`, color: meta.color }}
                        >
                          {meta.badge}
                        </span>
                        <span className="text-[11px] font-mono text-[var(--text-muted)]">
                          {items.length} nodes
                        </span>
                      </div>
                      <h3 className="text-[14px] font-bold text-[var(--text-primary)] font-display">
                        {meta.title}
                      </h3>
                      <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                        {meta.subtitle}
                      </p>
                    </div>

                    {/* Skill Cards */}
                    <div className="space-y-2.5">
                      {items.map(skill => {
                        const state = skillStates[skill.id];
                        const prof = state?.proficiency ?? 0;
                        const prereqsMet = (skill.prerequisites || []).every(p => (skillStates[p]?.proficiency ?? 0) >= 60);
                        const isTarget = targetRoleSkills.has(skill.id);
                        const isSelected = selectedSkill?.id === skill.id;

                        return (
                          <div
                            key={skill.id}
                            onClick={() => setSelectedSkill(skill)}
                            className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left space-y-2 ${
                              isSelected
                                ? 'border-[var(--primary-400)] bg-[rgba(245,158,11,0.08)] ring-1 ring-[var(--primary-400)]'
                                : prof >= 70
                                ? 'border-[rgba(16,185,129,0.35)] bg-[rgba(16,185,129,0.03)] hover:border-[rgba(16,185,129,0.6)]'
                                : prof > 0
                                ? 'border-[rgba(245,158,11,0.35)] bg-[rgba(245,158,11,0.03)] hover:border-[rgba(245,158,11,0.6)]'
                                : prereqsMet
                                ? 'border-[rgba(14,165,233,0.35)] bg-[rgba(14,165,233,0.03)] hover:border-[rgba(14,165,233,0.6)]'
                                : 'border-[var(--border-dim)] bg-[var(--bg-void)] opacity-70 hover:opacity-100'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono text-[var(--text-muted)] truncate max-w-[120px]">
                                {skill.category}
                              </span>
                              {prof >= 70 ? (
                                <span className="badge badge-emerald text-[9px]">
                                  <CheckCircle2 size={8} /> {prof}%
                                </span>
                              ) : prof > 0 ? (
                                <span className="badge badge-amber text-[9px]">
                                  {prof}%
                                </span>
                              ) : prereqsMet ? (
                                <span className="badge badge-cyan text-[9px]">
                                  Ready
                                </span>
                              ) : (
                                <span className="text-[9px] font-mono text-[var(--text-muted)] flex items-center gap-0.5">
                                  <Lock size={8} /> Locked
                                </span>
                              )}
                            </div>

                            <div className="flex items-center justify-between gap-1">
                              <h4 className="font-bold text-[13px] text-[var(--text-primary)] font-display truncate">
                                {skill.name}
                              </h4>
                              {isTarget && (
                                <span className="text-[10px]" title="Goal Required">🎯</span>
                              )}
                            </div>

                            <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)] pt-1 border-t border-[var(--border-dim)]">
                              <span>Diff {skill.difficulty}/5</span>
                              <span>~{skill.estimatedHours}h</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Side Inspector Panel ─────────────────────────────────── */}
        {selectedSkill && (
          <aside className="w-84 h-full bg-[var(--bg-surface)] border-l border-[var(--border-dim)] p-6 flex flex-col justify-between overflow-y-auto animate-slide-right z-20 shadow-2xl">
            <div className="space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-dim)]">
                <span className="text-[11px] font-mono text-[var(--primary-400)] uppercase font-semibold flex items-center gap-1">
                  <Info size={13} /> Node Details
                </span>
                <button
                  onClick={() => setSelectedSkill(null)}
                  className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-raised)] transition-all cursor-pointer"
                  aria-label="Close inspector"
                >
                  <X size={14} />
                </button>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="badge badge-amber text-[9px]">
                    {selectedSkill.category}
                  </span>
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">
                    {TIER_META[skillTiers[selectedSkill.id] ?? 0]?.badge || `Milestone ${(skillTiers[selectedSkill.id] ?? 0) + 1}`}
                  </span>
                  {selectedSkill.isRequired && (
                    <span className="badge badge-emerald text-[9px] font-mono font-bold">
                      🎯 Core Role Target
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-[var(--text-primary)] font-display leading-snug">
                  {selectedSkill.name}
                </h3>
              </div>

              {/* Role Target & Mastery Comparison */}
              <div className="p-4 rounded-xl bg-[var(--bg-void)] border border-[var(--border-dim)] space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--text-muted)] font-mono">Current Mastery</span>
                  <span className="font-mono font-bold text-[var(--primary-300)] text-sm">
                    {skillStates[selectedSkill.id]?.proficiency ?? 0}%
                    <span className="text-[10px] text-[var(--text-muted)] font-normal ml-1">
                      / {selectedSkill.targetProficiency || 75}% Target
                    </span>
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-[var(--bg-surface)] border border-[var(--border-dim)] overflow-hidden">
                  <div
                    className="h-full bg-[var(--primary-500)] rounded-full transition-all"
                    style={{ width: `${Math.min(100, skillStates[selectedSkill.id]?.proficiency ?? 0)}%` }}
                  />
                </div>
                <div className="text-[10px] text-[var(--text-muted)] font-mono flex justify-between">
                  <span>Confidence: {Math.round((skillStates[selectedSkill.id]?.confidence ?? 0.5) * 100)}%</span>
                  <span>Est: ~{selectedSkill.estimatedHours} hrs</span>
                </div>
              </div>

              {/* Prerequisites Check */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider font-mono">
                  Prerequisites Check
                </span>
                {selectedSkill.prerequisites && selectedSkill.prerequisites.length > 0 ? (
                  <div className="space-y-1.5">
                    {selectedSkill.prerequisites.map(p => {
                      const pProf = skillStates[p]?.proficiency ?? 0;
                      const isReady = pProf >= 60;
                      return (
                        <div
                          key={p}
                          className="p-2.5 rounded-lg bg-[var(--bg-void)] border border-[var(--border-dim)] text-xs flex items-center justify-between font-mono"
                        >
                          <span className="text-[var(--text-secondary)]">{p}</span>
                          {isReady ? (
                            <span className="text-[var(--accent-300)] flex items-center gap-1 text-[10px] font-bold">
                              <CheckCircle2 size={11} /> {pProf}% Ready
                            </span>
                          ) : (
                            <span className="text-[#f87171] flex items-center gap-1 text-[10px]">
                              <AlertCircle size={11} /> {pProf}% Required
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-[var(--accent-300)] font-mono p-2.5 rounded-lg bg-[rgba(16,185,129,0.06)] border border-[rgba(16,185,129,0.2)] flex items-center gap-1.5">
                    <CheckCircle2 size={12} /> Foundational Node (No Prerequisites)
                  </p>
                )}
              </div>

              {/* What this node unlocks */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider font-mono">
                  Unlocks Downstream
                </span>
                {unlocksMap[selectedSkill.id]?.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {unlocksMap[selectedSkill.id].map(un => (
                      <span key={un} className="tag text-[10px]">
                        <Unlock size={9} className="text-[var(--accent-300)] inline mr-1" />
                        {un}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-[var(--text-muted)] font-mono">Terminal specialization node</p>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-[var(--border-dim)] space-y-2">
              <button
                onClick={() => navigate('/roadmap')}
                className="btn btn-primary w-full justify-center text-xs py-2.5 flex items-center gap-1.5"
              >
                <Layers size={13} />
                <span>View in Active Roadmap ↗</span>
              </button>
              <button
                onClick={() => navigate('/practice')}
                className="btn btn-secondary w-full justify-center text-xs py-2 flex items-center gap-1.5"
              >
                <BookOpen size={13} />
                <span>Practice in Learning Arena</span>
              </button>
              <button
                onClick={() => setTraceSkillId(selectedSkill.id)}
                className="btn btn-ghost w-full justify-center text-xs py-1.5 text-[var(--text-muted)]"
              >
                <Eye size={13} />
                <span>Inspect Recommendation Trace</span>
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* Trace Modal */}
      {traceSkillId && (
        <RecommendationTraceModal
          skillId={traceSkillId}
          isOpen={Boolean(traceSkillId)}
          onClose={() => setTraceSkillId(null)}
        />
      )}
    </div>
  );
};
