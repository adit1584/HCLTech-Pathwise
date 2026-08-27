import React, { useState, useEffect } from 'react';

export type BotMood = 'idle' | 'thinking' | 'speaking' | 'happy';

interface CartoonBotAvatarProps {
  mood?: BotMood;
  size?: number;
  interactive?: boolean;
  className?: string;
}

export const CartoonBotAvatar: React.FC<CartoonBotAvatarProps> = ({
  mood = 'idle',
  size = 48,
  interactive = true,
  className = '',
}) => {
  const [blink, setBlink] = useState(false);
  const [poked, setPoked] = useState(false);

  // Periodic natural eye blinking
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 160);
    }, 4000);
    return () => clearInterval(blinkInterval);
  }, []);

  const handlePoke = () => {
    if (!interactive) return;
    setPoked(true);
    setTimeout(() => setPoked(false), 500);
  };

  return (
    <div
      onClick={handlePoke}
      className={`relative inline-flex items-center justify-center select-none transition-transform duration-300 ${
        interactive ? 'cursor-pointer hover:scale-105 active:scale-95' : ''
      } ${poked ? 'scale-110 -rotate-6' : ''} ${className}`}
      style={{ width: size, height: size }}
      title={interactive ? 'Pathy AI Companion (Click to poke!)' : 'Pathy AI'}
    >
      {/* ── Ambient Radiant Aura ── */}
      <div
        className={`absolute inset-0 rounded-full blur-md transition-all duration-500 pointer-events-none ${
          mood === 'speaking'
            ? 'bg-cyan-500/30 scale-125 animate-pulse'
            : mood === 'thinking'
            ? 'bg-amber-500/30 scale-120 animate-pulse'
            : 'bg-indigo-500/20 scale-100'
        }`}
      />

      {/* ── High-Fidelity SVG Robot Companion ── */}
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full relative overflow-visible drop-shadow-md"
      >
        <defs>
          <linearGradient id="headGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#090d16" />
          </linearGradient>

          <linearGradient id="visorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#030712" />
            <stop offset="100%" stopColor="#0c1322" />
          </linearGradient>

          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="60%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>

          <linearGradient id="cyanEyeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#67e8f9" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>

        {/* ── Floating Headphone Fins ── */}
        <rect x="10" y="44" width="8" height="20" rx="4" fill="url(#goldGrad)" />
        <rect x="82" y="44" width="8" height="20" rx="4" fill="url(#goldGrad)" />

        {/* ── Antenna Beacon ── */}
        <line x1="50" y1="18" x2="50" y2="28" stroke="#64748b" strokeWidth="3" strokeLinecap="round" />
        <circle
          cx="50"
          cy="15"
          r="6"
          fill="url(#goldGrad)"
          className={mood === 'speaking' || mood === 'thinking' ? 'animate-pulse' : ''}
        />
        <circle cx="48.5" cy="13.5" r="2" fill="#ffffff" opacity="0.8" />

        {/* ── Main Outer Helmet ── */}
        <rect
          x="16"
          y="26"
          width="68"
          height="58"
          rx="18"
          fill="url(#headGrad)"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="2"
        />

        {/* ── Glossy Inner Visor ── */}
        <rect
          x="23"
          y="33"
          width="54"
          height="44"
          rx="12"
          fill="url(#visorGrad)"
          stroke="rgba(56,189,248,0.3)"
          strokeWidth="1.5"
        />

        {/* ── Cute Pink Cheek Blushes ── */}
        <ellipse
          cx="30"
          cy="64"
          rx="3.5"
          ry="2"
          fill="#f43f5e"
          opacity={mood === 'speaking' || mood === 'happy' ? 0.8 : 0.3}
        />
        <ellipse
          cx="70"
          cy="64"
          rx="3.5"
          ry="2"
          fill="#f43f5e"
          opacity={mood === 'speaking' || mood === 'happy' ? 0.8 : 0.3}
        />

        {/* ── Animated Eyes ── */}
        {blink ? (
          // Blinking eyes
          <g stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round">
            <line x1="33" y1="48" x2="43" y2="48" />
            <line x1="57" y1="48" x2="67" y2="48" />
          </g>
        ) : mood === 'happy' ? (
          // Happy curved eyes (^_^)
          <g stroke="#38bdf8" strokeWidth="2.8" strokeLinecap="round" fill="none">
            <path d="M 33 50 Q 38 43 43 50" />
            <path d="M 57 50 Q 62 43 67 50" />
          </g>
        ) : mood === 'thinking' ? (
          // Thinking scanning eyes
          <g>
            <circle cx="38" cy="48" r="6" fill="#0f172a" stroke="#f59e0b" strokeWidth="2" />
            <circle cx="38" cy="48" r="3" fill="#fbbf24" className="animate-ping" />
            <circle cx="62" cy="48" r="6" fill="#0f172a" stroke="#f59e0b" strokeWidth="2" />
            <circle cx="62" cy="48" r="3" fill="#fbbf24" className="animate-ping" />
          </g>
        ) : (
          // Standard / Speaking glowing eyes
          <g>
            <circle cx="38" cy="47" r="6" fill="url(#cyanEyeGrad)" />
            <circle cx="36.5" cy="45.5" r="2" fill="#ffffff" />
            <circle cx="62" cy="47" r="6" fill="url(#cyanEyeGrad)" />
            <circle cx="60.5" cy="45.5" r="2" fill="#ffffff" />
          </g>
        )}

        {/* ── Animated Mouth ── */}
        {mood === 'speaking' ? (
          // Dynamic soundwave talking mouth
          <g className="animate-pulse">
            <rect x="42" y="60" width="16" height="6" rx="3" fill="#38bdf8" />
          </g>
        ) : mood === 'thinking' ? (
          // Concentrating zigzag mouth
          <path
            d="M 43 63 L 46 60 L 50 64 L 54 60 L 57 63"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : mood === 'happy' ? (
          // Big smile
          <path
            d="M 42 59 Q 50 68 58 59"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        ) : (
          // Gentle cute smile
          <path
            d="M 44 61 Q 50 66 56 61"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2"
            strokeLinecap="round"
          />
        )}
      </svg>
    </div>
  );
};
