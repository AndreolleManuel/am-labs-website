import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  STACKING_SECTION_SELECTOR,
  applyStackingLayers,
  getSectionScrollTarget,
  initializeStackingScroll,
  updateStickySectionTops,
} from '../src/js/stacking-scroll.js';
import { findCssRule } from './helpers/css-rules.mjs';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

const internalPages = [
  'services/creation-site-web/index.html',
  'services/application-sur-mesure/index.html',
  'services/assistant-ia-sur-mesure/index.html',
  'services/connecteur-erp-ecommerce/index.html',
  'services/audit-seo-numerique/index.html',
  'services/maintenance-site-web/index.html',
  'realisations/atelier-clamart/index.html',
  'realisations/tool-innovation-panama/index.html',
  'realisations/toolinnov-ecommerce/index.html',
  'en/realisations/atelier-clamart/index.html',
  'en/realisations/tool-innovation-panama/index.html',
  'en/realisations/toolinnov-ecommerce/index.html',
];

const voidElements = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);

function directMainSections(html) {
  const stack = [];
  const sections = [];
  const cleanHtml = html.replace(/<!--[\s\S]*?-->/g, '');

  for (const token of cleanHtml.matchAll(/<\/?([a-z][\w-]*)([^>]*)>/gi)) {
    const name = token[1].toLowerCase();
    const closing = token[0].startsWith('</');
    if (closing) {
      const index = stack.lastIndexOf(name);
      if (index !== -1) stack.splice(index);
      continue;
    }

    if (name === 'section' && stack.at(-1) === 'main') {
      sections.push(token[2].match(/\bclass=["']([^"']*)["']/i)?.[1] ?? '');
    }

    if (!voidElements.has(name) && !token[0].endsWith('/>')) stack.push(name);
  }

  return sections;
}

function section(height, position = 'sticky') {
  return { offsetHeight: height, offsetTop: 0, computedPosition: position, style: {}, nextElementSibling: null };
}

test('toutes les pages Services et Réalisations ont un hero et des sections sœurs directes', async () => {
  for (const path of internalPages) {
    const html = await read(path);
    const sections = directMainSections(html);
    const mainHtml = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? '';
    const totalSections = [...mainHtml.matchAll(/<section\b/gi)].length;
    assert.ok(sections.length >= 2, `${path}: moins de deux sections directes dans main`);
    assert.equal(sections.length, totalSections, `${path}: une section n'est pas sœur directe du hero`);
    assert.match(sections[0], /(?:^|\s)(?:page-hero|hero)(?:\s|$)/, `${path}: la première section directe n'est pas un hero`);
  }
});

test('la sélection du scroll couvre les heroes de home et de pages internes', () => {
  let receivedSelector;
  const expectedSections = [section(500), section(600)];
  const documentRef = {
    querySelectorAll(selectorValue) {
      receivedSelector = selectorValue;
      return expectedSections;
    },
  };
  const windowRef = {
    innerHeight: 800,
    getComputedStyle: (element) => ({ position: element.computedPosition }),
    addEventListener() {},
    removeEventListener() {},
  };

  const result = initializeStackingScroll(documentRef, windowRef, undefined);
  assert.deepEqual(result.sections, expectedSections);
  assert.equal(receivedSelector, STACKING_SECTION_SELECTOR);
  assert.match(receivedSelector, /\.hero/);
  assert.match(receivedSelector, /\.page-hero/);
});

test('les couches augmentent dans l’ordre du document', () => {
  const sections = [section(300), section(300), section(300)];
  applyStackingLayers(sections);
  assert.deepEqual(sections.map((item) => item.style.zIndex), ['1', '2', '3']);
});

test('les sections hautes restent lisibles et le mode non sticky nettoie le top inline', () => {
  const tall = section(1200);
  const short = section(600);
  const mobile = section(900, 'relative');
  mobile.style.top = '-100px';

  updateStickySectionTops([tall, short, mobile], 800, (item) => item.computedPosition);

  assert.equal(tall.style.top, '-400px');
  assert.equal(short.style.top, '0px');
  assert.equal(mobile.style.top, '');
});

test('resize et ResizeObserver recalculent les positions puis se nettoient', () => {
  const sections = [section(900), section(500)];
  const listeners = new Map();
  const observed = [];
  let disconnected = false;
  class Observer {
    constructor(callback) { this.callback = callback; }
    observe(item) { observed.push(item); }
    disconnect() { disconnected = true; }
  }
  const documentRef = { querySelectorAll: () => sections };
  const windowRef = {
    innerHeight: 800,
    getComputedStyle: (item) => ({ position: item.computedPosition }),
    addEventListener: (name, callback) => listeners.set(name, callback),
    removeEventListener: (name, callback) => {
      if (listeners.get(name) === callback) listeners.delete(name);
    },
  };

  const controller = initializeStackingScroll(documentRef, windowRef, Observer);
  assert.equal(sections[0].style.top, '-100px');
  assert.deepEqual(observed, sections);

  windowRef.innerHeight = 1000;
  listeners.get('resize')();
  assert.equal(sections[0].style.top, '0px');

  controller.destroy();
  assert.equal(listeners.has('resize'), false);
  assert.equal(disconnected, true);
});

test('les ancres utilisent la hauteur cumulée depuis page-hero', () => {
  const hero = section(280);
  const first = section(720);
  const target = section(500);
  hero.nextElementSibling = first;
  first.nextElementSibling = target;
  const documentRef = { querySelector: () => hero };

  assert.equal(getSectionScrollTarget(first, documentRef), 280);
  assert.equal(getSectionScrollTarget(target, documentRef), 1000);

  const outside = section(200);
  outside.offsetTop = 1450;
  assert.equal(getSectionScrollTarget(outside, documentRef), 1450);
});

test('les règles CSS ciblées activent le sticky desktop et le désactivent sur mobile', async () => {
  const [pagesCss, heroCss, responsiveCss] = await Promise.all([
    read('src/styles/pages.css'),
    read('src/styles/hero.css'),
    read('src/styles/responsive.css'),
  ]);

  const pageHeroRule = findCssRule(pagesCss, '.page-hero').declarations;
  assert.match(pageHeroRule, /position:\s*sticky;/);
  assert.match(pageHeroRule, /top:\s*0;/);
  assert.match(pageHeroRule, /z-index:\s*0;/);

  const desktopSectionRule = findCssRule(heroCss, '.page-hero ~ section').declarations;
  assert.match(desktopSectionRule, /position:\s*sticky;/);
  assert.match(desktopSectionRule, /top:\s*0;/);

  const mobileSectionRule = findCssRule(
    responsiveCss,
    '.page-hero ~ section',
    /@media\s*\(max-width:\s*768px\)/,
  ).declarations;
  assert.match(mobileSectionRule, /position:\s*relative;/);
});
