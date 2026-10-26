import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCases } from '../visual/matrix.mjs';

test('Apollo Image registers controls, progress, group and local dark/compact states at all viewports', () => {
  const cases = buildCases({ component: 'image', apollo: true });
  assert.equal(cases.length, 24);
  for (const variant of [
    'basic',
    'cover',
    'preview',
    'rich',
    'progress',
    'group',
    'theme-dark',
    'theme-compact',
  ]) {
    assert.deepEqual(
      cases.filter((item) => item.variant === variant).map((item) => item.viewport),
      ['mobile', 'tablet', 'desktop'],
    );
  }
  assert.equal(new Set(cases.map((item) => item.id)).size, 24);
});

test('Apollo Image additions keep the optional reference matrix and unrelated components stable', () => {
  assert.equal(buildCases({ component: 'image' }).length, 9);
  assert.throws(() => buildCases({ component: 'image', variants: ['rich'] }));
  assert.deepEqual(
    buildCases({ component: 'button', apollo: true }),
    buildCases({ component: 'button' }),
  );
});
