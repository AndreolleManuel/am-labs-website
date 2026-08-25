import assert from 'node:assert/strict';
import test from 'node:test';

globalThis.window = { location: { href: 'https://amlabs.dev/', pathname: '/' } };
globalThis.HTMLAnchorElement = class {};

const { classifyClick } = await import('../src/js/clickAnalytics.js');

function anchor(href, classes = []) {
  const element = new HTMLAnchorElement();
  element.dataset = {};
  element.classList = { contains: (name) => classes.includes(name) };
  element.getAttribute = (name) => (name === 'href' ? href : null);
  return element;
}

test('classe les contacts sans conserver les coordonnées', () => {
  assert.deepEqual(classifyClick(anchor('mailto:contact@amlabs.dev')), {
    eventName: 'email',
    target: 'email',
  });
  assert.deepEqual(classifyClick(anchor('tel:+33645543161')), {
    eventName: 'phone',
    target: 'phone',
  });
});

test('classe les pages métier sans requête ni ancre', () => {
  assert.deepEqual(classifyClick(anchor('/services/assistant-ia/?source=home#prix')), {
    eventName: 'service',
    target: '/services/assistant-ia/',
  });
  assert.deepEqual(classifyClick(anchor('/realisations/atelier-clamart/')), {
    eventName: 'project',
    target: '/realisations/atelier-clamart/',
  });
});

test('classe les liens externes par domaine seulement', () => {
  assert.deepEqual(classifyClick(anchor('https://www.linkedin.com/in/manuel-andreolle/?trk=site')), {
    eventName: 'external',
    target: 'www.linkedin.com',
  });
});

test('ignore les liens de navigation ordinaires', () => {
  assert.equal(classifyClick(anchor('/a-propos/')), null);
});
