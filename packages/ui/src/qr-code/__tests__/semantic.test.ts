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
import { h } from 'vue';
import baseline from '../../../../../tests/compat/baselines/qr-code.dom.json';
import { QrCode } from '../index';

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

/**
 * CSSOM 管线噪声（PLATFORM，carousel 的 left:0 同族）：React SSR 把用户传入的
 * `bgColor: '#f0f5ff'` 原样输出，本管线（jsdom mount）经 CSSOM 规范化为
 * `rgb(240,245,255)`。计算值完全一致，差异只在原始属性字符串。
 */
const CSSOM_BG_COLOR = {
  reason:
    "用户传入的 bgColor '#f0f5ff' 在 React SSR 是原始 hex 字符串，本管线（jsdom mount）经 CSSOM 规范化为 rgb(240,245,255)。计算值一致 —— 渲染管线差异，非实现缺陷。登记 COMPATIBILITY §9.1（PLATFORM）。",
  diff: [
    '$/div[0]: style 不同 [background-color:#f0f5ff;height:160px;width:160px] vs [background-color:rgb(240,245,255);height:160px;width:160px]',
  ],
} as const;

domContractTest('QrCode', {
  baseline,
  keepStyle: true,
  allow: {
    'qr-code:svg-color': CSSOM_BG_COLOR,
  },
  render: (id) => {
    const spec = specs[id];
    if (!spec)
      throw new Error(`[QrCode L4] 用例 "${id}" 缺少 Vue 侧规格 —— baseline 与 specs 失配`);
    return spec.render();
  },
});
