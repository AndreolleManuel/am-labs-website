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
import './styles/cookie-consent.css';
import './styles/pages.css'; // Composants pages internes (page-hero, breadcrumb, FAQ, etc.)
import './styles/responsive.css';

// JS
import { initializeCookieConsent } from './js/cookie-consent.js';
import { loadPartials } from './js/partials-loader.js';
import './js/nav.js';
import './js/wizard.js';
import './js/bento.js';
import './js/videoModal.js';
import './js/showcaseExpand.js';
import { initClickAnalytics } from './js/clickAnalytics.js';
import { getSectionScrollTarget, initializeStackingScroll } from './js/stacking-scroll.js';

initializeCookieConsent(document, window);

// Charge nav + footer dans les pages qui ont les placeholders
// (sur la home actuelle qui a sa nav inline, le loader détecte l'absence de placeholder et ne fait rien)
loadPartials();
initClickAnalytics();

// Sticky stacking shared by the home and internal page heroes.
initializeStackingScroll(document, window);

// Back to top — native, immediate scrolling.
const backToTop = document.getElementById('back-to-top');
if (backToTop) {
  const updateBackToTop = () => {
    backToTop.classList.toggle('is-visible', window.scrollY > window.innerHeight);
  };
  window.addEventListener('scroll', updateBackToTop, { passive: true });
  updateBackToTop();
  backToTop.addEventListener('click', () => window.scrollTo(0, 0));
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
    aboutToggle.textContent = open
      ? (aboutToggle.dataset.less || 'Voir moins')
      : (aboutToggle.dataset.more || 'En savoir plus');
  });
}

// Scroll progress bar
const progressBar = document.getElementById('scroll-progress');
if (progressBar) {
  const updateProgressBar = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progressBar.style.width = `${progress}%`;
  };
  window.addEventListener('scroll', updateProgressBar, { passive: true });
  updateProgressBar();
}

// Anchor links — native, immediate scroll.
// Sticky sections use their cumulative normal-flow height as target.
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', (e) => {
    const href = anchor.getAttribute('href');
    if (href === '#') {
      e.preventDefault();
      window.scrollTo(0, 0);
      return;
    }
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      const pos = getSectionScrollTarget(target, document);
      window.scrollTo(0, pos);
    }
  });
});
