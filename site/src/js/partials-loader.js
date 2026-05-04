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

export async function loadPartials() {
  const [navLoaded, footerLoaded] = await Promise.all([
    loadPartial('/partials/nav.html', 'nav-placeholder'),
    loadPartial('/partials/footer.html', 'footer-placeholder'),
  ]);

  if (navLoaded) {
    highlightActiveLink();
  }

  // Notifie les autres scripts (nav.js, etc.)
  document.dispatchEvent(new CustomEvent('partials:loaded', {
    detail: { navLoaded, footerLoaded },
  }));
}
