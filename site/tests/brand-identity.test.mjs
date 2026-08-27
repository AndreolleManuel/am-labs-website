import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import test from 'node:test';

const SITE_ROOT = new URL('../', import.meta.url).pathname;
const BRAND_ROOT = join(SITE_ROOT, 'public', 'brand');

const BRAND_ASSETS = {
  principal: '/brand/am-labs-principal.svg',
  compact: '/brand/am-labs-compact.svg',
  monogram: '/brand/am-labs-monogramme.svg',
};

function read(relativePath) {
  return readFileSync(join(SITE_ROOT, relativePath), 'utf8');
}

function filesRecursively(root, extension) {
  const result = [];
  for (const entry of readdirSync(root)) {
    if (entry === 'dist' || entry === 'node_modules') continue;
    const absolute = join(root, entry);
    if (statSync(absolute).isDirectory()) {
      result.push(...filesRecursively(absolute, extension));
    } else if (absolute.endsWith(extension)) {
      result.push(absolute);
    }
  }
  return result;
}

test('the three official vector identities are included as self-contained web assets', () => {
  for (const [variant, publicPath] of Object.entries(BRAND_ASSETS)) {
    const absolute = join(SITE_ROOT, 'public', publicPath);
    assert.equal(existsSync(absolute), true, `${variant} asset is missing`);

    const svg = readFileSync(absolute, 'utf8');
    assert.match(svg, /<svg\b/);
    assert.match(svg, /viewBox="[^"]+"/);
    assert.doesNotMatch(svg, /<text\b|font-family=|(?:href|src)=["']https?:\/\//i, `${variant} must not depend on fonts or external resources`);
  }
});

test('navigation and footer use the official compact logo in both languages', () => {
  for (const partial of [
    'public/partials/nav.html',
    'public/partials/nav-en.html',
    'public/partials/footer.html',
    'public/partials/footer-en.html',
  ]) {
    const html = read(partial);
    assert.match(html, /<img[^>]+src="\/brand\/am-labs-compact\.svg"[^>]+alt="AM Labs"/i, partial);
  }
});

test('French and English home heroes display the official principal logo', () => {
  for (const page of ['index.html', 'en/index.html']) {
    const html = read(page);
    assert.match(
      html,
      /class="hero-brand"[^>]*>[\s\S]*?<img[^>]+src="\/brand\/am-labs-principal\.svg"[^>]+alt="AM Labs[^"]*"/i,
      page,
    );
  }
});

test('every source HTML page declares the official monogram favicon', () => {
  const htmlFiles = filesRecursively(SITE_ROOT, '.html');
  assert.ok(htmlFiles.length >= 10, 'expected the complete static site');

  for (const file of htmlFiles) {
    const html = readFileSync(file, 'utf8');
    if (!/<head[\s>]/i.test(html)) continue;
    assert.match(
      html,
      /<link rel="icon" type="image\/svg\+xml" href="\/brand\/am-labs-monogramme\.svg"\s*\/?>/i,
      relative(SITE_ROOT, file),
    );
  }
});

test('the light site uses the official AM Labs violet palette', () => {
  const variables = read('src/styles/variables.css');
  assert.match(variables, /--color-accent:\s*#59156d;/i);
  assert.match(variables, /--color-accent-hover:\s*#2a0035;/i);
  assert.match(variables, /--color-text:\s*#111214;/i);

  const css = filesRecursively(join(SITE_ROOT, 'src', 'styles'), '.css')
    .map((file) => readFileSync(file, 'utf8'))
    .join('\n');
  assert.doesNotMatch(css, /#8b5cf6|#7c3aed|139\s*,\s*92\s*,\s*246|124\s*,\s*58\s*,\s*237/i);
});

test('brand images have explicit responsive presentation rules', () => {
  const nav = read('src/styles/nav.css');
  const hero = read('src/styles/hero.css');
  const footer = read('src/styles/footer.css');

  assert.match(nav, /\.nav-logo img\s*\{/);
  assert.match(hero, /\.hero-brand img\s*\{/);
  assert.match(footer, /\.footer-logo img\s*\{/);
});
