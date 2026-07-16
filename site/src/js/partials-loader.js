/**
 * partials-loader.js
 *
 * Charge dynamiquement les partials nav.html et footer.html depuis /partials/.
 * Ne fait rien si les placeholders n'existent pas (cas de l'ancien index.html avec nav inline).
 *
 * Émet l'événement custom 'partials:loaded' une fois les partials injectés
 * pour que les autres scripts (nav.js notamment) puissent attacher leurs listeners.
 */

async function loadPartial(url, targetId) {
  const target = document.getElementById(targetId);
  if (!target) return false; // Pas de placeholder = pas d'injection (cas home actuelle)
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
    const html = await res.text();
    // Remplace le placeholder par le HTML chargé
    target.outerHTML = html;
    return true;
  } catch (err) {
    console.error('[partials-loader]', err);
    return false;
  }
}

function highlightActiveLink() {
  const path = window.location.pathname.replace(/\/$/, '');
  document.querySelectorAll('.nav a[href]').forEach((a) => {
    const href = (a.getAttribute('href') || '').replace(/\/$/, '');
    if (!href) return;
    // Lien exact ou parent
    if (href === path || (href !== '' && path === href) || (href !== '/' && path.startsWith(href + '/'))) {
      a.classList.add('is-active');
    }
  });
}

// Pages FR qui ont un équivalent anglais sous /en/
const EN_EQUIVALENTS = [
  '/',
  '/contact/',
  '/realisations/toolinnov-ecommerce/',
  '/realisations/atelier-clamart/',
  '/realisations/tool-innovation-panama/',
];

function isEnglishPage() {
  return /^\/en(\/|$)/.test(window.location.pathname);
}

// Câble le sélecteur FR/EN de la nav vers la page équivalente
function wireLangSwitch() {
  const norm = (p) => (p.endsWith('/') ? p : p + '/');
  const path = norm(window.location.pathname);
  const isEN = isEnglishPage();
  const frPath = isEN ? (path === '/en/' ? '/' : path.slice(3)) : path;
  const enPath = EN_EQUIVALENTS.includes(frPath)
    ? (frPath === '/' ? '/en/' : '/en' + frPath)
    : '/en/';

  const frLink = document.querySelector('.nav-lang a[data-lang="fr"]');
  const enLink = document.querySelector('.nav-lang a[data-lang="en"]');
  if (frLink) { frLink.href = frPath; frLink.classList.toggle('is-current', !isEN); }
  if (enLink) { enLink.href = enPath; enLink.classList.toggle('is-current', isEN); }
}

export async function loadPartials() {
  const suffix = isEnglishPage() ? '-en' : '';
  const [navLoaded, footerLoaded] = await Promise.all([
    loadPartial(`/partials/nav${suffix}.html`, 'nav-placeholder'),
    loadPartial(`/partials/footer${suffix}.html`, 'footer-placeholder'),
  ]);

  if (navLoaded) {
    highlightActiveLink();
    wireLangSwitch();
  }

  // Notifie les autres scripts (nav.js, etc.)
  document.dispatchEvent(new CustomEvent('partials:loaded', {
    detail: { navLoaded, footerLoaded },
  }));
}
