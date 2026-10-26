import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCases } from '../visual/matrix.mjs';

test('Skeleton owns 13 distinct states at three viewports while retaining all 24 historical references', () => {
  const cases = buildCases({ component: 'skeleton', apollo: true });
  assert.equal(cases.length, 39);
  assert.equal(new Set(cases.map((c) => c.id)).size, 39);
  assert.equal(buildCases({ component: 'skeleton' }).length, 24);
  assert.throws(() => buildCases({ component: 'skeleton', variants: ['native-focus'] }));
});
