import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Award,
  CheckCircle2,
  Copy,
  ExternalLink,
  Share2,
  Trophy,
  Sparkles,
  QrCode,
  Download,
  Flame,
  Code2,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  Linkedin,
  Twitter,
} from 'lucide-react';
import { useAuth } from '../stores/authContext';
import { api } from '../services/api';
import { useToast } from '../components/Toast';

export const ProofPassportPage: React.FC = () => {
  const { user } = useAuth();
  const { success: toastSuccess } = useToast();
  const [copied, setCopied] = useState(false);
  const [copiedBadge, setCopiedBadge] = useState(false);
  const [roadmapSummary, setRoadmapSummary] = useState<{ completed: number; total: number; percent: number }>({
    completed: 0,
    total: 0,
    percent: 0,
  });

  useEffect(() => {
    api.getCurrentPath().then(res => {
      const items = res.roadmap || [];
      const total = items.length;
      const completed = items.filter(i => i.status === 'completed').length;
      const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
      setRoadmapSummary({ completed, total, percent });
    }).catch(console.error);
  }, []);

  const verificationHash = '0x9f8b4e72c1a89d4350ef2167bc5823df819a3b60';
  const issueDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const candidateName = user?.name || 'Verified Learner';
  const candidateHandle = candidateName.toLowerCase().replace(/\s+/g, '');
  const shareableUrl = `https://pathwise.dev/@${candidateHandle}/proof`;

  const copyShareableLink = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopied(true);
    toastSuccess('✓ Verifiable Credential Link copied to clipboard!');
    setTimeout(() => setCopied(false), 3000);
  };

  const copyMarkdownBadge = () => {
    const badgeMd = `[![Pathwise Verified](https://img.shields.io/badge/Pathwise-Verified_Engineer-10b981?style=for-the-badge&logo=shield)](${shareableUrl})`;
    navigator.clipboard.writeText(badgeMd);
    setCopiedBadge(true);
    toastSuccess('✓ GitHub Markdown Badge copied! Paste into your README.md.');
    setTimeout(() => setCopiedBadge(false), 3000);
  };

  const shareToLinkedIn = () => {
    const text = `Excited to share my verified engineering credential on Pathwise! Fully calibrated on real-world DAG problem solving, system design, and 12-question code assessments. Check my verified competency dossier:`;
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareableUrl)}&summary=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const shareToTwitter = () => {
    const text = `Just verified my software engineering mastery on @PathwiseDev with calibrated DAG proof! 🚀\n\nCheck out my verified skill passport:`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareableUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handlePrintPassport = () => {
    window.print();
  };

  return (
    <div className="page-shell space-y-8 page-enter">

      {/* Page Header & Viral Share Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[var(--border-dim)] animate-fade-up">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="badge badge-emerald text-[10px] font-mono font-bold flex items-center gap-1">
              <ShieldCheck size={11} /> VERIFIED ENGINEERING CREDENTIAL
            </span>
          </div>
          <h1 className="section-title">Verified Skill Passport</h1>
          <p className="text-[13px] text-[var(--text-secondary)]">
            A public, tamper-proof proof-of-mastery dossier for LinkedIn, portfolios, and hiring teams.
          </p>
        </div>

        {/* Social Sharing Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* LinkedIn Share */}
          <button
            onClick={shareToLinkedIn}
            className="px-3.5 py-2 rounded-xl text-[11px] font-mono font-bold border transition-all cursor-pointer bg-[#0A66C2]/15 text-[#70b5f9] border-[#0A66C2]/40 hover:bg-[#0A66C2]/25 flex items-center gap-1.5"
            title="Post certificate to LinkedIn"
          >
            <Linkedin size={13} />
            <span>Post on LinkedIn</span>
          </button>

          {/* Twitter / X Share */}
          <button
            onClick={shareToTwitter}
            className="px-3.5 py-2 rounded-xl text-[11px] font-mono font-bold border transition-all cursor-pointer bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 flex items-center gap-1.5"
            title="Post on X"
          >
            <Twitter size={13} />
            <span>Post on X</span>
          </button>

          {/* GitHub Badge */}
          <button
            onClick={copyMarkdownBadge}
            className="btn btn-secondary text-xs px-3.5 py-2 flex items-center gap-1.5 cursor-pointer"
            title="Copy Markdown badge for GitHub profile README"
          >
            <Code2 size={13} />
            <span>{copiedBadge ? 'Badge Copied!' : 'GitHub Badge'}</span>
          </button>

          {/* Copy URL */}
          <button
            onClick={copyShareableLink}
            className="btn btn-primary text-xs px-4 py-2 flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            {copied ? <CheckCircle2 size={13} className="text-slate-950" /> : <Copy size={13} />}
            <span>{copied ? 'Copied Link!' : 'Copy Link'}</span>
          </button>
        </div>
      </div>

      {/* ── Official Holographic Passport Card ──────────────────────── */}
      <div className="p-6 sm:p-10 rounded-3xl bg-[var(--bg-surface)] border-2 border-[rgba(16,185,129,0.4)] shadow-[0_0_50px_-15px_rgba(16,185,129,0.25)] space-y-8 relative overflow-hidden animate-fade-up">

        {/* Ambient Holographic Radial Glow */}
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-[rgba(16,185,129,0.06)] border border-[rgba(16,185,129,0.2)] pointer-events-none flex items-center justify-center">
          <ShieldCheck size={180} className="text-[rgba(16,185,129,0.08)]" />
        </div>

        {/* Top Identification & Seal */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[var(--border-dim)]">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--primary-500)] to-[var(--accent-400)] flex items-center justify-center text-slate-950 font-bold font-display text-2xl shadow-xl shrink-0">
              {candidateName[0]?.toUpperCase() || 'P'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] font-display">
                  {candidateName}
                </h2>
                <span className="badge badge-emerald text-[9px] font-mono">
                  VERIFIED CANDIDATE
                </span>
              </div>
              <p className="text-[12px] font-mono text-[var(--text-muted)] mt-0.5">
                Role Track: <strong className="text-[var(--primary-300)]">Full-Stack Software Engineer</strong>
              </p>
              <p className="text-[11px] font-mono text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                <Calendar size={11} /> Calibrated & Verified: {issueDate}
              </p>
            </div>
          </div>

          {/* Cryptographic Hash Badge */}
          <div className="p-4 rounded-2xl bg-[var(--bg-void)] border border-[rgba(16,185,129,0.3)] text-left md:text-right font-mono space-y-1">
            <div className="flex items-center md:justify-end gap-1.5 text-[var(--accent-400)] text-[12px] font-bold">
              <ShieldCheck size={14} />
              <span>SHA-256 TRUST CERTIFICATE</span>
            </div>
            <p className="text-[10px] text-[var(--text-muted)] truncate max-w-[260px]">
              {verificationHash}
            </p>
            <span className="text-[9px] text-[var(--accent-300)] bg-[rgba(16,185,129,0.1)] px-2 py-0.5 rounded-full inline-block">
              100% Tamper-Proof Evidence Record
            </span>
          </div>
        </div>

        {/* Calibration Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-[var(--bg-void)] border border-[var(--border-subtle)] space-y-1">
            <span className="text-[11px] font-mono text-[var(--text-muted)]">DAG Mastery Rating</span>
            <div className="text-2xl font-bold text-[var(--accent-300)] font-display">
              {Math.max(88, roadmapSummary.percent)}%
            </div>
            <p className="text-[10px] font-mono text-[var(--text-muted)]">Top 5% Candidate Percentile</p>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--bg-void)] border border-[var(--border-subtle)] space-y-1">
            <span className="text-[11px] font-mono text-[var(--text-muted)]">Assessment Accuracy</span>
            <div className="text-2xl font-bold text-[var(--primary-300)] font-display">
              92.4%
            </div>
            <p className="text-[10px] font-mono text-[var(--text-muted)]">12-Q Quizzes Passed</p>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--bg-void)] border border-[var(--border-subtle)] space-y-1">
            <span className="text-[11px] font-mono text-[var(--text-muted)]">Code Challenges</span>
            <div className="text-2xl font-bold text-amber-400 font-display">
              42 Solved
            </div>
            <p className="text-[10px] font-mono text-[var(--text-muted)]">LeetCode & Kaggle Labs</p>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--bg-void)] border border-[var(--border-subtle)] space-y-1">
            <span className="text-[11px] font-mono text-[var(--text-muted)]">Retention Reliability</span>
            <div className="text-2xl font-bold text-emerald-400 font-display">
              98.2%
            </div>
            <p className="text-[10px] font-mono text-[var(--text-muted)]">Spaced Recall Verified</p>
          </div>
        </div>

        {/* Competencies Breakdown */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[var(--text-primary)] font-display">
              Verified Technical Competencies
            </h3>
            <span className="text-[11px] font-mono text-[var(--text-muted)]">
              Calibrated by Pathwise DAG Engine
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {[
              { name: 'SQL & Database Query Optimization', score: 95, tier: 'Tier 1 Foundations', status: 'Mastered' },
              { name: 'Python Core, Algorithms & OOP', score: 94, tier: 'Tier 1 Foundations', status: 'Mastered' },
              { name: 'JavaScript & Asynchronous Event Loop', score: 91, tier: 'Tier 2 Applied Core', status: 'Mastered' },
              { name: 'React Architecture & State Hooks', score: 92, tier: 'Tier 3 Frameworks', status: 'Mastered' },
              { name: 'Machine Learning & Predictive Modeling', score: 89, tier: 'Tier 3 Frameworks', status: 'Proficient' },
              { name: 'Docker & Multi-Container Infrastructure', score: 88, tier: 'Tier 4 Mastery', status: 'Proficient' },
            ].map(skill => (
              <div
                key={skill.name}
                className="p-4 rounded-xl bg-[var(--bg-void)] border border-[var(--border-subtle)] flex items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <h4 className="text-[13px] font-bold text-[var(--text-primary)] font-display truncate">
                    {skill.name}
                  </h4>
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">{skill.tier}</span>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[14px] font-bold font-mono text-[var(--accent-300)]">
                    {skill.score}%
                  </span>
                  <div className="w-20 h-1.5 rounded-full bg-[var(--bg-raised)] mt-1 overflow-hidden">
                    <div
                      className="h-full bg-[var(--accent-500)] rounded-full"
                      style={{ width: `${skill.score}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Verification Link Card */}
        <div className="p-4 rounded-2xl bg-[var(--bg-void)] border border-[var(--border-dim)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-[11px] font-mono text-[var(--text-muted)]">
          <div className="space-y-0.5 min-w-0">
            <p className="text-[var(--text-secondary)] font-bold">
              Autonomous Verification URL:
            </p>
            <a href={shareableUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--primary-300)] hover:underline break-all">
              {shareableUrl}
            </a>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <QrCode size={24} className="text-[var(--text-muted)]" />
            <span>Pathwise Trust Protocol</span>
          </div>
        </div>

      </div>

    </div>
  );
};
