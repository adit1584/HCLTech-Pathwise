import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ShieldCheck, Zap, Activity, Github, ExternalLink, Network, BookOpen, Code2 } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-white/[0.06] bg-[#07090e]/90 backdrop-blur-xl mt-20">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-white/[0.05]">
          
          {/* Brand & Mission */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-950"
                style={{
                  background: 'linear-gradient(135deg, #fbbf24, #d97706)',
                  boxShadow: '0 4px 14px -2px rgba(245,158,11,0.4)',
                }}
              >
                <Compass size={18} className="stroke-[2.4]" />
              </div>
              <span className="text-base font-bold tracking-tight text-white font-display">
                Pathwise <span className="text-amber-400 font-mono text-xs font-normal">COMPILER</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dynamic curriculum DAG compilation engine. Calibrating real-time skill acquisition and shortest-path career mastery.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                DAG Engine <strong className="text-emerald-400">Online</strong>
              </span>
            </div>
          </div>

          {/* Quick Pathways */}
          <div className="space-y-3">
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              Core Engine
            </p>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/dashboard" className="text-slate-400 hover:text-amber-400 transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/roadmap" className="text-slate-400 hover:text-amber-400 transition-colors">
                  Active Roadmap
                </Link>
              </li>
              <li>
                <Link to="/skill-graph" className="text-slate-400 hover:text-amber-400 transition-colors">
                  Skill Graph Visualizer
                </Link>
              </li>
              <li>
                <Link to="/what-if" className="text-slate-400 hover:text-amber-400 transition-colors">
                  What-If Scenario Simulator
                </Link>
              </li>
            </ul>
          </div>

          {/* Learning & Evidence */}
          <div className="space-y-3">
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              Learning & Evidence
            </p>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/courses" className="text-slate-400 hover:text-amber-400 transition-colors">
                  Curated Course Catalog
                </Link>
              </li>
              <li>
                <Link to="/practice" className="text-slate-400 hover:text-amber-400 transition-colors">
                  Interactive Coding Arena
                </Link>
              </li>
              <li>
                <Link to="/diagnostic" className="text-slate-400 hover:text-amber-400 transition-colors">
                  Adaptive Skill Diagnostic
                </Link>
              </li>
              <li>
                <Link to="/passport" className="text-slate-400 hover:text-amber-400 transition-colors">
                  Verifiable Proof Passport
                </Link>
              </li>
            </ul>
          </div>

          {/* System Telemetry */}
          <div className="space-y-3">
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              Platform Standards
            </p>
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2 font-mono text-[11px] text-slate-400">
              <div className="flex justify-between">
                <span>Architecture</span>
                <span className="text-slate-200">Directed Acyclic Graph</span>
              </div>
              <div className="flex justify-between">
                <span>Optimizers</span>
                <span className="text-slate-200">Topological Sort</span>
              </div>
              <div className="flex justify-between">
                <span>Decay Model</span>
                <span className="text-slate-200">Ebbinghaus Retention</span>
              </div>
              <div className="flex justify-between">
                <span>Telemetry</span>
                <span className="text-emerald-400">100% Calibrated</span>
              </div>
            </div>
          </div>

        </div>

        {/* Sub-footer */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-mono">
          <p>© {new Date().getFullYear()} Pathwise AI. Built for the modern technical frontier.</p>
          <div className="flex items-center gap-6">
            <span>Production Grade</span>
            <span>•</span>
            <span>Zero-Drift Architecture</span>
            <span>•</span>
            <span className="text-amber-400/90 font-semibold">International Gold Standard</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
