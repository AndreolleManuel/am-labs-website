/**
 * Animations — GSAP setup + Lenis smooth scroll
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

// Defaults consistent with the existing design
gsap.defaults({
  ease: 'power3.out',
  duration: 0.8,
});

// ---- Lenis smooth scroll ----
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
});

// Sync Lenis → ScrollTrigger
lenis.on('scroll', ScrollTrigger.update);

gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);

export { gsap, ScrollTrigger, lenis };
