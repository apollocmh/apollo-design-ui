/**
 * L4 · DOM 契约 —— BorderBeam
 *
 * ── 基准是什么 ────────────────────────────────────────────────────────────────
 *
 * `tests/compat/baselines/border-beam.dom.json`。⚠️ BorderBeam 的 Effect 是
 * **客户端 portal**（antd createPortal 到 child DOM；SSR 时 hostDom 为 null，
 * Effect 返回 null）—— 两条渲染路径在这一点上平台一致，基线只钉「宿主透传 +
 * Effect 不出现在 SSR」。Effect 的结构/CSS 变量串由 L1（挂载后查询）钉死，
 * 视觉由 L6 覆盖。
 */

import { type DomRenderResult, domContractTest } from '@apollo-design/test-utils';
import { h, type VNode } from 'vue';

import baseline from '../../../../../tests/compat/baselines/border-beam.dom.json';
import { BorderBeam } from '../index';

const HOST_STYLE = { position: 'relative', border: '2px solid #ddd', padding: '16px' };
// ⚠️ 元素 vnode 的 children 必须是数组（元素上传函数 children 会被 Vue 静默忽略
// —— 只有组件 vnode 支持插槽函数；semantic.test.ts 曾因此渲染出空宿主）
const host = (children: VNode[]) => h('div', { style: HOST_STYLE }, children);

const specs: Record<string, { render: () => DomRenderResult }> = {
  'border-beam:prefix-cls:no-props': {
    render: () => host([h(BorderBeam, {}, () => h('div', null, 'x'))]),
  },
  'border-beam:basic': {
    render: () =>
      host([h(BorderBeam, { prefixCls: 'apollo-border-beam' }, () => h('div', null, 'x'))]),
  },
  'border-beam:props': {
    render: () =>
      host([
        h(
          BorderBeam,
          {
            prefixCls: 'apollo-border-beam',
            color: 'blue',
            count: 3,
            duration: 9,
            lineWidth: 8,
            outset: 6,
            size: 160,
          },
          () => h('div', null, 'x'),
        ),
      ]),
  },
};

domContractTest('BorderBeam', {
  baseline,
  keepStyle: true,
  allow: {
    // PLATFORM：客户端 CSSOM 把 #ddd 序列化为 rgb(221,221,221)（React SSR 字符串拼接）。
    // 三个用例共用同一个宿主 div —— 差异逐条列出。
    'border-beam:prefix-cls:no-props': {
      reason: 'PLATFORM · CSSOM 颜色序列化 #ddd → rgb(221,221,221)',
      diff: [
        '$/div[0]: style 不同 [border:2pxsolid#ddd;padding:16px;position:relative] vs [border:2pxsolidrgb(221,221,221);padding:16px;position:relative]',
      ],
    },
    'border-beam:basic': {
      reason: 'PLATFORM · CSSOM 颜色序列化 #ddd → rgb(221,221,221)',
      diff: [
        '$/div[0]: style 不同 [border:2pxsolid#ddd;padding:16px;position:relative] vs [border:2pxsolidrgb(221,221,221);padding:16px;position:relative]',
      ],
    },
    'border-beam:props': {
      reason: 'PLATFORM · CSSOM 颜色序列化 #ddd → rgb(221,221,221)',
      diff: [
        '$/div[0]: style 不同 [border:2pxsolid#ddd;padding:16px;position:relative] vs [border:2pxsolidrgb(221,221,221);padding:16px;position:relative]',
      ],
    },
  },
  render: (id) => {
    const spec = specs[id];
    if (!spec) throw new Error(`[BorderBeam L4] 用例 "${id}" 缺少 Vue 侧规格`);
    return spec.render();
  },
});
