/**
 * Navigation — scroll detection + mobile menu toggle
 */

const nav = document.getElementById('nav');
const toggle = document.getElementById('nav-toggle');
const links = document.getElementById('nav-links');

// Scroll — add .scrolled class on scroll
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 50);
}, { passive: true });

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
