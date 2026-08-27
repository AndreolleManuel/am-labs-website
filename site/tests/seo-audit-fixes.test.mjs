import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const homePath = new URL('../index.html', import.meta.url);
const home = await readFile(homePath, 'utf8');

function attribute(tag, name) {
  return tag.match(new RegExp(`\\b${name}=["']([^"']+)["']`, 'i'))?.[1];
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
