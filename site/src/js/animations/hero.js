/**
 * Hero — CNC Laser reveal (global sweep top → bottom)
 *
 * A single laser dot sweeps the entire hero-inner from top to bottom,
 * zigzagging horizontally (like a CNC head on its rail).
 * ALL elements are revealed simultaneously as the laser passes.
 */

import { gsap } from './index.js';

const ROW_HEIGHT = 35;

// ---- Spark object pool (zero allocation during animation) ----
const POOL_SIZE = 200;
const sparkPool = [];
for (let i = 0; i < POOL_SIZE; i++) {
  sparkPool.push({ x: 0, y: 0, vx: 0, vy: 0, life: 0, age: 0, size: 0, active: false });
}

function acquireSpark(x, y, vx, vy, life, size) {
  for (let i = 0; i < POOL_SIZE; i++) {
    if (!sparkPool[i].active) {
      const s = sparkPool[i];
      s.x = x; s.y = y; s.vx = vx; s.vy = vy;
      s.life = life; s.age = 0; s.size = size; s.active = true;
      return s;
    }
  }
  return null;
}

export async function initHeroAnimation() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    gsap.set('.hero-inner > *', { opacity: 1, clearProps: 'willChange' });
    return;
  }

  const inner = document.querySelector('.hero-inner');
  if (!inner) return;

  // Wait for the page to be fully rendered
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  await new Promise((r) => setTimeout(r, 200));

  // Skip if scrolled past hero
  if (window.scrollY > window.innerHeight * 0.3) {
    gsap.set('.hero-inner > *', { opacity: 1 });
    return;
  }

  const accent =
    getComputedStyle(document.documentElement)
      .getPropertyValue('--color-accent').trim() || '#8b5cf6';

  // Detect Safari (no canvas sparks — WebKit can't handle clipPath + canvas simultaneously)
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  // Pause glowDrift CSS animation during CNC (reduce GPU contention)
  const glow = document.querySelector('.hero-glow');
  if (glow) glow.style.animationPlayState = 'paused';

  // Collect elements to reveal
  const elements = [];
  const selectors = [
    '.hero-brand', '.hero-tagline', '.hero-title',
    '.hero-subtitle', '.hero-actions', '.hero-badge',
  ];
  for (const sel of selectors) {
    const el = inner.querySelector(sel);
    if (el) elements.push(el);
  }
  if (!elements.length) return;

  // Make all elements visible — the parent will be clipped instead
  for (const el of elements) {
    gsap.set(el, { opacity: 1 });
  }

  // Mask the parent container — use CSS mask on Safari (GPU-composited) or clipPath elsewhere
  if (isSafari) {
    inner.style.webkitMaskImage = 'linear-gradient(to bottom, black 0%, transparent 0%)';
  } else {
    gsap.set(inner, { clipPath: 'inset(0 0 100% 0)' });
  }

  // Force reflow to ensure rects are accurate
  inner.offsetHeight;

  const innerRect = inner.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const sparkMargin = 80;
  const numRows = Math.max(Math.ceil(innerRect.height / ROW_HEIGHT), 1);
  const durationMs = Math.max(1500, numRows * 80);
  const durationSec = durationMs / 1000;

  // Laser dot — position absolute inside hero instead of fixed on body
  const dot = document.createElement('div');
  dot.style.cssText = [
    'position:absolute', 'left:0', 'top:0',
    'width:8px', 'height:8px',
    'border-radius:50%', 'background:#fff',
    `box-shadow:0 0 4px 2px #fff, 0 0 10px 4px ${accent}, 0 0 25px 8px ${accent}50, 0 0 45px 12px ${accent}20`,
    'pointer-events:none', 'z-index:10001',
    'will-change:transform',
  ].join(';');
  inner.appendChild(dot);

  // Spark canvas — only on non-Safari browsers
  const cw = innerRect.width + sparkMargin * 2;
  const ch = innerRect.height + sparkMargin * 2;
  let sparkCanvas = null;
  let sCtx = null;

  if (!isSafari) {
    sparkCanvas = document.createElement('canvas');
    sparkCanvas.width = cw * dpr;
    sparkCanvas.height = ch * dpr;
    sparkCanvas.style.cssText = [
      'position:absolute',
      `left:${-sparkMargin}px`,
      `top:${-sparkMargin}px`,
      `width:${cw}px`, `height:${ch}px`,
      'pointer-events:none', 'z-index:10000',
    ].join(';');
    inner.appendChild(sparkCanvas);
    sCtx = sparkCanvas.getContext('2d');
    sCtx.scale(dpr, dpr);
  }

  // Pre-compute offsets relative to inner (not viewport)
  const innerTop = innerRect.top;
  const innerLeft = innerRect.left;

  // ---- GSAP-driven animation ----
  return new Promise((resolve) => {
    const state = { progress: 0 };

    // Separate canvas render loop (only on non-Safari)
    let canvasRunning = !isSafari;
    if (!isSafari) {
      function renderSparks() {
        if (!canvasRunning) return;
        sCtx.clearRect(0, 0, cw, ch);
        for (let i = 0; i < POOL_SIZE; i++) {
          const s = sparkPool[i];
          if (!s.active) continue;
          const t = s.age / s.life;
          sCtx.globalAlpha = (1 - t) * (1 - t);
          sCtx.fillStyle = t < 0.3 ? '#fff' : accent;
          sCtx.beginPath();
          sCtx.arc(s.x, s.y, s.size * (1 - t * 0.5), 0, Math.PI * 2);
          sCtx.fill();
        }
        sCtx.globalAlpha = 1;
        requestAnimationFrame(renderSparks);
      }
      requestAnimationFrame(renderSparks);
    }

    const tween = gsap.to(state, {
      progress: 1,
      duration: durationSec,
      ease: 'none',
      paused: true,
      onUpdate: () => {
        const progress = state.progress;

        // Laser position
        const rowProgress = progress * numRows;
        const currentRow = Math.min(Math.floor(rowProgress), numRows - 1);
        const withinRow = Math.min(rowProgress - currentRow, 1);
        const goingRight = currentRow % 2 === 0;

        const laserVpY = innerTop + Math.min((currentRow + 0.5) * ROW_HEIGHT, innerRect.height);
        const laserVpX = goingRight
          ? innerLeft + withinRow * innerRect.width
          : innerLeft + (1 - withinRow) * innerRect.width;

        // Position relative to inner
        const dotX = laserVpX - innerLeft - 4;
        const dotY = laserVpY - innerTop - 4;
        dot.style.transform = `translate(${dotX}px, ${dotY}px)`;

        // Spark position in canvas coords
        const sparkX = sparkMargin + (laserVpX - innerLeft);
        const sparkY = sparkMargin + (laserVpY - innerTop);

        // Reveal — mask on Safari (GPU), clipPath elsewhere
        const revealPx = laserVpY - innerTop;
        const revealPct = Math.max(0, Math.min((revealPx / innerRect.height) * 100, 100));
        if (isSafari) {
          inner.style.webkitMaskImage = `linear-gradient(to bottom, black ${revealPct}%, transparent ${revealPct}%)`;
        } else {
          inner.style.clipPath = `inset(0 0 ${Math.max(100 - revealPct, 0)}% 0)`;
        }

        // Dot fade at end
        if (progress > 0.93) {
          dot.style.opacity = String(Math.max(0, (1 - progress) / 0.07));
        }

        // Emit sparks (only on non-Safari)
        if (!isSafari && progress < 0.95) {
          const count = 2 + Math.floor(Math.random() * 2);
          for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 30 + Math.random() * 80;
            acquireSpark(
              sparkX, sparkY,
              Math.cos(angle) * speed, Math.sin(angle) * speed,
              0.1 + Math.random() * 0.25,
              0.5 + Math.random() * 1.5
            );
          }
        }

        // Update sparks physics (only on non-Safari)
        if (isSafari) return;
        const dt = 0.016;
        for (let i = 0; i < POOL_SIZE; i++) {
          const s = sparkPool[i];
          if (!s.active) continue;
          s.age += dt;
          if (s.age >= s.life) { s.active = false; continue; }
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          s.vy += 40 * dt;
        }
      },
      onComplete: () => {
        const cleanup = () => {
          canvasRunning = false;
          dot.remove();
          if (sparkCanvas) sparkCanvas.remove();
          if (isSafari) { inner.style.webkitMaskImage = ''; }
          else { gsap.set(inner, { clearProps: 'clipPath' }); }
          for (const el of elements) {
            gsap.set(el, { clearProps: 'willChange' });
          }
          if (glow) glow.style.animationPlayState = '';
          resolve();
        };

        if (isSafari) {
          cleanup();
          return;
        }

        // Wait for remaining sparks to fade (non-Safari only)
        const checkDone = () => {
          let anyActive = false;
          for (let i = 0; i < POOL_SIZE; i++) {
            const s = sparkPool[i];
            if (!s.active) continue;
            anyActive = true;
            s.age += 0.016;
            if (s.age >= s.life) { s.active = false; continue; }
            s.x += s.vx * 0.016;
            s.y += s.vy * 0.016;
            s.vy += 40 * 0.016;
          }
          if (anyActive) {
            requestAnimationFrame(checkDone);
          } else {
            cleanup();
          }
        };
        checkDone();
      },
    });

    // Start only after a confirmed paint frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        tween.play();
      });
    });
  });
}
