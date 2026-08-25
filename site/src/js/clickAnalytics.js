const DEFAULT_ENDPOINT = import.meta.env?.VITE_AMLABS_CLICK_ANALYTICS_URL?.trim()
  || 'https://am-labs-click-analytics.manuel-andreolle.workers.dev/event';

const TRACKED_CLASSES = [
  'hero-cta',
  'nav-cta',
  'section-cta-link',
  'cta-link',
];

function cleanPath(value) {
  const path = value.replace(/[^a-zA-Z0-9/_-]/g, '').slice(0, 160);
  return path.startsWith('/') ? path : `/${path}`;
}

export function classifyClick(element, currentURL = window.location.href) {
  const explicitEvent = element.dataset.trackEvent;
  const explicitTarget = element.dataset.trackTarget;
  if (explicitEvent && explicitTarget) {
    return { eventName: explicitEvent, target: cleanPath(explicitTarget) };
  }

  if (!(element instanceof HTMLAnchorElement)) {
    return TRACKED_CLASSES.some((className) => element.classList.contains(className))
      ? { eventName: 'cta', target: 'button' }
      : null;
  }

  const href = element.getAttribute('href') ?? '';
  if (href.startsWith('mailto:')) return { eventName: 'email', target: 'email' };
  if (href.startsWith('tel:')) return { eventName: 'phone', target: 'phone' };

  let url;
  try {
    url = new URL(href, currentURL);
  } catch {
    return null;
  }

  if (url.origin !== new URL(currentURL).origin) {
    return { eventName: 'external', target: url.hostname.slice(0, 120) };
  }

  const path = cleanPath(url.pathname);
  if (path.includes('/contact') || url.hash === '#contact') {
    return { eventName: 'contact', target: path };
  }
  if (path.includes('/services/')) return { eventName: 'service', target: path };
  if (path.includes('/realisations/')) return { eventName: 'project', target: path };
  if (TRACKED_CLASSES.some((className) => element.classList.contains(className))) {
    return { eventName: 'cta', target: path };
  }
  return null;
}

export function initClickAnalytics(endpoint = DEFAULT_ENDPOINT) {
  if (!endpoint) return;

  document.addEventListener('click', (event) => {
    const element = event.target.closest('a, button');
    if (!element) return;

    const classified = classifyClick(element);
    if (!classified) return;

    const payload = {
      ...classified,
      pagePath: cleanPath(window.location.pathname),
    };

    void fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'omit',
      keepalive: true,
    }).catch(() => {});
  }, { capture: true });
}
