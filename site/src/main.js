/* ==============================================
   AM Labs — Entry point
   ============================================== */

// Styles
import './styles/fonts.css';
import './styles/variables.css';
import './styles/reset.css';
import './styles/nav.css';
import './styles/hero.css';
import './styles/about.css';
import './styles/services.css';
import './styles/projects.css';
import './styles/contact.css';
import './styles/footer.css';
import './styles/responsive.css';

// JS
import './js/nav.js';
import './js/wizard.js';
import './js/bento.js';
import './js/videoModal.js';
import './js/showcaseExpand.js';

import './js/easter.js';

// Animations (GSAP + Lenis)
import { lenis } from './js/animations/index.js';
import { initHeroAnimation } from './js/animations/hero.js';
import { initReveals } from './js/animations/reveals.js';

// Wait for fonts, reveal the page, then start animation after first paint
document.fonts.ready.then(async () => {
  document.body.classList.add('ready');
  // Wait for the opacity transition to complete before starting the animation
  await new Promise((r) => setTimeout(r, 150));
  initHeroAnimation();
});
initReveals();

// Dynamic sticky for sections taller than the viewport
// The section scrolls normally then freezes when its bottom reaches the viewport bottom
const stickySections = document.querySelectorAll('.hero ~ .section, .hero ~ section');

function updateTallStickyTops() {
  const vh = window.innerHeight;
  stickySections.forEach((section) => {
    if (getComputedStyle(section).position !== 'sticky') {
      section.style.top = '';
      return;
    }
    const h = section.offsetHeight;
    if (h > vh) {
      section.style.top = `${vh - h}px`;
    } else {
      section.style.top = '0px';
    }
  });
}
updateTallStickyTops();
window.addEventListener('resize', updateTallStickyTops);

// ResizeObserver to recalculate when sections change size
if (typeof ResizeObserver !== 'undefined') {
  const ro = new ResizeObserver(updateTallStickyTops);
  stickySections.forEach((section) => ro.observe(section));
}

// Back to top
const backToTop = document.getElementById('back-to-top');
if (backToTop) {
  lenis.on('scroll', () => {
    backToTop.classList.toggle('is-visible', window.scrollY > window.innerHeight);
  });
  backToTop.addEventListener('click', () => lenis.scrollTo(0, { duration: 1.2 }));
}

// Legal notice modal
const mentionsLink = document.getElementById('mentions-link');
const mentionsModal = document.getElementById('mentions-modal');
if (mentionsLink && mentionsModal) {
  const mentionsClose = mentionsModal.querySelector('.mentions-close');
  const mentionsBackdrop = mentionsModal.querySelector('.mentions-backdrop');
  mentionsLink.addEventListener('click', (e) => { e.preventDefault(); mentionsModal.classList.add('open'); mentionsModal.setAttribute('aria-hidden', 'false'); });
  mentionsClose?.addEventListener('click', () => { mentionsModal.classList.remove('open'); mentionsModal.setAttribute('aria-hidden', 'true'); });
  mentionsBackdrop?.addEventListener('click', () => { mentionsModal.classList.remove('open'); mentionsModal.setAttribute('aria-hidden', 'true'); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && mentionsModal.classList.contains('open')) { mentionsModal.classList.remove('open'); mentionsModal.setAttribute('aria-hidden', 'true'); } });
}

// About toggle
const aboutToggle = document.getElementById('about-toggle');
const aboutMore = document.getElementById('about-more');
if (aboutToggle && aboutMore) {
  aboutToggle.addEventListener('click', () => {
    const open = aboutMore.classList.toggle('is-open');
    aboutToggle.textContent = open ? 'Voir moins' : 'En savoir plus';
  });
}

// Scroll progress bar
const progressBar = document.getElementById('scroll-progress');
if (progressBar) {
  lenis.on('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progressBar.style.width = `${progress}%`;
  });
}

// Anchor links → smooth scroll via Lenis
// We compute cumulative position (sum of heights) instead of offsetTop
// because sticky sections return incorrect offsetTop when stuck
function getSectionScrollTarget(el) {
  let pos = 0;
  const hero = document.querySelector('.hero');
  let sibling = hero;
  while (sibling && sibling !== el) {
    pos += sibling.offsetHeight;
    sibling = sibling.nextElementSibling;
  }
  return pos;
}

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', (e) => {
    const href = anchor.getAttribute('href');
    if (href === '#') {
      e.preventDefault();
      lenis.scrollTo(0);
      return;
    }
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      const pos = getSectionScrollTarget(target);
      lenis.scrollTo(pos, { offset: 0 });
    }
  });
});

