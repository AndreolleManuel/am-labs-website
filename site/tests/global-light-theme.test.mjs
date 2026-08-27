import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

const pagePaths = [
  'index.html',
  'agence-web-montelimar/index.html',
  'services/creation-site-web/index.html',
  'services/application-sur-mesure/index.html',
  'services/assistant-ia-sur-mesure/index.html',
  'services/connecteur-erp-ecommerce/index.html',
  'services/audit-seo-numerique/index.html',
  'services/maintenance-site-web/index.html',
  'realisations/atelier-clamart/index.html',
  'realisations/tool-innovation-panama/index.html',
  'realisations/toolinnov-ecommerce/index.html',
  'a-propos/index.html',
  'contact/index.html',
  'mentions-legales/index.html',
  'en/index.html',
  'en/contact/index.html',
  'en/realisations/toolinnov-ecommerce/index.html',
  'en/realisations/atelier-clamart/index.html',
  'en/realisations/tool-innovation-panama/index.html',
];

test('les tokens globaux définissent le thème clair violet atténué', async () => {
  const css = await read('src/styles/variables.css');
  assert.match(css, /--color-bg:\s*#f7f7f8/i);
  assert.match(css, /--color-bg-alt:\s*#efeff1/i);
  assert.match(css, /--color-surface:\s*#ffffff/i);
  assert.match(css, /--color-text:\s*#111214/i);
  assert.match(css, /--color-accent:\s*#59156d/i);
  assert.match(css, /--color-border:\s*rgba\(42,\s*0,\s*53,\s*0\.18\)/i);
});

test('toutes les entrées Vite démarrent sur le fond atténué sans flash sombre', async () => {
  assert.equal(pagePaths.length, 19);
  for (const path of pagePaths) {
    const html = await read(path);
    assert.match(html, /<script type="module" src="\/src\/main\.js"><\/script>/, path);
    assert.match(html, /html,body\{background:#f7f7f8;color:#111214;/i, path);
    assert.doesNotMatch(html, /background:#0c0b14|color:#e8e6f0/i, path);
  }
});

test('le point d’entrée révèle toujours le body masqué par le style initial', async () => {
  const main = await read('src/main.js');
  assert.match(main, /document\.body\.classList\.add\(['"]ready['"]\);/);
});

test('la navigation et le scroll superposé utilisent des surfaces claires lisibles', async () => {
  const [nav, hero, responsive] = await Promise.all([
    read('src/styles/nav.css'),
    read('src/styles/hero.css'),
    read('src/styles/responsive.css'),
  ]);
  assert.match(nav, /\.nav\.scrolled\s*\{[\s\S]*?background:\s*rgba\(247,\s*247,\s*248,\s*0\.96\)/);
  assert.match(nav, /\.nav-submenu\s*\{[\s\S]*?background:\s*var\(--color-surface\)/);
  assert.match(responsive, /\.nav-links\s*\{[\s\S]*?background:\s*var\(--color-bg\)/);
  assert.match(hero, /\.hero ~ \.section,[\s\S]*?box-shadow:\s*0 -16px 38px rgba\(17, 18, 20, 0\.09\)/);
  assert.match(hero, /\.hero-glow\s*\{[\s\S]*?display:\s*none;/);
});

test('les cartes partagées sont atténuées et séparées du fond clair', async () => {
  const [services, contact, pages, projects] = await Promise.all([
    read('src/styles/services.css'),
    read('src/styles/contact.css'),
    read('src/styles/pages.css'),
    read('src/styles/projects.css'),
  ]);
  assert.match(services, /\.service-card\s*\{[\s\S]*?background:\s*var\(--color-surface\);/);
  assert.match(contact, /\.flow-card\s*\{[\s\S]*?background:\s*var\(--color-surface\);/);
  assert.match(contact, /\.flow-module\s*\{[\s\S]*?background:\s*var\(--color-surface\);/);
  assert.match(pages, /\.faq-item\s*\{[\s\S]*?background:\s*var\(--color-surface\);[\s\S]*?border:\s*1px solid var\(--color-border\);/);
  assert.match(pages, /\.metric-card\s*\{[\s\S]*?background:\s*var\(--color-surface\);/);
  assert.match(pages, /\.screenshot-card\s*\{[\s\S]*?background:\s*var\(--color-surface\);/);
  assert.match(projects, /\.project-card\s*\{[\s\S]*?background:\s*var\(--color-surface\);/);
});

test('le thème global évite les anciens fonds codés en dur hors médias plein écran', async () => {
  const files = [
    'src/styles/variables.css',
    'src/styles/nav.css',
    'src/styles/hero.css',
    'src/styles/responsive.css',
    'src/styles/pages.css',
    'src/styles/projects.css',
  ];
  for (const path of files) {
    const css = await read(path);
    assert.doesNotMatch(css, /#0c0b14|#0a0915|#0a0913|#0f0f15|rgba\(10,\s*10,\s*16/i, path);
  }
});

test('la variante globale garde un rythme plus dense sans casser le hero sticky', async () => {
  const [variables, reset, pages, services, hero] = await Promise.all([
    read('src/styles/variables.css'),
    read('src/styles/reset.css'),
    read('src/styles/pages.css'),
    read('src/styles/services.css'),
    read('src/styles/hero.css'),
  ]);
  assert.match(variables, /--space-xl:\s*3rem/);
  assert.match(variables, /--space-2xl:\s*4\.5rem/);
  assert.match(reset, /\.section\s*\{[\s\S]*?padding:\s*var\(--space-2xl\) 0;/);
  assert.match(pages, /\.page-hero\s*\{[\s\S]*?padding:\s*calc\(var\(--nav-height\) \+ 40px\) 0 52px;/);
  assert.match(services, /\.service-card\s*\{[\s\S]*?padding:\s*var\(--space-lg\);/);
  assert.match(hero, /\.hero\s*\{[\s\S]*?min-height:\s*100vh;/);
});
