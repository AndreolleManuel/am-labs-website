/* Feature Row — lightbox on click */

import { lenis } from './animations/index.js';

const rows = document.querySelectorAll('.feature-row');
if (rows.length) {
  // Make feature-rows keyboard accessible
  rows.forEach((row) => {
    if (row.dataset.src) {
      row.setAttribute('role', 'button');
      row.setAttribute('tabindex', '0');
      row.setAttribute('aria-label', row.querySelector('h4')?.textContent || 'Voir en grand');
    }
  });

  // Create lightbox element dynamically
  const lightbox = document.createElement('div');
  lightbox.className = 'bento-lightbox';
  lightbox.setAttribute('role', 'dialog');
  lightbox.setAttribute('aria-modal', 'true');
  lightbox.setAttribute('aria-label', 'Image en plein écran');
  lightbox.innerHTML = `
    <div class="bento-lightbox-backdrop"></div>
    <div class="bento-lightbox-scroll">
      <img class="bento-lightbox-img" src="" alt="" />
    </div>
    <button class="bento-lightbox-close" aria-label="Fermer">
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>
    </button>
  `;
  document.body.appendChild(lightbox);

  const backdrop = lightbox.querySelector('.bento-lightbox-backdrop');
  const scrollContainer = lightbox.querySelector('.bento-lightbox-scroll');
  const closeBtn = lightbox.querySelector('.bento-lightbox-close');
  const img = lightbox.querySelector('.bento-lightbox-img');
  let previousFocus = null;

  function openLightbox(src, alt) {
    previousFocus = document.activeElement;
    img.src = src;
    img.alt = alt;
    lightbox.classList.add('open');
    scrollContainer.scrollTop = 0;
    document.body.style.overflow = 'hidden';
    lenis.stop();
    closeBtn.focus();
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
    lenis.start();
    if (previousFocus) previousFocus.focus();
  }

  // Focus trap inside lightbox
  lightbox.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      // Only one focusable element (close button), trap here
      e.preventDefault();
      closeBtn.focus();
    }
  });

  rows.forEach((row) => {
    function activate() {
      const src = row.dataset.src;
      const alt = row.querySelector('img')?.alt || '';
      if (src) openLightbox(src, alt);
    }
    row.addEventListener('click', activate);
    row.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        activate();
      }
    });
  });

  closeBtn.addEventListener('click', closeLightbox);
  backdrop.addEventListener('click', closeLightbox);
  scrollContainer.addEventListener('click', (e) => {
    if (e.target === scrollContainer) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('open')) {
      closeLightbox();
    }
  });
}
