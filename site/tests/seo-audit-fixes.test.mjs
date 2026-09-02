import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const homePath = new URL('../index.html', import.meta.url);
const home = await readFile(homePath, 'utf8');
const creation = await readFile(new URL('../services/creation-site-web/index.html', import.meta.url), 'utf8');
const localAgency = await readFile(new URL('../agence-web-montelimar/index.html', import.meta.url), 'utf8');
const maintenance = await readFile(new URL('../services/maintenance-site-web/index.html', import.meta.url), 'utf8');
const sitemap = await readFile(new URL('../public/sitemap.xml', import.meta.url), 'utf8');

function attribute(tag, name) {
  return tag.match(new RegExp(`\\b${name}=["']([^"']+)["']`, 'i'))?.[1];
}

function textContent(fragment) {
  return fragment.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function title(page) {
  return textContent(page.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? '');
}

function h1(page) {
  return textContent(page.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? '');
}

function structuredData(page, type) {
  const scripts = [...page.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const document = scripts.map((match) => ({ match: match[0], value: JSON.parse(match[1]) }))
    .find(({ value }) => value['@type'] === type);

  assert.ok(document, `données structurées ${type} absentes`);
  return document;
}

async function pngDimensions(path) {
  const image = await readFile(new URL(`../public${path}`, import.meta.url));
  assert.equal(image.toString('ascii', 1, 4), 'PNG', `format PNG invalide : ${path}`);
  return {
    width: String(image.readUInt32BE(16)),
    height: String(image.readUInt32BE(20)),
  };
}

test('le H2 de la zone locale nomme explicitement Montélimar', () => {
  const localSection = home.match(/<section\b[^>]*\bid=["']zones["'][^>]*>([\s\S]*?)<\/section>/i)?.[1] ?? '';
  const heading = localSection.match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/i)?.[1] ?? '';
  const text = heading.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  assert.match(text, /\bMontélimar\b/);
});

test('les trois images des réalisations déclarent leurs dimensions intrinsèques exactes', async () => {
  const expectedSources = [
    '/screenshots/toolinnov-home.png',
    '/screenshots/atelier-planning.png',
    '/screenshots/dashboard.png',
  ];
  const projects = home.match(/<section\b[^>]*\bid=["']projects["'][^>]*>([\s\S]*?)<\/section>/i)?.[1] ?? '';
  const projectImages = [...projects.matchAll(/<img\b[^>]*>/gi)].map((match) => match[0]);

  assert.equal(projectImages.length, expectedSources.length);

  for (const src of expectedSources) {
    const tag = projectImages.find((image) => attribute(image, 'src') === src);
    const dimensions = await pngDimensions(src);

    assert.ok(tag, `image de réalisation absente : ${src}`);
    assert.equal(attribute(tag, 'width'), dimensions.width, `largeur incorrecte : ${src}`);
    assert.equal(attribute(tag, 'height'), dimensions.height, `hauteur incorrecte : ${src}`);
  }
});

test('les intentions SEO création et agence locale restent distinctes', () => {
  assert.match(title(creation), /Création de site web sur mesure/i);
  assert.match(h1(creation), /Création de site web sur mesure/i);
  assert.doesNotMatch(title(creation), /Montélimar|Drôme|Ardèche/i);
  assert.doesNotMatch(h1(creation), /Montélimar|Drôme|Ardèche/i);

  assert.match(title(localAgency), /Agence web à Montélimar/i);
  assert.match(h1(localAgency), /Agence web à Montélimar/i);
});

test('la page création réserve les références locales au bloc secondaire', () => {
  const localSectionMatch = creation.match(/<section\b[^>]*\bid=["']zone-intervention["'][^>]*>[\s\S]*?<\/section>/i);
  assert.ok(localSectionMatch, 'bloc local secondaire absent');
  assert.match(localSectionMatch[0], /Montélimar|Drôme|Ardèche/i);
  assert.match(localSectionMatch[0], /href=["']\/agence-web-montelimar\/["']/i);

  const business = structuredData(creation, 'ProfessionalService');
  assert.equal(business.value.address?.addressLocality, 'Montélimar');
  assert.equal(business.value.address?.addressRegion, 'Drôme');
  assert.equal(business.value.areaServed, undefined, 'la zone du fournisseur ne doit pas cibler le service');
  assert.doesNotMatch(business.value.description ?? '', /Montélimar|Drôme|Ardèche/i);

  const pageSpecificContent = creation
    .replace(localSectionMatch[0], '')
    .replace(business.match, '');
  assert.doesNotMatch(pageSpecificContent, /Montélimar|Drôme|Ardèche/i);
});

test('les pages création et maintenance restent indexables, canoniques et au sitemap', () => {
  const pages = [
    {
      html: creation,
      url: 'https://amlabs.dev/services/creation-site-web/',
    },
    {
      html: maintenance,
      url: 'https://amlabs.dev/services/maintenance-site-web/',
    },
  ];

  for (const page of pages) {
    const canonical = page.html.match(/<link\b[^>]*rel=["']canonical["'][^>]*>/i)?.[0] ?? '';
    const robots = page.html.match(/<meta\b[^>]*name=["']robots["'][^>]*>/i)?.[0] ?? '';

    assert.equal(attribute(canonical, 'href'), page.url);
    assert.equal(attribute(robots, 'content')?.toLowerCase(), 'index, follow');
    assert.match(sitemap, new RegExp(`<loc>${page.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</loc>`));
  }
});
