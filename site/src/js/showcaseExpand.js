/**
 * Showcase expand/collapse — reveals hidden feature-rows with animation
 * Supports multiple showcases on the page
 */

import { gsap, ScrollTrigger, lenis } from './animations/index.js';

document.querySelectorAll('.showcase').forEach((showcase) => {
  const features = showcase.querySelector('.showcase-features');
  const btn = showcase.querySelector('.showcase-expand-btn');
  if (!features || !btn) return;

  // Both showcases: show first 2 features, hide from 3rd onwards
  const hiddenSelector = '.feature-row:nth-child(n+3)';

  btn.setAttribute('aria-expanded', 'false');

  btn.addEventListener('click', () => {
    const isCollapsed = features.classList.contains('is-collapsed');

    if (isCollapsed) {
      features.classList.remove('is-collapsed');

      const hiddenRows = features.querySelectorAll(hiddenSelector);
      gsap.fromTo(
        hiddenRows,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power3.out',
          onComplete: () => ScrollTrigger.refresh(),
        }
      );

      // Also reveal highlights if present (Atelier)
      const highlights = showcase.querySelector('.showcase-highlights');
      if (highlights && showcase.classList.contains('showcase--atelier')) {
        gsap.fromTo(
          highlights,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.5, delay: 0.2, ease: 'power3.out' }
        );
      }

      btn.classList.add('is-expanded');
      btn.setAttribute('aria-expanded', 'true');
      btn.childNodes[0].textContent = 'Voir moins ';
    } else {
      const hiddenRows = features.querySelectorAll(hiddenSelector);
      gsap.to(hiddenRows, {
        opacity: 0,
        y: 20,
        duration: 0.3,
        stagger: 0.05,
        ease: 'power2.in',
        onComplete: () => {
          features.classList.add('is-collapsed');
          gsap.set(hiddenRows, { clearProps: 'all' });
          ScrollTrigger.refresh();
          lenis.scrollTo(showcase, { offset: 0, duration: 0.8 });
        },
      });

      btn.classList.remove('is-expanded');
      btn.setAttribute('aria-expanded', 'false');
      btn.childNodes[0].textContent = 'Explorer les fonctionnalités ';
    }
  });
});
