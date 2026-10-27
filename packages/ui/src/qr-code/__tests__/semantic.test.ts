import { mergeButtonContentReferenceAllowances } from '../../_internal/__tests__/button-content-reference';
import buttonContentDifferences from './button-content-reference-diffs.json';
/**
 * L4 · DOM 契约（与 antd 6.6.4 的实测 DOM 比对）—— QrCode
 *
 * 基准：`tests/compat/baselines/qr-code.dom.json`（机械 oracle，8 个用例，
 * 产出者 `tests/compat/baseline/qr-code.mjs`）。`keepStyle: true`。
 *
 * ⚠️ SVG path 的 `d` 由 QR 矩阵唯一决定 —— engine 与 antd 同源（Nayuki
 *    qrcodegen）⇒ byte 级对齐。
 */

import { type DomRenderResult, domContractTest } from '@apollo-design/test-utils';
import { expect, it } from 'vitest';
import { h } from 'vue';
import baseline from '../../../../../tests/compat/baselines/qr-code.dom.json';
import { QrCode } from '../index';
import differences from './native-contract-reference-diffs.json';

/** 用例规格表：id → Vue 侧渲染产物。必须覆盖基线里的每一个用例。 */
const specs: Record<string, { render: () => DomRenderResult }> = {
  'qr-code:basic': { render: () => h(QrCode, { value: 'https://apollo.design' }) },
  'qr-code:borderless': {
    render: () => h(QrCode, { value: 'https://apollo.design', bordered: false }),
  },

  'qr-code:svg': {
    render: () => h(QrCode, { value: 'https://apollo.design', type: 'svg' }),
  },
  'qr-code:svg-color': {
    render: () =>
      h(QrCode, {
        value: 'https://apollo.design',
        type: 'svg',
        color: '#1677ff',
        bgColor: '#f0f5ff',
      }),
  },

  'qr-code:status-expired': {
    render: () =>
      h(QrCode, { value: 'https://apollo.design', status: 'expired', onRefresh: () => {} }),
  },
  'qr-code:status-scanned': {
    render: () => h(QrCode, { value: 'https://apollo.design', status: 'scanned' }),
  },
  'qr-code:status-loading': {
    render: () => h(QrCode, { value: 'https://apollo.design', status: 'loading' }),
  },

  'qr-code:semantic': {
    render: () =>
      h(QrCode, {
        value: 'https://apollo.design',
        classNames: { root: 'cls-root', cover: 'cls-cover' },
        styles: { root: { padding: '8px' } },
      }),
  },
};

/** Exact owned differences; full projection also checks SVG paths and native attributes. */
it('retains all eight reference cases and verifies their complete native SVG attributes', () => {
  expect(baseline.cases).toHaveLength(8);
  const ids = baseline.cases.map((item) => item.id).sort();
  expect(Object.keys(specs).sort()).toEqual(ids);
  expect(Object.keys(differences).sort()).toEqual(ids);
});

domContractTest('QrCode', {
  baseline,
  profile: 'full',
  keepStyle: true,
  allow: mergeButtonContentReferenceAllowances(
    buttonContentDifferences,
    Object.fromEntries(
      Object.entries(differences).map(([id, diff]) => [
        id,
        {
          reason:
            'Apollo uses named native images and a default white host; explicit backgrounds retain CSSOM color normalization. The loading case retains the reviewed native Spin differences. All eight original cases and SVG paths are checked in full; see docs/migrations/qrcode-contracts.md.',
          diff,
        },
      ]),
    ),
  ),
  render: (id) => {
    const spec = specs[id];
    if (!spec) throw new Error(`[QrCode L4] Missing retained case ${id}`);
    return spec.render();
  },
});
