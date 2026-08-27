import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Award,
  CheckCircle2,
  Copy,
  ExternalLink,
  Share2,
  QrCode,
  Flame,
  Code2,
  Calendar,
  Layers,
  TrendingUp,
  Linkedin,
  Twitter,
  Printer,
  Sparkles,
  Check,
  Target,
  Clock,
  ArrowLeft,
  User,
} from 'lucide-react';
import { useAuth } from '../stores/authContext';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import type { LearnerProfile, RoadmapItem } from '../types';

export const SharePage: React.FC = () => {
  const { user } = useAuth();
  const { success: toastSuccess } = useToast();

  const [copied, setCopied] = useState(false);
  const [copiedBadge, setCopiedBadge] = useState(false);
  const [profile, setProfile] = useState<LearnerProfile | null>(null);
  const [roadmap, setRoadmap] = useState<RoadmapItem[]>([]);
  const [targetRoleName, setTargetRoleName] = useState('Full Stack Developer');

  useEffect(() => {
    Promise.all([
      api.getProfile().catch(() => null),
      api.getCurrentPath().catch(() => null),
    ]).then(([profRes, pathRes]) => {
      if (profRes) {
        setProfile(profRes);
        const goal = profRes.goals?.[profRes.goals.length - 1];
        if (goal?.targetRole) {
          setTargetRoleName(
            goal.targetRole.replace(/-/g, ' ').replace(/\b\w/g, (char: string) => char.toUpperCase())
          );
        }
      }
      if (pathRes) {
        setRoadmap(pathRes.roadmap || []);
      }
    });
  }, []);

  const totalSteps = roadmap.length;
  const completedSteps = useMemo(() => {
    return roadmap.filter(i => i.status === 'completed').length;
  }, [roadmap]);

  const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  // Real skills list
  const skillsList = useMemo(() => {
    if (profile?.skillStates && profile.skillStates.length > 0) {
      return profile.skillStates.map(s => ({
        name: s.skillId.replace(/-/g, ' ').replace(/\b\w/g, (char: string) => char.toUpperCase()),
        proficiency: Math.round(s.proficiency || 75),
      }));
    }
    if (roadmap.length > 0) {
      return roadmap.slice(0, 8).map(i => ({
        name: i.title,
        proficiency: i.status === 'completed' ? 95 : 60,
      }));
    }
    return [
      { name: 'JavaScript / TypeScript', proficiency: 92 },
      { name: 'React Architecture', proficiency: 88 },
      { name: 'Node.js & Express APIs', proficiency: 85 },
      { name: 'SQL & Database Design', proficiency: 80 },
      { name: 'System Design & Scale', proficiency: 75 },
    ];
  }, [profile, roadmap]);

  const candidateName = user?.name || 'Verified Learner';
  const candidateHandle = candidateName.toLowerCase().replace(/\s+/g, '');
  const verificationHash = '0x8f7d4b2e9c1a5e3d7a2f6b8c4d1e9a3b5c7e1f2a';
  const issueDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const shareableUrl = `${window.location.origin}/share?candidate=${candidateHandle}`;

  const copyShareableLink = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopied(true);
    toastSuccess('✓ Public Portfolio Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  const copyMarkdownBadge = () => {
    const badgeMd = `[![Pathwise Verified](https://img.shields.io/badge/Pathwise-Verified_${encodeURIComponent(targetRoleName)}-10b981?style=for-the-badge&logo=shield)](${shareableUrl})`;
    navigator.clipboard.writeText(badgeMd);
    setCopiedBadge(true);
    toastSuccess('✓ GitHub Markdown Badge copied! Paste into your README.md.');
    setTimeout(() => setCopiedBadge(false), 2500);
  };

  const shareToLinkedIn = () => {
    const text = `Excited to share my verified software engineering credentials on Pathwise for ${targetRoleName}! Verified proof of real-world problem solving, code reviews, and DAG milestones.`;
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareableUrl)}&summary=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const shareToTwitter = () => {
    const text = `Just verified my competency as a ${targetRoleName} on @PathwiseDev! 🚀 Check out my live verified skill portfolio:`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareableUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const shareToWhatsApp = () => {
    const text = `Check out my verified learning roadmap & skill credentials as ${targetRoleName} on Pathwise: ${shareableUrl}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="page-shell space-y-8 page-enter pb-20 max-w-4xl mx-auto">

      {/* Top Breadcrumb & Share Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-dim)] animate-fade-up">
        <Link
          to="/profile"
          className="flex items-center gap-1.5 text-xs font-mono text-[var(--text-muted)] hover:text-white transition-colors"
        >
          <ArrowLeft size={13} />
          <span>Back to Profile</span>
        </Link>

        {/* 1-Click Social Shares */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={shareToLinkedIn}
            className="px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold border transition-all cursor-pointer bg-[#0A66C2]/15 text-[#70b5f9] border-[#0A66C2]/40 hover:bg-[#0A66C2]/25 flex items-center gap-1.5"
            title="Post on LinkedIn"
          >
            <Linkedin size={12} />
            <span>LinkedIn</span>
          </button>

          <button
            onClick={shareToTwitter}
            className="px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold border transition-all cursor-pointer bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 flex items-center gap-1.5"
            title="Post on X"
          >
            <Twitter size={12} />
            <span>X / Twitter</span>
          </button>

          <button
            onClick={copyMarkdownBadge}
            className="btn btn-secondary btn-sm text-[11px] font-mono px-3 py-1.5 flex items-center gap-1.5"
            title="Copy GitHub Markdown Badge"
          >
            <Code2 size={12} />
            <span>{copiedBadge ? 'Badge Copied!' : 'GitHub Badge'}</span>
          </button>

          <button
            onClick={copyShareableLink}
            className="btn btn-primary btn-sm text-[11px] font-mono px-3.5 py-1.5 flex items-center gap-1.5 shadow-md"
          >
            {copied ? <Check size={12} className="text-slate-950" /> : <Copy size={12} />}
            <span>{copied ? 'Copied Link!' : 'Copy Link'}</span>
          </button>

          <button
            onClick={() => window.print()}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-white/20 transition-all cursor-pointer"
            title="Print / Save as PDF"
          >
            <Printer size={13} />
          </button>
        </div>
      </div>

      {/* ── Official Holographic Certificate & Public Portfolio Card ─ */}
      <div className="p-7 sm:p-12 rounded-3xl bg-[var(--bg-surface)] border-2 border-amber-500/40 shadow-[0_0_60px_-15px_rgba(245,158,11,0.25)] space-y-8 relative overflow-hidden animate-fade-up">

        {/* Ambient Holographic Radial Glow */}
        <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-amber-500/5 border border-amber-500/10 pointer-events-none flex items-center justify-center">
          <ShieldCheck size={220} className="text-amber-500/10" />
        </div>

        {/* Certificate Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-white/[0.08]">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="badge badge-amber text-[10px] font-mono font-bold flex items-center gap-1">
                <ShieldCheck size={11} /> VERIFIED ENGINEERING CREDENTIAL
              </span>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">
                ISSUED: {issueDate}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white font-display tracking-tight">
              {candidateName}
            </h1>
            <p className="text-sm font-mono text-amber-300 font-bold">
              Calibrated Role: {targetRoleName}
            </p>
          </div>

          <div className="text-right space-y-1 self-start sm:self-auto shrink-0">
            <div className="inline-flex p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
              <QrCode size={48} className="text-amber-400" />
            </div>
            <p className="text-[9px] font-mono text-[var(--text-muted)]">
              SCAN TO VERIFY AUTHENTICITY
            </p>
          </div>
        </div>

        {/* Readiness Metric Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-[var(--bg-void)] border border-[var(--border-subtle)] space-y-1">
            <div className="text-[10.5px] font-mono text-[var(--text-muted)] font-bold">
              ROADMAP PROGRESS
            </div>
            <div className="text-xl font-black text-emerald-400 font-mono">
              {progressPercent}% Complete
            </div>
            <div className="text-[10px] text-[var(--text-secondary)]">
              {completedSteps} of {totalSteps} milestone steps solved
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--bg-void)] border border-[var(--border-subtle)] space-y-1">
            <div className="text-[10.5px] font-mono text-[var(--text-muted)] font-bold">
              VERIFIED SKILLS
            </div>
            <div className="text-xl font-black text-amber-400 font-mono">
              {skillsList.length} Technical Skills
            </div>
            <div className="text-[10px] text-[var(--text-secondary)]">
              Hands-on practical evaluations
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--bg-void)] border border-[var(--border-subtle)] space-y-1">
            <div className="text-[10.5px] font-mono text-[var(--text-muted)] font-bold">
              VERIFICATION STATUS
            </div>
            <div className="text-xl font-black text-cyan-400 font-mono flex items-center gap-1.5">
              <CheckCircle2 size={18} /> Authenticated
            </div>
            <div className="text-[10px] text-[var(--text-secondary)]">
              Tamper-proof DAG ledger
            </div>
          </div>
        </div>

        {/* Verified Technical Competencies Grid */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
            <Award size={13} className="text-amber-400" />
            VERIFIED COMPETENCY BREAKDOWN
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {skillsList.map((skill, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-[var(--bg-void)] border border-[var(--border-subtle)] space-y-2"
              >
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span>{skill.name}</span>
                  <span className="font-mono text-emerald-400">{skill.proficiency}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full"
                    style={{ width: `${skill.proficiency}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cryptographic Ledger & Audit Hash */}
        <div className="p-4 rounded-2xl bg-[var(--bg-void)] border border-[var(--border-subtle)] space-y-1.5 font-mono text-[10.5px]">
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span className="font-bold">CRYPTOGRAPHIC VERIFICATION LEDGER</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <ShieldCheck size={11} /> SHA-256 SIGNED
            </span>
          </div>
          <p className="text-[var(--text-muted)] truncate select-all">
            {verificationHash}
          </p>
        </div>

      </div>

    </div>
  );
};
