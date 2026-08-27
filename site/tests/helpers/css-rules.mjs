import assert from 'node:assert/strict';

const normalizeSelector = (selector) => selector
  .replace(/\s+/g, ' ')
  .replace(/\s*([>+~])\s*/g, ' $1 ')
  .trim();

function matchingBrace(source, openingBrace) {
  let depth = 1;
  for (let index = openingBrace + 1; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1;
    if (source[index] === '}') depth -= 1;
    if (depth === 0) return index;
  }
  return -1;
}

export function parseCssRules(css) {
  const rules = [];
  const source = css.replace(/\/\*[\s\S]*?\*\//g, '');

  function walk(block, atRules = []) {
    let cursor = 0;
    while (cursor < block.length) {
      const openingBrace = block.indexOf('{', cursor);
      if (openingBrace === -1) break;
      const prelude = block.slice(cursor, openingBrace).trim();
      const closingBrace = matchingBrace(block, openingBrace);
      assert.notEqual(closingBrace, -1, `bloc CSS non fermé: ${prelude}`);
      const declarations = block.slice(openingBrace + 1, closingBrace);

      if (prelude.startsWith('@')) {
        walk(declarations, [...atRules, prelude]);
      } else if (prelude) {
        rules.push({
          selectors: prelude.split(',').map(normalizeSelector),
          declarations,
          atRules,
        });
      }
      cursor = closingBrace + 1;
    }
  }

  walk(source);
  return rules;
}

export function findCssRule(css, selector, withinAtRule) {
  const normalized = normalizeSelector(selector);
  const rule = parseCssRules(css).find((candidate) => (
    candidate.selectors.includes(normalized)
    && (!withinAtRule || candidate.atRules.some((atRule) => withinAtRule.test(atRule)))
  ));
  assert.ok(rule, `règle CSS absente: ${selector}`);
  return rule;
}
