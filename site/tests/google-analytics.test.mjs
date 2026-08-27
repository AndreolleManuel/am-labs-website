import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  GOOGLE_ANALYTICS_MEASUREMENT_ID,
  installGoogleAnalytics,
} from '../src/js/google-analytics.js';

function createBrowserDoubles() {
  const scripts = [];
  const document = {
    head: {
      append(script) {
        scripts.push(script);
      },
    },
    createElement(tagName) {
      return { tagName, dataset: {} };
    },
    querySelector(selector) {
      if (selector !== 'script[data-google-analytics]') return null;
      return scripts.find((script) => script.dataset?.googleAnalytics === 'true') ?? null;
    },
  };
  const window = {};

  return { document, scripts, window };
}

test('Google Analytics utilise le flux public AM Labs et charge gtag une seule fois', () => {
  const browser = createBrowserDoubles();

  assert.equal(GOOGLE_ANALYTICS_MEASUREMENT_ID, 'G-SQ5Z2TRPKT');
  assert.equal(installGoogleAnalytics(browser.document, browser.window), true);
  assert.equal(installGoogleAnalytics(browser.document, browser.window), false);

  assert.equal(browser.scripts.length, 1);
  assert.equal(browser.scripts[0].async, true);
  assert.equal(browser.scripts[0].src, 'https://www.googletagmanager.com/gtag/js?id=G-SQ5Z2TRPKT');
  assert.equal(browser.scripts[0].dataset.googleAnalytics, 'true');

  assert.equal(browser.window.dataLayer.length, 2);
  assert.equal(browser.window.dataLayer[0][0], 'js');
  assert.ok(browser.window.dataLayer[0][1] instanceof Date);
  assert.equal(browser.window.dataLayer[1][0], 'config');
  assert.equal(browser.window.dataLayer[1][1], 'G-SQ5Z2TRPKT');
  assert.deepEqual(browser.window.dataLayer[1][2], {
    allow_ad_personalization_signals: false,
    allow_google_signals: false,
    cookie_expires: 33696000,
  });
});

test('le module Analytics reste isolé du point d’entrée avant consentement', async () => {
  const main = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');
  assert.doesNotMatch(main, /installGoogleAnalytics\(document, window\)/);
});
