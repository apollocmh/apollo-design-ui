/**
 * L4 · DOM 契约（与 antd 6.6.4 的实测 DOM 比对）
 *
 * ── 基准是什么 ────────────────────────────────────────────────────────────────
 *
 * `tests/compat/baselines/timeline.dom.json`，由 `tests/compat/baseline/timeline.mjs`
 * 直接调用 `react-dom/server.renderToStaticMarkup` 渲染 antd 的 `Timeline` 产出。
 * 机械 oracle，不是「我们读了源码之后写下的期望值」。
 *
 * ── 🚨 这个契约的 DOM 是 **Steps 的 DOM** ─────────────────────────────────────
 *
 * `Timeline` **没有自己的 DOM**（是 `Steps` 的薄壳）⇒ 产物里同时有 `-steps-*` 与
 * `-timeline-*` 两组类名，**根是 `<ol>`、项是 `<li>`**（由 `InnerContext` 覆盖）。
 * 这不是噪音 —— 它就是 Timeline 的真实契约。
 *
 * ── 这个契约覆盖什么、不覆盖什么 ──────────────────────────────────────────────
 *
 * ✅ 覆盖：`ol` / `li` 的标签覆盖、`-timeline` 与 `-timeline-layout-alternate` /
 *    `-timeline-horizontal` / `-timeline-rtl` 的条件类、八键 classNames 映射、
 *    `-item-placement-{start,end}` 的推导、`titleSpan` 的内联 CSS 变量、
 *    `color` 的两条分支（预设类 / 内联变量）、`loading` 与 `pending` 的追加项、
 *    四个废弃别名的转换。
 * ❌ 不覆盖：视觉（归 L6）；`Steps` 自己的契约（归它的 L4）。
 *
 * ── 🚨 一条必须记住的判据 ────────────────────────────────────────────────────
 *
 * **每个用例都包 `ConfigProvider`，但两侧都「不传 `prefixCls` prop」** ——
 * 统一靠 Provider 的根前缀。
 */

import { type DomRenderResult, domContractTest } from '@apollo-design/test-utils';
import { defineComponent, h, provide, type VNodeChild } from 'vue';
import baseline from '../../../../../tests/compat/baselines/timeline.dom.json';
import {
  type ConfigContextValue,
  configContextKey,
  DEFAULT_CONFIG_CONTEXT,
} from '../../config-provider/context';
import { Timeline } from '../index';
import type { TimelineItemType, TimelineProps } from '../interface';

/** 在指定的 ConfigProvider 上下文下渲染（Vue 侧对应物是 `provide`）。 */
function withConfig(config: Partial<ConfigContextValue>, children: () => VNodeChild) {
  return defineComponent({
    name: 'ATimelineCompatConfigProbe',
    setup() {
      provide(configContextKey, { ...DEFAULT_CONFIG_CONTEXT, ...config });
      return () => children();
    },
  });
}

const ITEMS: TimelineItemType[] = [
  { key: 'a', title: 'Create a services site', content: '2015-09-01' },
  { key: 'b', title: 'Solve initial network problems', content: '2015-09-01' },
  { key: 'c', title: 'Technical testing', content: '2015-09-01' },
];
const ITEMS_NO_TITLE: TimelineItemType[] = [
  { key: 'a', content: 'no title A' },
  { key: 'b', content: 'no title B' },
];
const ITEMS4: TimelineItemType[] = [
  { key: 'a', title: 'A', content: 'content A' },
  { key: 'b', title: 'B', content: 'content B' },
  { key: 'c', title: 'C', content: 'content C' },
  { key: 'd', title: 'D', content: 'content D' },
];

/** 用例规格表：id → Vue 侧的 props / ctx。 */
const specs: Record<
  string,
  {
    props?: TimelineProps & Record<string, unknown>;
    ctx?: Partial<ConfigContextValue>;
    /** 不包 ConfigProvider（用来钉「默认根前缀」的差异 D1）。 */
    bare?: boolean;
  }
> = {
  'timeline:basic': { props: { items: ITEMS } },
  // ⚠️ **不包 ConfigProvider** ⇒ 根前缀回落各家默认值（antd `ant` vs 我们 `apollo`）⇒ D1
  'timeline:prefix-cls:no-props': { props: { items: ITEMS }, bare: true },
  'timeline:prefix-cls:custom': { props: { prefixCls: 'custom', items: ITEMS } },

  'timeline:layout-alternate-by-title': { props: { items: ITEMS } },
  'timeline:layout-vertical-single': { props: { items: ITEMS_NO_TITLE } },
  'timeline:layout-alternate-explicit': { props: { mode: 'alternate', items: ITEMS4 } },
  'timeline:layout-horizontal': {
    props: { orientation: 'horizontal', items: ITEMS4 },
  },

  'timeline:mode-left': { props: { mode: 'left', items: ITEMS } },
  'timeline:mode-right': { props: { mode: 'right', items: ITEMS } },

  'timeline:title-span-number': { props: { titleSpan: 8, items: ITEMS } },
  'timeline:title-span-string': { props: { titleSpan: '40%', items: ITEMS } },
  'timeline:title-span-alternate': {
    props: { mode: 'alternate', titleSpan: 8, items: ITEMS4 },
  },

  'timeline:color-preset': {
    props: {
      items: [
        { key: 'a', title: 'blue', color: 'blue' },
        { key: 'b', title: 'red', color: 'red' },
        { key: 'c', title: 'green', color: 'green' },
        { key: 'd', title: 'gray', color: 'gray' },
      ],
    },
  },
  'timeline:color-custom': {
    props: {
      items: [{ key: 'a', title: 'custom', color: '#00f', style: { color: '#333' } }],
    },
  },

  'timeline:loading': {
    props: {
      items: [
        { key: 'a', title: 'loading', loading: true },
        { key: 'b', title: 'done' },
      ],
    },
  },
  'timeline:item-icon': {
    props: { items: [{ key: 'a', title: 'A', icon: h('span', { class: 'my-icon' }, 'i') }] },
  },
  'timeline:item-aliases': {
    props: {
      items: [
        {
          key: 'a',
          label: 'LABEL',
          children: 'CHILD',
          dot: h('span', { class: 'my-dot' }, 'd'),
        },
      ],
    },
  },
  'timeline:pending': { props: { pending: 'Recording...', items: ITEMS_NO_TITLE } },
  'timeline:pending-dot': {
    props: {
      pending: 'Recording...',
      pendingDot: h('span', { class: 'my-pending' }, 'p'),
      items: ITEMS_NO_TITLE,
    },
  },

  'timeline:reverse': { props: { reverse: true, items: ITEMS } },
  'timeline:variant-filled': { props: { variant: 'filled', items: ITEMS } },
  'timeline:variant-outlined': { props: { variant: 'outlined', items: ITEMS } },

  'timeline:className': {
    props: { className: 'my-cls', rootClassName: 'my-root', items: ITEMS },
  },
  'timeline:style': {
    props: { style: { backgroundColor: '#fde3cf', color: '#f56a00' }, items: ITEMS },
  },
  'timeline:attrs': { props: { id: 'my-id', 'data-x': 'y', items: ITEMS } },
  'timeline:rtl': { props: { items: ITEMS }, ctx: { direction: 'rtl' } },

  'timeline:empty': { props: { items: [] } },
  'timeline:semantic': {
    props: {
      items: ITEMS,
      classNames: { item: 'my-item', itemTitle: 'my-title', itemRail: 'my-rail' },
      styles: { item: { margin: '1px' }, itemTitle: { color: 'rgb(1, 2, 3)' } },
    },
  },
};

domContractTest('Timeline', {
  baseline,
  keepStyle: true,
  allow: {
    // 默认前缀不同（裁决 `prefix-cls-default` = A）：`bare` 用例下两侧的根前缀分别是
    // antd 的 `ant` 与我们的 `apollo` ⇒ **每一层带前缀的元素**都不同。
    // ⚠️ 差异清单是**实测值**（L4 断言「恰好这些」）。
    'timeline:prefix-cls:no-props': {
      reason: 'D1 · 默认根前缀 apollo vs ant（bare 用例）',
      deviationId: 'D1',
      diff: [
        '$/ol[0]: 类名不同 [ant-steps ant-steps-dot ant-steps-outlined ant-steps-title-horizontal ant-steps-vertical ant-timeline ant-timeline-layout-alternate] vs [apollo-steps apollo-steps-dot apollo-steps-outlined apollo-steps-title-horizontal apollo-steps-vertical apollo-timeline apollo-timeline-layout-alternate]',
        '$/ol[0]: style 不同 [--ant-cmp-steps-items-offset:0] vs [--apollo-cmp-steps-items-offset:0]',
        '$/ol[0]/li[0]: 类名不同 [ant-steps-item ant-steps-item-finish ant-timeline-item ant-timeline-item-placement-start] vs [apollo-steps-item apollo-steps-item-finish apollo-timeline-item apollo-timeline-item-placement-start]',
        '$/ol[0]/li[0]/div[0]: 类名不同 [ant-steps-item-wrapper ant-timeline-item-wrapper] vs [apollo-steps-item-wrapper apollo-timeline-item-wrapper]',
        '$/ol[0]/li[0]/div[0]/div[0]: 类名不同 [ant-steps-item-icon ant-timeline-item-icon ant-wave-target] vs [ant-wave-target apollo-steps-item-icon apollo-timeline-item-icon]',
        '$/ol[0]/li[0]/div[0]/div[1]: 类名不同 [ant-steps-item-section ant-timeline-item-section] vs [apollo-steps-item-section apollo-timeline-item-section]',
        '$/ol[0]/li[0]/div[0]/div[1]/div[0]: 类名不同 [ant-steps-item-header ant-timeline-item-header] vs [apollo-steps-item-header apollo-timeline-item-header]',
        '$/ol[0]/li[0]/div[0]/div[1]/div[0]/div[0]: 类名不同 [ant-steps-item-title ant-timeline-item-title] vs [apollo-steps-item-title apollo-timeline-item-title]',
        '$/ol[0]/li[0]/div[0]/div[1]/div[0]/div[1]: 类名不同 [ant-steps-item-rail ant-steps-item-rail-finish ant-timeline-item-rail] vs [apollo-steps-item-rail apollo-steps-item-rail-finish apollo-timeline-item-rail]',
        '$/ol[0]/li[0]/div[0]/div[1]/div[1]: 类名不同 [ant-steps-item-content ant-timeline-item-content] vs [apollo-steps-item-content apollo-timeline-item-content]',
        '$/ol[0]/li[1]: 类名不同 [ant-steps-item ant-steps-item-finish ant-timeline-item ant-timeline-item-placement-start] vs [apollo-steps-item apollo-steps-item-finish apollo-timeline-item apollo-timeline-item-placement-start]',
        '$/ol[0]/li[1]/div[0]: 类名不同 [ant-steps-item-wrapper ant-timeline-item-wrapper] vs [apollo-steps-item-wrapper apollo-timeline-item-wrapper]',
        '$/ol[0]/li[1]/div[0]/div[0]: 类名不同 [ant-steps-item-icon ant-timeline-item-icon ant-wave-target] vs [ant-wave-target apollo-steps-item-icon apollo-timeline-item-icon]',
        '$/ol[0]/li[1]/div[0]/div[1]: 类名不同 [ant-steps-item-section ant-timeline-item-section] vs [apollo-steps-item-section apollo-timeline-item-section]',
        '$/ol[0]/li[1]/div[0]/div[1]/div[0]: 类名不同 [ant-steps-item-header ant-timeline-item-header] vs [apollo-steps-item-header apollo-timeline-item-header]',
        '$/ol[0]/li[1]/div[0]/div[1]/div[0]/div[0]: 类名不同 [ant-steps-item-title ant-timeline-item-title] vs [apollo-steps-item-title apollo-timeline-item-title]',
        '$/ol[0]/li[1]/div[0]/div[1]/div[0]/div[1]: 类名不同 [ant-steps-item-rail ant-steps-item-rail-finish ant-timeline-item-rail] vs [apollo-steps-item-rail apollo-steps-item-rail-finish apollo-timeline-item-rail]',
        '$/ol[0]/li[1]/div[0]/div[1]/div[1]: 类名不同 [ant-steps-item-content ant-timeline-item-content] vs [apollo-steps-item-content apollo-timeline-item-content]',
        '$/ol[0]/li[2]: 类名不同 [ant-steps-item ant-steps-item-active ant-steps-item-finish ant-timeline-item ant-timeline-item-placement-start] vs [apollo-steps-item apollo-steps-item-active apollo-steps-item-finish apollo-timeline-item apollo-timeline-item-placement-start]',
        '$/ol[0]/li[2]/div[0]: 类名不同 [ant-steps-item-wrapper ant-timeline-item-wrapper] vs [apollo-steps-item-wrapper apollo-timeline-item-wrapper]',
        '$/ol[0]/li[2]/div[0]/div[0]: 类名不同 [ant-steps-item-icon ant-timeline-item-icon ant-wave-target] vs [ant-wave-target apollo-steps-item-icon apollo-timeline-item-icon]',
        '$/ol[0]/li[2]/div[0]/div[1]: 类名不同 [ant-steps-item-section ant-timeline-item-section] vs [apollo-steps-item-section apollo-timeline-item-section]',
        '$/ol[0]/li[2]/div[0]/div[1]/div[0]: 类名不同 [ant-steps-item-header ant-timeline-item-header] vs [apollo-steps-item-header apollo-timeline-item-header]',
        '$/ol[0]/li[2]/div[0]/div[1]/div[0]/div[0]: 类名不同 [ant-steps-item-title ant-timeline-item-title] vs [apollo-steps-item-title apollo-timeline-item-title]',
        '$/ol[0]/li[2]/div[0]/div[1]/div[1]: 类名不同 [ant-steps-item-content ant-timeline-item-content] vs [apollo-steps-item-content apollo-timeline-item-content]',
      ],
    },
    // CSSOM 把十六进制色规范化成 rgb()，语义等价（D114 家族）。
    // ⚠️ 这条同时证明「用户的 `style` 走了 `styles.root` 语义槽」——
    //    两侧的 `--cmp-steps-items-offset` 与用户样式都在根元素上、顺序一致。
    'timeline:style': {
      reason: 'PLATFORM · CSSOM 把十六进制色规范化成 rgb()，语义等价',
      deviationId: 'D114',
      diff: [
        '$/ol[0]: style 不同 [--apollo-cmp-steps-items-offset:0;background-color:#fde3cf;color:#f56a00] vs [--apollo-cmp-steps-items-offset:0;background-color:rgb(253,227,207);color:rgb(245,106,0)]',
      ],
    },
    // CSSOM 把十六进制色规范化成 rgb()，语义等价（D114 家族）。
    'timeline:color-custom': {
      reason: 'PLATFORM · CSSOM 把十六进制色规范化成 rgb()，语义等价',
      deviationId: 'D114',
      diff: [
        '$/ol[0]/li[0]: style 不同 [--apollo-cmp-steps-item-icon-dot-color:#00f;color:#333] vs [--apollo-cmp-steps-item-icon-dot-color:#00f;color:rgb(51,51,51)]',
      ],
    },
  },
  render: (id) => {
    const spec = specs[id];
    if (!spec) {
      throw new Error(`[Timeline L4] 用例 "${id}" 缺少 Vue 侧规格 —— baseline 与 specs 失配`);
    }
    const vnode = h(Timeline, spec.props as never);
    if (spec.bare) return vnode;
    const result: DomRenderResult = spec.ctx ? withConfig(spec.ctx, () => vnode) : vnode;
    return result;
  },
});
