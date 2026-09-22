/**
 * L4 · DOM 契约（与 antd 6.6.4 的实测 DOM 比对）—— Watermark
 *
 * ── 基准是什么 ────────────────────────────────────────────────────────────────
 *
 * `tests/compat/baselines/watermark.dom.json`，由 `tests/compat/baseline/watermark.mjs`
 * 直接调用 `react-dom/server.renderToStaticMarkup` 渲染 antd 的 Watermark 产出。
 * 机械 oracle。`keepStyle: true`：fixedStyle 与用户 style 的合并顺序是易错点
 * （antd：fixedStyle 在前，**用户 style 可覆盖** position/overflow）。
 *
 * ── 这个测试没有证明什么 ─────────────────────────────────────────────────────
 *   - 没证明 canvas 绘制（水印 div 是运行时 append 的，SSR 不产）—— L1 用 canvas
 *     stub 钉绘制参数，L6 用真实浏览器截图钉最终像素。
 *   - 没证明防篡改 / onRemove（L1 用 MutationObserver 桩驱动）。
 */

import { type DomRenderResult, domContractTest } from '@apollo-design/test-utils';
import { h } from 'vue';
import baseline from '../../../../../tests/compat/baselines/watermark.dom.json';
import { Watermark } from '../index';

/** 用例规格表：id → Vue 侧渲染产物。必须覆盖基线里的每一个用例。 */
const specs: Record<string, { render: () => DomRenderResult }> = {
  'watermark:no-props': { render: () => h(Watermark) },
  'watermark:basic': {
    render: () =>
      h(
        Watermark,
        { content: 'Ant Design' },
        { default: () => h('div', { style: { height: '500px' } }) },
      ),
  },
  'watermark:multi-line': {
    render: () =>
      h(
        Watermark,
        { content: ['Ant Design', { text: 'Happy Working', font: { fontSize: 12 } }] },
        { default: () => h('div', { style: { height: '500px' } }) },
      ),
  },
  'watermark:image': {
    render: () =>
      h(
        Watermark,
        { height: 30, width: 130, image: 'https://test.svg' },
        { default: () => h('div', null, 'x') },
      ),
  },

  'watermark:class-name': {
    render: () => h(Watermark, { className: 'cn' }, { default: () => h('div', null, 'x') }),
  },
  'watermark:root-class-name': {
    render: () => h(Watermark, { rootClassName: 'rcn' }, { default: () => h('div', null, 'x') }),
  },
  'watermark:class-both': {
    render: () =>
      h(
        Watermark,
        { className: 'cn', rootClassName: 'rcn' },
        { default: () => h('div', null, 'x') },
      ),
  },
  'watermark:style-merge': {
    render: () =>
      h(
        Watermark,
        { style: { height: '200px', background: 'red' } },
        { default: () => h('div', null, 'x') },
      ),
  },
  'watermark:style-override-fixed': {
    render: () =>
      h(
        Watermark,
        { style: { position: 'absolute', overflow: 'visible' } },
        { default: () => h('div', null, 'x') },
      ),
  },

  'watermark:gap': {
    render: () =>
      h(Watermark, { content: 'x', gap: [20, 30] }, { default: () => h('div', null, 'x') }),
  },
  'watermark:offset': {
    render: () =>
      h(Watermark, { content: 'x', offset: [10, 20] }, { default: () => h('div', null, 'x') }),
  },
  'watermark:z-index-rotate': {
    render: () =>
      h(
        Watermark,
        { content: 'x', zIndex: 5, rotate: -45 },
        { default: () => h('div', null, 'x') },
      ),
  },
  'watermark:inherit-false': {
    render: () =>
      h(Watermark, { content: 'x', inherit: false }, { default: () => h('div', null, 'x') }),
  },

  'watermark:children-text': {
    render: () => h(Watermark, { content: 'x' }, { default: () => 'plain text' }),
  },
  'watermark:children-multi': {
    render: () =>
      h(Watermark, { content: 'x' }, { default: () => [h('p', null, 'a'), h('p', null, 'b')] }),
  },
  'watermark:children-none': { render: () => h(Watermark, { content: 'x' }) },
  'watermark:font': {
    render: () =>
      h(
        Watermark,
        { content: 'x', font: { color: 'red', fontSize: 20 } },
        { default: () => h('div', null, 'x') },
      ),
  },
};

domContractTest('Watermark', {
  baseline,
  keepStyle: true,
  allow: {},
  render: (id) => {
    const spec = specs[id];
    if (!spec)
      throw new Error(`[Watermark L4] 用例 "${id}" 缺少 Vue 侧规格 —— baseline 与 specs 失配`);
    return spec.render();
  },
});
