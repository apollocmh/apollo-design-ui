import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCases } from '../visual/matrix.mjs';

test('Apollo List covers all 19 owned states at every viewport', () => {
  const cases = buildCases({ component: 'list', apollo: true });
  assert.equal(cases.length, 57);
  for (const variant of [
    'basic',
    'meta',
    'actions',
    'bordered',
    'vertical',
    'grid',
    'pagination',
    'loading',
    'loading-fullscreen',
    'empty',
    'size',
    'rtl',
    'extra',
    'nested',
    'tokens',
    'theme-dark',
    'theme-compact',
    'theme-dark-compact',
    'native-focus',
  ]) {
    assert.deepEqual(
      cases.filter((item) => item.variant === variant).map((item) => item.viewport),
      ['mobile', 'tablet', 'desktop'],
    );
  }
  assert.equal(new Set(cases.map((item) => item.id)).size, 57);
});

test('Apollo List leaves historical reference and other component matrices intact', () => {
  assert.equal(buildCases({ component: 'list' }).length, 33);
  assert.throws(() => buildCases({ component: 'list', variants: ['extra'] }));
  assert.equal(buildCases({ component: 'image', apollo: true }).length, 24);
});
