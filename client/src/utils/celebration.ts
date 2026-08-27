// ============================================================
// Pathwise Celebration & Audio Synthesizer Engine
// High-performance Canvas Confetti & Web Audio Fanfare
// ============================================================

/**
 * Plays a warm, celebratory victory arpeggio chord using Web Audio API
 */
export function playVictoryChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const notes = [
      { freq: 523.25, time: 0.00 }, // C5
      { freq: 659.25, time: 0.10 }, // E5
      { freq: 783.99, time: 0.20 }, // G5
      { freq: 1046.50, time: 0.32 }, // C6
      { freq: 1318.51, time: 0.45 }, // E6
    ];

    notes.forEach(({ freq, time }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + time);

      gain.gain.setValueAtTime(0, ctx.currentTime + time);
      gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + time + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + time + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + time);
      osc.stop(ctx.currentTime + time + 0.65);
    });
  } catch {
    // Ignore audio permission or autoplay restrictions
  }
}

/**
 * Fires an exuberant, joyful confetti particle burst onto the viewport
 */
export function triggerConfetti(durationMs: number = 3000) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '99999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    document.body.removeChild(canvas);
    return;
  }

  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.scale(dpr, dpr);

  const colors = [
    '#f59e0b', // Amber / Gold
    '#10b981', // Emerald
    '#0ea5e9', // Cyan
    '#a855f7', // Purple
    '#f43f5e', // Rose
    '#fbbf24', // Yellow Gold
    '#38bdf8', // Sky Blue
  ];

  interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    rotation: number;
    rotationSpeed: number;
    shape: 'rect' | 'circle' | 'star';
    opacity: number;
  }

  const particles: Particle[] = [];
  const particleCount = 140;

  for (let i = 0; i < particleCount; i++) {
    const isLeft = i % 2 === 0;
    particles.push({
      x: isLeft ? window.innerWidth * 0.2 + (Math.random() * 80 - 40) : window.innerWidth * 0.8 + (Math.random() * 80 - 40),
      y: window.innerHeight * 0.65 + (Math.random() * 60 - 30),
      vx: (isLeft ? 1 : -1) * (Math.random() * 12 + 6) + (Math.random() * 6 - 3),
      vy: -(Math.random() * 16 + 12),
      size: Math.random() * 9 + 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.25,
      shape: Math.random() > 0.4 ? 'rect' : Math.random() > 0.5 ? 'circle' : 'star',
      opacity: 1,
    });
  }

  let animationFrameId: number;
  const startTime = Date.now();

  function render() {
    if (!ctx) return;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    const elapsed = Date.now() - startTime;
    const progress = elapsed / durationMs;

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.45; // gravity
      p.vx *= 0.98; // air resistance
      p.rotation += p.rotationSpeed;
      if (progress > 0.7) {
        p.opacity = Math.max(0, 1 - (progress - 0.7) / 0.3);
      }

      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;

      if (p.shape === 'rect') {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      } else if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Mini star
        ctx.beginPath();
        ctx.moveTo(0, -p.size / 2);
        ctx.lineTo(p.size / 4, -p.size / 6);
        ctx.lineTo(p.size / 2, 0);
        ctx.lineTo(p.size / 4, p.size / 6);
        ctx.lineTo(0, p.size / 2);
        ctx.lineTo(-p.size / 4, p.size / 6);
        ctx.lineTo(-p.size / 2, 0);
        ctx.lineTo(-p.size / 4, -p.size / 6);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    });

    if (elapsed < durationMs) {
      animationFrameId = requestAnimationFrame(render);
    } else {
      if (canvas.parentNode) {
        document.body.removeChild(canvas);
      }
    }
  }

  animationFrameId = requestAnimationFrame(render);
}
