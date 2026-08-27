import {
  GOOGLE_ANALYTICS_MEASUREMENT_ID,
  installGoogleAnalytics,
} from './google-analytics.js';

const CONSENT_STORAGE_KEY = 'amlabs-cookie-consent-v1';
const CONSENT_VERSION = 1;
const COOKIE_EXPIRATION = 'Thu, 01 Jan 1970 00:00:00 GMT';

export const CONSENT_VALIDITY_MS = 180 * 24 * 60 * 60 * 1000;

const COPY = {
  fr: {
    ariaLabel: 'Préférences de confidentialité',
    title: 'Votre vie privée, votre choix',
    text: 'Nous utilisons Google Analytics uniquement avec votre accord pour comprendre l’utilisation du site et l’améliorer. Vous pouvez accepter, refuser ou modifier votre choix à tout moment.',
    more: 'En savoir plus',
    reject: 'Tout refuser',
    accept: 'Tout accepter',
  },
  en: {
    ariaLabel: 'Privacy preferences',
    title: 'Your privacy, your choice',
    text: 'We use Google Analytics only with your permission to understand how the site is used and improve it. You can accept, refuse, or change your choice at any time.',
    more: 'Learn more',
    reject: 'Reject all',
    accept: 'Accept all',
  },
};

export function getCookieConsentStorage(window) {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readCookieConsent(storage, now = Date.now()) {
  try {
    const record = JSON.parse(storage.getItem(CONSENT_STORAGE_KEY));
    if (
      record?.version !== CONSENT_VERSION
      || typeof record.analytics !== 'boolean'
      || !Number.isFinite(record.expiresAt)
      || record.expiresAt <= now
    ) {
      return null;
    }
    return record.analytics;
  } catch {
    return null;
  }
}

export function saveCookieConsent(storage, analytics, now = Date.now()) {
  const record = {
    version: CONSENT_VERSION,
    analytics: Boolean(analytics),
    savedAt: now,
    expiresAt: now + CONSENT_VALIDITY_MS,
  };

  try {
    storage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Le choix reste appliqué pour la page courante si le stockage est indisponible.
  }

  return record;
}

function clearGoogleAnalyticsCookies(document, window) {
  const cookieNames = new Set(['_ga', `_ga_${GOOGLE_ANALYTICS_MEASUREMENT_ID.slice(2)}`]);
  try {
    for (const cookie of document.cookie.split(';')) {
      const name = cookie.split('=', 1)[0].trim();
      if (/^_ga(?:_|$)|^_gid$|^_gat(?:_|$)/.test(name)) {
        cookieNames.add(name);
      }
    }
  } catch {
    // Les noms GA standards restent supprimés si la lecture des cookies est indisponible.
  }

  const hostname = window.location?.hostname?.replace(/^www\./, '');
  const domains = hostname ? ['', `; Domain=.${hostname}`] : [''];

  for (const name of cookieNames) {
    for (const domain of domains) {
      document.cookie = `${name}=; Path=/; Expires=${COOKIE_EXPIRATION}; Max-Age=0; SameSite=Lax${domain}`;
    }
  }
}

export function applyCookieConsent({
  analytics,
  document,
  window,
  installAnalytics = installGoogleAnalytics,
}) {
  const disableKey = `ga-disable-${GOOGLE_ANALYTICS_MEASUREMENT_ID}`;
  window[disableKey] = !analytics;

  if (analytics) {
    installAnalytics(document, window);
    return;
  }

  clearGoogleAnalyticsCookies(document, window);
}

function getLanguage(document) {
  return document.documentElement?.lang?.toLowerCase().startsWith('en') ? 'en' : 'fr';
}

function renderConsentBanner(document, onChoice) {
  document.getElementById('cookie-consent')?.remove();

  const copy = COPY[getLanguage(document)];
  const banner = document.createElement('aside');
  banner.id = 'cookie-consent';
  banner.className = 'cookie-consent';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-label', copy.ariaLabel);
  banner.setAttribute('aria-live', 'polite');
  const content = document.createElement('div');
  content.className = 'cookie-consent__content';

  const text = document.createElement('div');
  text.className = 'cookie-consent__copy';

  const title = document.createElement('h2');
  title.textContent = copy.title;

  const description = document.createElement('p');
  description.append(document.createTextNode(`${copy.text} `));
  const more = document.createElement('a');
  more.href = '/mentions-legales/#cookies';
  more.textContent = copy.more;
  description.append(more, '.');
  text.append(title, description);

  const actions = document.createElement('div');
  actions.className = 'cookie-consent__actions';

  const reject = document.createElement('button');
  reject.type = 'button';
  reject.className = 'cookie-consent__button';
  reject.dataset.cookieConsentChoice = 'reject';
  reject.textContent = copy.reject;

  const accept = document.createElement('button');
  accept.type = 'button';
  accept.className = 'cookie-consent__button cookie-consent__button--accept';
  accept.dataset.cookieConsentChoice = 'accept';
  accept.textContent = copy.accept;

  actions.append(reject, accept);
  content.append(text, actions);
  banner.append(content);

  banner.addEventListener('click', (event) => {
    const button = event.target.closest?.('[data-cookie-consent-choice]');
    if (!button) return;
    onChoice(button.dataset.cookieConsentChoice === 'accept');
    banner.remove();
  });

  document.body.append(banner);
  banner.querySelector('[data-cookie-consent-choice="reject"]')?.focus();
}

const initializedDocuments = new WeakSet();

export function initializeCookieConsent(document, window) {
  if (initializedDocuments.has(document)) return;
  initializedDocuments.add(document);

  const storage = getCookieConsentStorage(window);
  const applyChoice = (analytics) => {
    saveCookieConsent(storage, analytics);
    applyCookieConsent({ analytics, document, window });
  };
  const showPreferences = () => renderConsentBanner(document, applyChoice);

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest?.('[data-cookie-settings]');
    if (!trigger) return;
    event.preventDefault();
    showPreferences();
  });

  const savedConsent = readCookieConsent(storage);
  if (savedConsent === null) {
    applyCookieConsent({ analytics: false, document, window });
    showPreferences();
    return;
  }

  applyCookieConsent({ analytics: savedConsent, document, window });
}
