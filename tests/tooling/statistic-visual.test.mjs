import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCases } from '../visual/matrix.mjs';

test('Statistic owns 12 native states at three viewports and retains all 15 historical references', () => {
  const cases = buildCases({ component: 'statistic', apollo: true });
  assert.equal(cases.length, 36);
  assert.equal(new Set(cases.map((x) => x.id)).size, 36);
  assert.equal(buildCases({ component: 'statistic' }).length, 15);
  assert.throws(() => buildCases({ component: 'statistic', variants: ['native-focus'] }));
});
