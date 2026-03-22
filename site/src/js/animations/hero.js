/**
 * Hero — CNC Laser reveal (global sweep top → bottom)
 *
 * A single laser dot sweeps the entire hero-inner from top to bottom,
 * zigzagging horizontally (like a CNC head on its rail).
 * ALL elements are revealed simultaneously as the laser passes.
 */

import { gsap } from './index.js';

/* ---- CNC Laser global reveal ---- */

const ROW_HEIGHT = 35; // height of each horizontal pass (px)

export async function initHeroAnimation() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    gsap.set('.hero-inner > *', { opacity: 1 });
    return;
  }

  const inner = document.querySelector('.hero-inner');
  if (!inner) return;

  // Wait for the browser to restore scroll position and layout to settle
  // Mobile needs more time for fonts + layout reflow
  const isMobile = window.innerWidth < 768;
  await new Promise((r) => setTimeout(r, isMobile ? 300 : 120));

  // Skip if the page is scrolled past the hero (refresh at bottom of page)
  // Note: we cannot use getBoundingClientRect because the hero is sticky
  // and always remains visible in the viewport
  if (window.scrollY > window.innerHeight * 0.3) {
    gsap.set('.hero-inner > *', { opacity: 1 });
    return;
  }

  const accent =
    getComputedStyle(document.documentElement)
      .getPropertyValue('--color-accent').trim() || '#8b5cf6';

  // ---- Collect all elements to reveal ----
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

  // Make visible but clipped (hidden from bottom → revealed from top)
  for (const el of elements) {
    gsap.set(el, { opacity: 1, clipPath: 'inset(0 0 100% 0)' });
  }

  // ---- Global hero-inner area ----
  const innerRect = inner.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const sparkMargin = 80;
  const numRows = Math.max(Math.ceil(innerRect.height / ROW_HEIGHT), 1);
  // Scale duration with height so the laser doesn't rush on tall mobile layouts
  const durationMs = Math.max(1500, numRows * 80);

  // Pre-compute the rect of each element
  const elRects = elements.map((el) => {
    const r = el.getBoundingClientRect();
    return {
      el,
      top: r.top,
      bottom: r.bottom,
      height: r.height,
    };
  });

  // ---- Laser dot (DOM element) ----
  const dot = document.createElement('div');
  dot.style.cssText = [
    'position:fixed', 'left:0', 'top:0',
    'width:8px', 'height:8px',
    'border-radius:50%', 'background:#fff',
    `box-shadow:0 0 4px 2px #fff, 0 0 10px 4px ${accent}, 0 0 25px 8px ${accent}50, 0 0 45px 12px ${accent}20`,
    'pointer-events:none', 'z-index:10001',
    'will-change:transform',
  ].join(';');
  document.body.appendChild(dot);

  // ---- Spark canvas (covers the entire hero-inner) ----
  const cw = innerRect.width + sparkMargin * 2;
  const ch = innerRect.height + sparkMargin * 2;
  const sparkCanvas = document.createElement('canvas');
  sparkCanvas.width = cw * dpr;
  sparkCanvas.height = ch * dpr;
  sparkCanvas.style.cssText = [
    'position:fixed',
    `left:${innerRect.left - sparkMargin}px`,
    `top:${innerRect.top - sparkMargin}px`,
    `width:${cw}px`, `height:${ch}px`,
    'pointer-events:none', 'z-index:10000',
  ].join(';');
  document.body.appendChild(sparkCanvas);
  const sCtx = sparkCanvas.getContext('2d');
  sCtx.scale(dpr, dpr);

  // ---- Animation loop ----
  return new Promise((resolve) => {
    const sparks = [];
    const t0 = performance.now();
    let lastT = t0;
    let firing = true;

    (function tick(now) {
      const dt = Math.min((now - lastT) / 1000, 0.05);
      lastT = now;

      const progress = Math.min((now - t0) / durationMs, 1);

      // ---- Laser position (horizontal zigzag, row by row) ----
      const rowProgress = progress * numRows;
      const currentRow = Math.min(Math.floor(rowProgress), numRows - 1);
      const withinRow = Math.min(rowProgress - currentRow, 1);
      const goingRight = currentRow % 2 === 0;

      // Y: starts from top, moves down
      const laserVpY = innerRect.top + Math.min((currentRow + 0.5) * ROW_HEIGHT, innerRect.height);
      // X: zigzag left↔right
      const laserVpX = goingRight
        ? innerRect.left + withinRow * innerRect.width
        : innerRect.left + (1 - withinRow) * innerRect.width;

      // Position in the spark canvas
      const sparkX = sparkMargin + (laserVpX - innerRect.left);
      const sparkY = sparkMargin + (laserVpY - innerRect.top);

      // Update dot
      dot.style.transform = `translate(${laserVpX - 4}px, ${laserVpY - 4}px)`;

      // ---- Clip-path: reveal each element based on laser Y position ----
      for (const { el, top, bottom, height } of elRects) {
        if (height <= 0) continue;
        // How many pixels from the top of the element are revealed
        const revealPx = laserVpY - top;
        const revealPct = Math.max(0, Math.min((revealPx / height) * 100, 100));
        // inset(top right bottom left) — clip from the bottom
        el.style.clipPath = `inset(0 0 ${Math.max(100 - revealPct, 0)}% 0)`;
      }

      // Fade out the dot at the end
      if (progress > 0.93) {
        dot.style.opacity = String(Math.max(0, (1 - progress) / 0.07));
      }

      // ---- Sparks ----
      if (firing && progress < 0.95) {
        const count = 2 + Math.floor(Math.random() * 2);
        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 30 + Math.random() * 80;
          sparks.push({
            x: sparkX,
            y: sparkY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 0.1 + Math.random() * 0.25,
            age: 0,
            size: 0.5 + Math.random() * 1.5,
          });
        }
      }

      // Update sparks
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.age += dt;
        if (s.age >= s.life) { sparks.splice(i, 1); continue; }
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.vy += 40 * dt;
      }

      // Draw sparks
      sCtx.clearRect(0, 0, cw, ch);
      for (const s of sparks) {
        const t = s.age / s.life;
        sCtx.globalAlpha = (1 - t) * (1 - t);
        sCtx.fillStyle = t < 0.3 ? '#fff' : accent;
        sCtx.beginPath();
        sCtx.arc(s.x, s.y, s.size * (1 - t * 0.5), 0, Math.PI * 2);
        sCtx.fill();
      }
      sCtx.globalAlpha = 1;

      if (progress >= 1) firing = false;

      if (progress < 1 || sparks.length > 0) {
        requestAnimationFrame(tick);
      } else {
        dot.remove();
        sparkCanvas.remove();
        for (const { el } of elRects) {
          gsap.set(el, { clearProps: 'clipPath' });
        }
        resolve();
      }
    })(performance.now());
  });
}
