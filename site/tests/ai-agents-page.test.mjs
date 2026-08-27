import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { findCssRule } from './helpers/css-rules.mjs';

const htmlPath = new URL('../services/assistant-ia-sur-mesure/index.html', import.meta.url);
const cssPath = new URL('../src/styles/ai-agents.css', import.meta.url);
const html = readFileSync(htmlPath, 'utf8');
const css = readFileSync(cssPath, 'utf8');

const main = html.match(/<main[^>]*>([\s\S]*?)<\/main>/)?.[1] ?? '';
const mainText = main.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const count = (pattern, source = html) => [...source.matchAll(pattern)].length;

test('la page présente une offre unifiée assistants et agents IA', () => {
  assert.match(html, /<body class="ai-agents-page">/);
  assert.match(html, /Assistants et agents IA sur mesure/i);
  assert.match(mainText, /Un assistant vous aide\. Un agent fait avancer le travail\./i);
  assert.match(mainText, /validation humaine/i);
});

test('les exemples de productivité restent des projections explicites', () => {
  assert.equal(count(/class="ai-use-case/g), 3);
  assert.match(main, /Support client/i);
  assert.match(main, /Suivi commercial/i);
  assert.match(main, /Traitement documentaire/i);
  assert.match(main, /2 h 40/i);
  assert.match(main, /2 heures/i);
  assert.match(main, /8 heures/i);
  assert.match(main, /projections? à adapter/i);
  assert.doesNotMatch(main, /gain garanti/i);
});

test('la page garde une structure éditoriale courte et accessible', () => {
  assert.equal(count(/<h1\b/g, main), 1);
  assert.ok(count(/<section\b/g, main) <= 6, 'la page ne doit pas dépasser six sections');
  assert.ok(count(/<details\b/g, main) <= 3, 'la FAQ doit rester compacte');
  assert.match(html, /aria-label="Exemple de déroulement d'un agent IA"/);
});

test('la variante design reste AM Labs avec un thème clair violet sobre', () => {
  assert.match(css, /\.ai-agents-page\s*\{/);
  assert.match(css, /--color-bg:\s*#f7f7f8/i);
  assert.match(css, /--color-accent:\s*#59156d/i);
  assert.match(css, /--color-text:\s*#111214/i);
  assert.doesNotMatch(css, /--ai-(bg|green|lime|ink|paper)/i);
  assert.doesNotMatch(css, /backdrop-filter|filter:\s*blur|animation:/i);
  assert.doesNotMatch(html, /#0c0b14|ai-agents-light\.css/i);
  assert.match(css, /@media\s*\(max-width:\s*768px\)/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});

test('les surfaces atténuées sont nettement séparées du fond clair', () => {
  assert.match(css, /--color-bg:\s*#f7f7f8/i);
  assert.match(css, /--color-surface:\s*#ffffff/i);
  assert.match(css, /--color-border:\s*rgba\(42,\s*0,\s*53,\s*0\.18\)/i);
  const casesGrid = findCssRule(css, '.ai-agents-page .ai-cases-grid').declarations;
  const flowItem = findCssRule(css, '.ai-agents-page .ai-flow-item').declarations;
  assert.match(casesGrid, /border:\s*1px solid var\(--color-border\);/);
  assert.match(casesGrid, /background:\s*var\(--color-surface\);/);
  assert.match(flowItem, /background:\s*var\(--color-surface\);/);
});
