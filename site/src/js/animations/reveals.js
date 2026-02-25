/**
 * Reveals — ScrollTrigger for sections on scroll
 *
 * Replaces the old IntersectionObserver.
 * Reads rd1-rd4 classes for delay (stagger).
 */

import { gsap, ScrollTrigger } from './index.js';

// Mapping classes → delay in seconds
const DELAYS = { rd1: 0.1, rd2: 0.2, rd3: 0.3, rd4: 0.4 };

function getDelay(el) {
  for (const [cls, val] of Object.entries(DELAYS)) {
    if (el.classList.contains(cls)) return val;
  }
  return 0;
}

export function initReveals() {
  const reveals = document.querySelectorAll('.reveal');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reveals.length) {
    if (reducedMotion) {
      gsap.set(reveals, { opacity: 1, y: 0 });
    } else {
      reveals.forEach((el) => {
        const delay = getDelay(el);
        gsap.to(el, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          delay,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            once: true,
          },
        });
      });
    }
  }

  // Hero parallax — scale-down + blur when scrolling past
  const hero = document.querySelector('.hero');
  const heroInner = document.querySelector('.hero-inner');
  const heroGlow = document.querySelector('.hero-glow');
  if (hero && heroInner && !reducedMotion) {
    gsap.to(heroInner, {
      scale: 0.92,
      opacity: 0.3,
      filter: 'blur(6px)',
      ease: 'none',
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    });
    if (heroGlow) {
      gsap.to(heroGlow, {
        scale: 1.3,
        opacity: 0.3,
        ease: 'none',
        scrollTrigger: {
          trigger: hero,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });
    }
  }

  // Showcase feature images — clip-path reveal
  if (!reducedMotion) {
    document.querySelectorAll('.feature-media img').forEach((img) => {
      gsap.fromTo(img,
        { clipPath: 'inset(0 100% 0 0)' },
        {
          clipPath: 'inset(0 0% 0 0)',
          duration: 1,
          ease: 'power3.inOut',
          scrollTrigger: { trigger: img, start: 'top 80%', once: true },
        },
      );
    });

    // Showcase images — subtle parallax on scroll
    document.querySelectorAll('.feature-media').forEach((media) => {
      gsap.to(media, {
        y: -30,
        ease: 'none',
        scrollTrigger: {
          trigger: media,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      });
    });
  }
}
