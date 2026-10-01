/**
 * L4 · DOM 契约（与 antd 6.6.4 的实测 DOM 比对）
 *
 * 基准：`tests/compat/baselines/steps.dom.json`（由 `tests/compat/baseline/steps.mjs`
 * 直接 `renderToStaticMarkup` 渲染 antd 的 `Steps` 产出，机械 oracle）。
 *
 * ── 这个契约覆盖什么、不覆盖什么 ──────────────────────────────────────────────
 *
 * ✅ 覆盖：**十个语义槽**（root / item / itemWrapper / itemIcon / itemSection /
 *    itemHeader / itemTitle / itemSubtitle / itemContent / itemRail）的层序与类名、
 *    `current` / `initial` / `status` / `percent` / `size` / `variant` / `type` 四态 /
 *    方向与标题位置（含 deprecated 别名）/ `maxCount` / `ellipsis` / `offset`、
 *    `items` 的字段面（`subTitle` / `content` / deprecated `description` / `icon` /
 *    `disabled` / `className` / `style` / 数字 `key`）。
 * ❌ 不覆盖：**交互**（点击切换、`onChange`）与**响应式**（`responsive` + `useBreakpoint`
 *    在 SSR 下没有 `matchMedia` ⇒ `xs` 恒 false ⇒ 方向恒 horizontal；窄屏归 L6）。
 *
 * ⚠️ `progressDot` / `description` / `direction` / `labelPlacement` 会发 deprecated 告警
 * （antd 同款）—— 契约比对不看告警，`demo.test.ts` 里才管。
 */

import { type DomRenderResult, domContractTest } from '@apollo-design/test-utils';
import { defineComponent, h, provide, type VNodeChild } from 'vue';
import baseline from '../../../../../tests/compat/baselines/steps.dom.json';
import {
  type ConfigContextValue,
  configContextKey,
  DEFAULT_CONFIG_CONTEXT,
} from '../../config-provider/context';
import type { StepItem, StepsProps } from '../interface';
import { Steps } from '../Steps';

const PREFIX = 'apollo';

function withConfig(config: Partial<ConfigContextValue>, children: () => VNodeChild) {
  return defineComponent({
    name: 'AStepsCompatConfigProbe',
    setup() {
      provide(configContextKey, { ...DEFAULT_CONFIG_CONTEXT, ...config });
      return () => children();
    },
  });
}

/** ⚠️ 用 `as const` 元组 + 具名常量，避免 `ITEMS[i]`（`noUncheckedIndexedAccess` 下是 `StepItem | undefined`）。 */
const ITEM_A: StepItem = { title: 'Finished', content: 'This is a description.' };
const ITEM_B: StepItem = { title: 'In Progress', content: 'This is a description.' };
const ITEM_C: StepItem = { title: 'Waiting', content: 'This is a description.' };
const ITEMS: StepItem[] = [ITEM_A, ITEM_B, ITEM_C];

const base = { prefixCls: PREFIX, items: ITEMS };

const specs: Record<
  string,
  { props: StepsProps & Record<string, unknown>; ctx?: Partial<ConfigContextValue>; bare?: boolean }
> = {
  'steps:basic': { props: { ...base } },
  'steps:prefix-cls:no-props': { props: { items: ITEMS }, bare: true },
  'steps:prefix-cls:custom': { props: { prefixCls: 'custom', items: ITEMS } },
  'steps:rtl': { props: { ...base }, ctx: { direction: 'rtl' } },
  'steps:items-empty': { props: { ...base, items: [] } },

  'steps:current-1': { props: { ...base, current: 1 } },
  'steps:current-out-of-range': { props: { ...base, current: 9 } },
  'steps:initial': { props: { ...base, initial: 1, current: 2 } },
  'steps:item-status-error': {
    props: {
      ...base,
      items: [ITEM_A, { ...ITEM_B, status: 'error' }, ITEM_C],
    },
  },
  'steps:item-status-finish': {
    props: {
      ...base,
      items: [{ ...ITEM_A, status: 'finish' }, { ...ITEM_B, status: 'wait' }, ITEM_C],
    },
  },
  'steps:percent': { props: { ...base, percent: 60 } },

  'steps:size-small': { props: { ...base, size: 'small' } },
  'steps:size-medium': { props: { ...base, size: 'medium' } },
  'steps:variant-outlined': { props: { ...base, variant: 'outlined' } },
  'steps:variant-filled': { props: { ...base, variant: 'filled' } },

  'steps:orientation-vertical': { props: { ...base, orientation: 'vertical' } },
  'steps:direction-vertical-deprecated': { props: { ...base, direction: 'vertical' } },
  'steps:title-placement-vertical': { props: { ...base, titlePlacement: 'vertical' } },
  'steps:label-placement-vertical-deprecated': { props: { ...base, labelPlacement: 'vertical' } },
  'steps:responsive-false': { props: { ...base, responsive: false } },

  'steps:type-navigation': { props: { ...base, type: 'navigation' } },
  'steps:type-inline': { props: { ...base, type: 'inline' } },
  'steps:type-panel': { props: { ...base, type: 'panel' } },
  'steps:type-dot': { props: { ...base, type: 'dot' } },
  'steps:progress-dot-deprecated': { props: { ...base, progressDot: true } },

  'steps:item-subtitle': {
    props: { ...base, items: [{ ...ITEM_A, subTitle: '00:00' }, ITEM_B, ITEM_C] },
  },
  'steps:item-description-deprecated': {
    props: {
      ...base,
      items: [
        { title: 'A', description: 'legacy description' },
        { title: 'B', description: 'legacy description' },
      ],
    },
  },
  'steps:item-icon': {
    props: {
      ...base,
      items: [{ ...ITEM_A, icon: h('span', { class: 'my-icon' }, 'i') }, ITEM_B, ITEM_C],
    },
  },
  'steps:item-disabled': {
    props: { ...base, items: [ITEM_A, { ...ITEM_B, disabled: true }, ITEM_C] },
  },
  'steps:item-class-style': {
    props: {
      ...base,
      items: [{ ...ITEM_A, className: 'item-cls', style: { color: 'red' } }, ITEM_B, ITEM_C],
    },
  },
  'steps:key-number': {
    props: {
      ...base,
      items: [
        { key: 0, title: 'A' },
        { key: 1, title: 'B' },
      ],
    },
  },

  'steps:max-count': {
    props: {
      ...base,
      maxCount: 3,
      current: 4,
      items: [
        { title: 'A' },
        { title: 'B' },
        { title: 'C' },
        { title: 'D' },
        { title: 'E' },
        { title: 'F' },
      ],
    },
  },
  'steps:ellipsis-false': {
    props: {
      ...base,
      ellipsis: false,
      items: [
        { title: 'A very long step title that would be truncated' },
        { title: 'B very long step title that would be truncated' },
      ],
    },
  },
  'steps:offset': { props: { ...base, type: 'inline', offset: 1 } },

  'steps:class-names': {
    props: {
      ...base,
      classNames: {
        root: 'custom-root',
        item: 'custom-item',
        itemWrapper: 'custom-item-wrapper',
        itemIcon: 'custom-item-icon',
        itemSection: 'custom-item-section',
        itemHeader: 'custom-item-header',
        itemTitle: 'custom-item-title',
        itemSubtitle: 'custom-item-subtitle',
        itemContent: 'custom-item-content',
        itemRail: 'custom-item-rail',
      },
    },
  },
  'steps:styles': {
    props: {
      ...base,
      styles: { root: { background: '#fafafa' }, itemTitle: { fontWeight: 'bold' } },
    },
  },
  'steps:class-names-fn': {
    props: {
      ...base,
      orientation: 'vertical',
      classNames: ({ props }) => ({ root: `dir-${String(props.orientation)}`, item: 'fn-item' }),
    },
  },
};

domContractTest('Steps', {
  baseline,
  keepStyle: true,
  allow: {
    // 默认前缀不同（裁决 `prefix-cls-default` = A）：`bare` 用例下两侧的根前缀分别是
    // antd 的 `ant` 与我们的 `apollo` ⇒ **每一层带前缀的元素**都不同
    // （含根上的 `--*-cmp-steps-items-offset` 变量名）。
    'steps:prefix-cls:no-props': {
      reason: 'D1 · 默认根前缀 apollo vs ant（bare 用例，28 条）',
      deviationId: 'D1',
      diff: [
        '$/div[0]: 类名不同 [ant-steps ant-steps-filled ant-steps-horizontal ant-steps-title-horizontal] vs [apollo-steps apollo-steps-filled apollo-steps-horizontal apollo-steps-title-horizontal]',
        '$/div[0]: style 不同 [--ant-cmp-steps-items-offset:0] vs [--apollo-cmp-steps-items-offset:0]',
        '$/div[0]/div[0]: 类名不同 [ant-steps-item ant-steps-item-active ant-steps-item-process] vs [apollo-steps-item apollo-steps-item-active apollo-steps-item-process]',
        '$/div[0]/div[0]/div[0]: 类名不同 [ant-steps-item-wrapper] vs [apollo-steps-item-wrapper]',
        '$/div[0]/div[0]/div[0]/div[0]: 类名不同 [ant-steps-item-icon ant-wave-target] vs [ant-wave-target apollo-steps-item-icon]',
        '$/div[0]/div[0]/div[0]/div[0]/span[0]: 类名不同 [ant-steps-item-icon-number] vs [apollo-steps-item-icon-number]',
        '$/div[0]/div[0]/div[0]/div[1]: 类名不同 [ant-steps-item-section] vs [apollo-steps-item-section]',
        '$/div[0]/div[0]/div[0]/div[1]/div[0]: 类名不同 [ant-steps-item-header] vs [apollo-steps-item-header]',
        '$/div[0]/div[0]/div[0]/div[1]/div[0]/div[0]: 类名不同 [ant-steps-item-title] vs [apollo-steps-item-title]',
        '$/div[0]/div[0]/div[0]/div[1]/div[0]/div[1]: 类名不同 [ant-steps-item-rail ant-steps-item-rail-wait] vs [apollo-steps-item-rail apollo-steps-item-rail-wait]',
        '$/div[0]/div[0]/div[0]/div[1]/div[1]: 类名不同 [ant-steps-item-content] vs [apollo-steps-item-content]',
        '$/div[0]/div[1]: 类名不同 [ant-steps-item ant-steps-item-wait] vs [apollo-steps-item apollo-steps-item-wait]',
        '$/div[0]/div[1]/div[0]: 类名不同 [ant-steps-item-wrapper] vs [apollo-steps-item-wrapper]',
        '$/div[0]/div[1]/div[0]/div[0]: 类名不同 [ant-steps-item-icon ant-wave-target] vs [ant-wave-target apollo-steps-item-icon]',
        '$/div[0]/div[1]/div[0]/div[0]/span[0]: 类名不同 [ant-steps-item-icon-number] vs [apollo-steps-item-icon-number]',
        '$/div[0]/div[1]/div[0]/div[1]: 类名不同 [ant-steps-item-section] vs [apollo-steps-item-section]',
        '$/div[0]/div[1]/div[0]/div[1]/div[0]: 类名不同 [ant-steps-item-header] vs [apollo-steps-item-header]',
        '$/div[0]/div[1]/div[0]/div[1]/div[0]/div[0]: 类名不同 [ant-steps-item-title] vs [apollo-steps-item-title]',
        '$/div[0]/div[1]/div[0]/div[1]/div[0]/div[1]: 类名不同 [ant-steps-item-rail ant-steps-item-rail-wait] vs [apollo-steps-item-rail apollo-steps-item-rail-wait]',
        '$/div[0]/div[1]/div[0]/div[1]/div[1]: 类名不同 [ant-steps-item-content] vs [apollo-steps-item-content]',
        '$/div[0]/div[2]: 类名不同 [ant-steps-item ant-steps-item-wait] vs [apollo-steps-item apollo-steps-item-wait]',
        '$/div[0]/div[2]/div[0]: 类名不同 [ant-steps-item-wrapper] vs [apollo-steps-item-wrapper]',
        '$/div[0]/div[2]/div[0]/div[0]: 类名不同 [ant-steps-item-icon ant-wave-target] vs [ant-wave-target apollo-steps-item-icon]',
        '$/div[0]/div[2]/div[0]/div[0]/span[0]: 类名不同 [ant-steps-item-icon-number] vs [apollo-steps-item-icon-number]',
        '$/div[0]/div[2]/div[0]/div[1]: 类名不同 [ant-steps-item-section] vs [apollo-steps-item-section]',
        '$/div[0]/div[2]/div[0]/div[1]/div[0]: 类名不同 [ant-steps-item-header] vs [apollo-steps-item-header]',
        '$/div[0]/div[2]/div[0]/div[1]/div[0]/div[0]: 类名不同 [ant-steps-item-title] vs [apollo-steps-item-title]',
        '$/div[0]/div[2]/div[0]/div[1]/div[1]: 类名不同 [ant-steps-item-content] vs [apollo-steps-item-content]',
      ],
    },
    // React 侧是 SSR **字符串**（`#fafafa` 原样），Vue 侧经真实 DOM 的 CSSOM 读回时
    // 被规范化为 `rgb(250,250,250)` —— 语义完全等价（D114 家族）。
    'steps:styles': {
      reason: 'PLATFORM · CSSOM 把十六进制色规范化成 rgb()，语义等价',
      deviationId: 'D114',
      diff: [
        '$/div[0]: style 不同 [--apollo-cmp-steps-items-offset:0;background:#fafafa] vs [--apollo-cmp-steps-items-offset:0;background:rgb(250,250,250)]',
      ],
    },
  },
  render: (id) => {
    const spec = specs[id];
    if (!spec) {
      throw new Error(`[Steps L4] 用例 "${id}" 缺少 Vue 侧规格 —— baseline 与 specs 失配`);
    }
    const vnode = h(Steps, spec.props as never);
    if (spec.bare) return vnode;
    const result: DomRenderResult = spec.ctx ? withConfig(spec.ctx, () => vnode) : vnode;
    return result;
  },
});
