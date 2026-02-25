/**
 * Easter egg — Konami code déclenche un flash laser sur le logo
 * ↑ ↑ ↓ ↓ ← → ← → B A
 */

const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
let pos = 0;

document.addEventListener('keydown', (e) => {
  if (e.key === KONAMI[pos]) {
    pos++;
    if (pos === KONAMI.length) {
      pos = 0;
      triggerEasterEgg();
    }
  } else {
    pos = 0;
  }
});

function triggerEasterEgg() {
  const logo = document.querySelector('.nav-logo');
  if (!logo) return;

  // Flash glow on logo
  logo.style.transition = 'text-shadow 0.3s ease, transform 0.3s ease';
  logo.style.textShadow = '0 0 10px #8b5cf6, 0 0 30px #8b5cf6, 0 0 60px #8b5cf6';
  logo.style.transform = 'scale(1.1)';

  // Scatter particles briefly across the page
  const count = 40;
  const frag = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    const x = Math.random() * window.innerWidth;
    const y = Math.random() * window.innerHeight;
    p.style.cssText = `
      position:fixed;left:${x}px;top:${y}px;
      width:4px;height:4px;border-radius:50%;
      background:#8b5cf6;pointer-events:none;z-index:10003;
      box-shadow:0 0 6px #8b5cf6;
      animation:easterPop 0.8s ease-out forwards;
      animation-delay:${Math.random() * 0.3}s;
    `;
    frag.appendChild(p);
    setTimeout(() => p.remove(), 1200);
  }
  document.body.appendChild(frag);

  // Reset logo
  setTimeout(() => {
    logo.style.textShadow = '';
    logo.style.transform = '';
  }, 1500);
}

// Inject keyframes
const style = document.createElement('style');
style.textContent = `
@keyframes easterPop {
  0% { transform: scale(0); opacity: 1; }
  50% { transform: scale(2); opacity: 0.8; }
  100% { transform: scale(0); opacity: 0; }
}`;
document.head.appendChild(style);
