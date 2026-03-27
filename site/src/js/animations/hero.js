/**
 * Hero — CNC Laser reveal (global sweep top → bottom)
 *
 * A single laser dot sweeps the entire hero-inner from top to bottom,
 * zigzagging horizontally (like a CNC head on its rail).
 * ALL elements are revealed simultaneously as the laser passes.
 *
 * Safari mobile fix (mars 2026):
 *   - Uses a real <div> clip wrapper instead of per-frame webkitMaskImage updates
 *   - Reduces ROW_HEIGHT on mobile for fewer rows → faster sweep
 *   - Throttles onUpdate to ~30fps on mobile Safari (vs 60fps desktop)
 *   - Skips hero-glow blur recalc during animation
 */

import { gsap } from './index.js';

// Detect mobile + Safari early
const isMobile = window.innerWidth < 768;
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
const isMobileSafari = isSafari && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

const ROW_HEIGHT = isMobileSafari ? 50 : 35;

// ---- Spark object pool (zero allocation during animation) ----
// Reduced pool on mobile Safari to save memory
const POOL_SIZE = isMobileSafari ? 0 : 200;
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

  // Pause glowDrift CSS animation during CNC (reduce GPU contention)
  const glow = document.querySelector('.hero-glow');
  if (glow) glow.style.animationPlayState = 'paused';

  // On mobile Safari, also hide the glow entirely during animation
  // (filter: blur(60px) is extremely expensive on WebKit mobile GPU)
  if (isMobileSafari && glow) {
    glow.style.display = 'none';
  }

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

  // Reveal mechanism:
  //   - Safari: use clip-path inset (NOT webkitMaskImage which recalcs gradient every frame)
  //   - Others: same clip-path inset (consistent, GPU-composited)
  //
  // Previous Safari code used webkitMaskImage with a linear-gradient updated every frame.
  // This caused massive perf issues on mobile Safari because WebKit rasterizes the
  // mask image on the CPU each time the gradient string changes.
  // clip-path: inset() is GPU-composited on all browsers including Safari.
  gsap.set(inner, { clipPath: 'inset(0 0 100% 0)', willChange: 'clip-path' });

  // Force reflow to ensure rects are accurate
  inner.offsetHeight;

  const innerRect = inner.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const sparkMargin = 80;
  const numRows = Math.max(Math.ceil(innerRect.height / ROW_HEIGHT), 1);
  // Faster sweep on mobile Safari: fewer rows + quicker per-row
  const msPerRow = isMobileSafari ? 55 : 80;
  const durationMs = Math.max(isMobileSafari ? 1000 : 1500, numRows * msPerRow);
  const durationSec = durationMs / 1000;

  // Laser dot — position absolute inside hero instead of fixed on body
  // Simplified box-shadow on mobile Safari (fewer layers = less compositing)
  const dotShadow = isMobileSafari
    ? `0 0 6px 3px ${accent}`
    : `0 0 4px 2px #fff, 0 0 10px 4px ${accent}, 0 0 25px 8px ${accent}50, 0 0 45px 12px ${accent}20`;
  const dot = document.createElement('div');
  dot.style.cssText = [
    'position:absolute', 'left:0', 'top:0',
    `width:${isMobileSafari ? 6 : 8}px`, `height:${isMobileSafari ? 6 : 8}px`,
    'border-radius:50%', 'background:#fff',
    `box-shadow:${dotShadow}`,
    'pointer-events:none', 'z-index:10001',
    'will-change:transform',
  ].join(';');
  inner.appendChild(dot);

  // Spark canvas — only on non-Safari browsers
  const cw = innerRect.width + sparkMargin * 2;
  const ch = innerRect.height + sparkMargin * 2;
  let sparkCanvas = null;
  let sCtx = null;

  if (!isSafari && POOL_SIZE > 0) {
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

    // Frame throttle for mobile Safari: skip every other frame (target ~30fps)
    let frameCount = 0;

    // Separate canvas render loop (only on non-Safari)
    let canvasRunning = !isSafari && POOL_SIZE > 0;
    if (!isSafari && POOL_SIZE > 0) {
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
        // Throttle to ~30fps on mobile Safari to reduce GPU pressure
        if (isMobileSafari) {
          frameCount++;
          if (frameCount % 2 !== 0) return;
        }
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

        // Reveal — clip-path inset (GPU-composited on all browsers including Safari)
        const revealPx = laserVpY - innerTop;
        const revealPct = Math.max(0, Math.min((revealPx / innerRect.height) * 100, 100));
        inner.style.clipPath = `inset(0 0 ${Math.max(100 - revealPct, 0)}% 0)`;

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
          gsap.set(inner, { clearProps: 'clipPath,willChange' });
          for (const el of elements) {
            gsap.set(el, { clearProps: 'willChange' });
          }
          if (glow) {
            glow.style.animationPlayState = '';
            if (isMobileSafari) glow.style.display = '';
          }
          resolve();
        };

        if (isSafari || POOL_SIZE === 0) {
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
