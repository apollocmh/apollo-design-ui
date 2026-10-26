import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCases } from '../visual/matrix.mjs';

test('QRCode owns 12 current states at three viewports and retains the historical matrix', () => {
  const cases = buildCases({ component: 'qr-code', apollo: true });
  assert.equal(cases.length, 36);
  assert.equal(new Set(cases.map((item) => item.id)).size, 36);
  assert.equal(buildCases({ component: 'qr-code' }).length, 9);
  assert.throws(() => buildCases({ component: 'qr-code', variants: ['native-focus'] }));
});
