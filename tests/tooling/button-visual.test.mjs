import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCases } from '../visual/matrix.mjs';

test('Button owns 13 states at three viewports while preserving all 27 reference cases and approved type IDs', () => {
  const cases = buildCases({ component: 'button', apollo: true });
  assert.equal(cases.length, 39);
  assert.equal(new Set(cases.map((c) => c.id)).size, 39);
  assert.equal(buildCases({ component: 'button' }).length, 27);
  assert.deepEqual(
    buildCases({ component: 'button', apollo: true, variants: ['type'] }),
    buildCases({ component: 'button', variants: ['type'] }),
  );
  assert.throws(() => buildCases({ component: 'button', variants: ['native-focus'] }));
});
