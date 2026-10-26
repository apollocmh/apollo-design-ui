import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCases } from '../visual/matrix.mjs';

test('Spin owns 15 current states at all three viewports and retains its reference matrix', () => {
  const cases = buildCases({ component: 'spin', apollo: true });
  assert.equal(cases.length, 45);
  assert.equal(new Set(cases.map((item) => item.id)).size, 45);
  assert.equal(buildCases({ component: 'spin' }).length, 24);
  assert.throws(() => buildCases({ component: 'spin', variants: ['native-focus'] }));
});
