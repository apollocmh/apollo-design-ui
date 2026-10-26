import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCases } from '../visual/matrix.mjs';

test('Result owns all 13 states at three viewports and retains every historical reference', () => {
  const cases = buildCases({ component: 'result', apollo: true });
  assert.equal(cases.length, 39);
  assert.equal(new Set(cases.map((c) => c.id)).size, 39);
  assert.equal(buildCases({ component: 'result' }).length, 9);
  assert.throws(() => buildCases({ component: 'result', variants: ['native-focus'] }));
});
