/* Video Modal — open / close + keyboard support + focus trap */

import { lenis } from './animations/index.js';

const trigger = document.getElementById('showcase-demo-btn');
const modal = document.getElementById('video-modal');
const player = document.getElementById('video-modal-player');
const closeBtn = modal?.querySelector('.video-modal-close');
const backdrop = modal?.querySelector('.video-modal-backdrop');
let previousFocus = null;

function openModal() {
  if (!modal || !player) return;
  previousFocus = document.activeElement;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  lenis.stop();
  player.currentTime = 0;
  player.play();
  closeBtn?.focus();
}

function closeModal() {
  if (!modal || !player) return;
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  lenis.start();
  player.pause();
  if (previousFocus) previousFocus.focus();
}

// Focus trap
if (modal) {
  modal.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      const focusable = modal.querySelectorAll('button, video, [tabindex]');
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
}

if (trigger) {
  trigger.addEventListener('click', openModal);
  trigger.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openModal();
    }
  });
}

if (closeBtn) closeBtn.addEventListener('click', closeModal);
if (backdrop) backdrop.addEventListener('click', closeModal);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modal?.classList.contains('open')) {
    closeModal();
  }
});
