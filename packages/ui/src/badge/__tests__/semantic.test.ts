/**
 * L4 · DOM 契约（与 antd 6.6.4 的实测 DOM 比对）—— Badge（Badge + Ribbon）
 *
 * ── 基准是什么 ────────────────────────────────────────────────────────────────
 *
 * `tests/compat/baselines/badge.dom.json`，由 `tests/compat/baseline/badge.mjs`
 * 直接调用 `react-dom/server.renderToStaticMarkup` 渲染 antd 的 Badge 产出。
 * 机械 oracle。`keepStyle: true`：offset 的 margin/inset、borderColor→boxShadow
 * 的内联样式是本组件最容易写错的地方。
 *
 * ── 刻意不在基线里的用例 ─────────────────────────────────────────────────────
 *
 * **motion 离场**：count 从有到无是客户端时序（zoom-leave），SSR 只钉静态形态。
 *
 * ── 这个测试没有证明什么 ─────────────────────────────────────────────────────
 *   - 没证明数字滚动的过渡（L2 + L6）
 *   - 没证明 processing 波纹动画观感（L6 截图时动画不在比对面）
 */

import { type DomRenderResult, domContractTest } from '@apollo-design/test-utils';
import { h } from 'vue';
import baseline from '../../../../../tests/compat/baselines/badge.dom.json';
import { Badge, Ribbon } from '../index';

const BP = { prefixCls: 'apollo-badge', scrollNumberPrefixCls: 'apollo-scroll-number' };
const RP = { prefixCls: 'apollo-ribbon' };
const Box = () => h('div', null, 'x');

/** 用例规格表：id → Vue 侧渲染产物。必须覆盖基线里的每一个用例。 */
const specs: Record<string, { render: () => DomRenderResult }> = {
  'badge:prefix-cls:no-props': { render: () => h(Badge, { ...BP }, () => Box()) },
  'badge:count-basic': { render: () => h(Badge, { ...BP, count: 5 }, () => Box()) },
  'badge:count-zero': { render: () => h(Badge, { ...BP, count: 0 }, () => Box()) },
  'badge:count-zero-show-zero': {
    render: () => h(Badge, { ...BP, count: 0, showZero: true }, () => Box()),
  },
  'badge:no-count': { render: () => h(Badge, { ...BP }, () => Box()) },
  'badge:count-string': { render: () => h(Badge, { ...BP, count: '99+' }, () => Box()) },
  'badge:overflow': {
    render: () => h(Badge, { ...BP, count: 100, overflowCount: 99 }, () => Box()),
  },
  'badge:dot': { render: () => h(Badge, { ...BP, dot: true, count: 5 }, () => Box()) },
  'badge:dot-only': { render: () => h(Badge, { ...BP, dot: true }, () => Box()) },
  'badge:size-small': { render: () => h(Badge, { ...BP, count: 5, size: 'small' }, () => Box()) },
  'badge:offset': { render: () => h(Badge, { ...BP, count: 5, offset: [10, 10] }, () => Box()) },
  'badge:title-default': {
    render: () => h(Badge, { ...BP, count: 5, title: 'custom' }, () => Box()),
  },
  'badge:custom-color': {
    render: () => h(Badge, { ...BP, count: 5, color: '#2db7f5' }, () => Box()),
  },
  'badge:standalone-count': { render: () => h(Badge, { ...BP, count: 25 }) },
  'badge:standalone-status': { render: () => h(Badge, { ...BP, status: 'success' }) },
  'badge:status-text': { render: () => h(Badge, { ...BP, status: 'success', text: 'Success' }) },
  'badge:status-processing': { render: () => h(Badge, { ...BP, status: 'processing' }) },
  'badge:status-zero-text-show-zero': {
    render: () => h(Badge, { ...BP, status: 'success', text: 0 as never, showZero: true }),
  },
  'badge:status-preset-color': {
    render: () => h(Badge, { ...BP, status: 'success', color: 'blue' }),
  },
  'badge:status-custom-color': {
    render: () => h(Badge, { ...BP, status: 'success', color: '#2db7f5' }),
  },
  'badge:count-and-status': { render: () => h(Badge, { ...BP, count: 5, status: 'success' }) },
  'ribbon:prefix-cls:no-props': { render: () => h(Ribbon, {}, () => h('div', null, 'x')) },
  'ribbon:basic': {
    render: () => h(Ribbon, { ...RP, text: 'Hippopotamus' }, () => h('div', null, 'x')),
  },
  'ribbon:preset-color': {
    render: () => h(Ribbon, { ...RP, text: 't', color: 'green' }, () => h('div', null, 'x')),
  },
  'ribbon:custom-color': {
    render: () => h(Ribbon, { ...RP, text: 't', color: '#2db7f5' }, () => h('div', null, 'x')),
  },
  'ribbon:placement-start': {
    render: () => h(Ribbon, { ...RP, text: 't', placement: 'start' }, () => h('div', null, 'x')),
  },
};

domContractTest('Badge', {
  baseline,
  keepStyle: true,
  allow: {
    'badge:prefix-cls:no-props': {
      reason: 'D6 · 默认前缀 apollo-badge vs ant-badge',
      deviationId: 'D6',
      diff: ['$/span[0]: 类名不同 [ant-badge] vs [apollo-badge]'],
    },
    'ribbon:prefix-cls:no-props': {
      reason: 'D6 · 默认前缀 apollo-ribbon vs ant-ribbon（wrapper/ribbon/content/corner 四层连带）',
      deviationId: 'D6',
      diff: [
        '$/div[0]: 类名不同 [ant-ribbon-wrapper] vs [apollo-ribbon-wrapper]',
        '$/div[0]/div[1]: 类名不同 [ant-ribbon ant-ribbon-placement-end] vs [apollo-ribbon apollo-ribbon-placement-end]',
        '$/div[0]/div[1]/span[0]: 类名不同 [ant-ribbon-content] vs [apollo-ribbon-content]',
        '$/div[0]/div[1]/div[1]: 类名不同 [ant-ribbon-corner] vs [apollo-ribbon-corner]',
      ],
    },
    // PLATFORM：客户端 CSSOM 把 #2db7f5 序列化为 rgb(45,183,245)；React SSR 是字符串拼接。
    // 语义等价（同一颜色），序列化路径差异 —— 与 calc 化简 / min-width:0→0px 同源。
    'badge:custom-color': {
      reason: 'PLATFORM · CSSOM 颜色序列化 #2db7f5 → rgb(45,183,245)',
      diff: ['$/span[0]/sup[1]: style 不同 [background:#2db7f5] vs [background:rgb(45,183,245)]'],
    },
    'badge:status-custom-color': {
      reason: 'PLATFORM · CSSOM 颜色序列化 #2db7f5 → rgb(45,183,245)',
      diff: [
        '$/span[0]/span[0]: style 不同 [background:#2db7f5;color:#2db7f5] vs [background:rgb(45,183,245);color:rgb(45,183,245)]',
      ],
    },
    'ribbon:custom-color': {
      reason: 'PLATFORM · CSSOM 颜色序列化 #2db7f5 → rgb(45,183,245)（corner 的 color 同）',
      diff: [
        '$/div[0]/div[1]: style 不同 [background:#2db7f5] vs [background:rgb(45,183,245)]',
        '$/div[0]/div[1]/div[1]: style 不同 [color:#2db7f5] vs [color:rgb(45,183,245)]',
      ],
    },
  },
  render: (id) => {
    const spec = specs[id];
    if (!spec) throw new Error(`[Badge L4] 用例 "${id}" 缺少 Vue 侧规格 —— baseline 与 specs 失配`);
    return spec.render();
  },
});
