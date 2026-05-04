/**
 * Navigation — scroll detection + mobile menu toggle
 *
 * Fonctionne dans 2 modes :
 *  - Mode inline (home actuelle) : la nav est dans le HTML, init au DOMContentLoaded.
 *  - Mode injecté (pages internes) : la nav est chargée par partials-loader.js, init sur 'partials:loaded'.
 */

let initialized = false;

function initNav() {
  if (initialized) return;
  const nav = document.getElementById('nav');
  const toggle = document.getElementById('nav-toggle');
  const links = document.getElementById('nav-links');

  if (!nav || !toggle || !links) return; // pas encore prêt

  initialized = true;

  // Scroll — add .scrolled class on scroll
  window.addEventListener(
    'scroll',
    () => {
      nav.classList.toggle('scrolled', window.scrollY > 50);
    },
    { passive: true }
  );

  // Mobile menu toggle
  toggle.addEventListener('click', () => {
    const isOpen = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', isOpen);
  });

  // Close menu when a link is clicked
  links.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
}

// Tente l'init immédiatement (cas inline)
initNav();

// Sinon, attend que les partials soient chargés (cas pages internes)
document.addEventListener('partials:loaded', initNav, { once: true });
