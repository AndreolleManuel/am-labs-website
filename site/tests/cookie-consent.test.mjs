import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  CONSENT_VALIDITY_MS,
  applyCookieConsent,
  getCookieConsentStorage,
  readCookieConsent,
  saveCookieConsent,
} from '../src/js/cookie-consent.js';

function createStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
  };
}

test('Analytics reste bloqué tant que le visiteur n’a pas accepté', () => {
  const storage = createStorage();
  assert.equal(readCookieConsent(storage, 1_000), null);

  const cookieWrites = [];
  const document = {
    get cookie() {
      return '_ga=old; _ga_SQ5Z2TRPKT=old; _gid=old; _gat_custom=old; session=keep';
    },
    set cookie(value) {
      cookieWrites.push(value);
    },
  };
  const window = {};
  let installs = 0;

  applyCookieConsent({
    analytics: false,
    document,
    window,
    installAnalytics: () => { installs += 1; },
  });

  assert.equal(installs, 0);
  assert.equal(window['ga-disable-G-SQ5Z2TRPKT'], true);
  assert.ok(cookieWrites.some((value) => value.startsWith('_ga=')));
  assert.ok(cookieWrites.some((value) => value.startsWith('_ga_SQ5Z2TRPKT=')));
  assert.ok(cookieWrites.some((value) => value.startsWith('_gid=')));
  assert.ok(cookieWrites.some((value) => value.startsWith('_gat_custom=')));
  assert.equal(cookieWrites.some((value) => value.startsWith('session=')), false);
});

test('l’acceptation active Analytics et expire après six mois', () => {
  const storage = createStorage();
  const now = 10_000;

  saveCookieConsent(storage, true, now);
  assert.equal(readCookieConsent(storage, now + CONSENT_VALIDITY_MS - 1), true);
  assert.equal(readCookieConsent(storage, now + CONSENT_VALIDITY_MS), null);

  const window = {};
  let installs = 0;
  applyCookieConsent({
    analytics: true,
    document: {},
    window,
    installAnalytics: () => { installs += 1; },
  });

  assert.equal(installs, 1);
  assert.equal(window['ga-disable-G-SQ5Z2TRPKT'], false);
});

test('un stockage navigateur bloqué ne casse pas la gestion du consentement', () => {
  const blockedWindow = {
    get localStorage() {
      throw new DOMException('Blocked', 'SecurityError');
    },
  };

  assert.equal(getCookieConsentStorage(blockedWindow), null);
  assert.equal(readCookieConsent(null), null);
  assert.doesNotThrow(() => saveCookieConsent(null, false, 0));
});

test('le point d’entrée passe par le consentement et expose les préférences dans les footers', async () => {
  const root = new URL('../', import.meta.url);
  const [main, footerFr, footerEn, legal, css] = await Promise.all([
    readFile(new URL('src/main.js', root), 'utf8'),
    readFile(new URL('public/partials/footer.html', root), 'utf8'),
    readFile(new URL('public/partials/footer-en.html', root), 'utf8'),
    readFile(new URL('mentions-legales/index.html', root), 'utf8'),
    readFile(new URL('src/styles/cookie-consent.css', root), 'utf8'),
  ]);

  assert.match(main, /initializeCookieConsent\(document, window\)/);
  assert.doesNotMatch(main, /installGoogleAnalytics\(document, window\)/);
  assert.match(footerFr, /data-cookie-settings/);
  assert.match(footerEn, /data-cookie-settings/);
  assert.match(legal, /Google Analytics/);
  assert.doesNotMatch(legal, /aucun cookie publicitaire ni outil de tracking analytique tiers/);
  assert.match(css, /\.cookie-consent/);
  assert.match(css, /\.footer-cookie-settings/);
  assert.doesNotMatch(css, /\.cookie-settings-button/);
});
