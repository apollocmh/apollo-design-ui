/**
 * L4 · DOM 契约（与 antd 6.6.4 的实测 DOM 比对）
 *
 * ── 基准是什么 ────────────────────────────────────────────────────────────────
 *
 * `tests/compat/baselines/color-picker.dom.json`，由 `tests/compat/baseline/color-picker.mjs`
 * 直接调用 `react-dom/server.renderToStaticMarkup` 渲染 antd 的 `ColorPicker` 产出。
 * 机械 oracle，不是「我们读了源码之后写下的期望值」。
 *
 * ── 🚨 这个契约**只覆盖触发器** —— 面板归 L6 ─────────────────────────────────
 *
 * 实测两条事实（都在 `baseline/color-picker.mjs` 里钉成用例）：
 * 1. **`open` 时面板在 Portal 里 ⇒ SSR 产物没有面板**（上游告警原文：
 *    `Portal only work in client side…`）⇒ 用例 `open-no-portal` 就是这条**事实哨兵**；
 * 2. `_InternalPanelDoNotUseOrYouWillBeFired`（PurePanel）在 SSR 下**也不渲染面板**
 *    （`open` 由 `useEffect` 置真，SSR 不跑 effect）⇒ 同样拿不到。
 *
 * ⇒ **面板的 DOM 契约由 L6 视觉层（真浏览器）承担**。这是**有意的分工**，不是疏漏：
 *    为拿不到 DOM 的形态造 L4 用例，只会得到一条永远空转的假绿灯。
 *
 * ── 这个契约覆盖什么 ─────────────────────────────────────────────────────────
 *
 * ✅ 覆盖：`.{p}-trigger` 的**类名条件组合**（`-active` / `-disabled` / `-sm` / `-lg` /
 *    `-rtl`）、**清空态 vs 色块态**的分叉（`color.cleared` 判据）、`-trigger-text` 的
 *    **六种文案分支**（默认 hex / `format=rgb` / `format=hsb` / alpha<100 的 `#RRGGBB,NN%` /
 *    cleared 的 `Transparent` / 函数形态）、`children` 覆盖触发器、
 *    `data-*` / `aria-*` 的落点、语义化四槽 + 嵌套 `popup`。
 * ❌ 不覆盖：**面板的一切**（见上）、`showText` 的渐变分支（需要 `mode: 'gradient'`
 *    且渐变值在 SSR 下与单色同路 —— 那条走 L1）。
 *
 * ── 🚨 两条必须记住的判据 ─────────────────────────────────────────────────────
 *
 * 1. **每个非 `bare` 用例都包 `ConfigProvider` 且两侧都传 `prefixCls: 'apollo'`** ——
 *    `getPrefixCls('color-picker', 'apollo')` 返回**字面量 `'apollo'`**（customizePrefixCls
 *    整词生效，不是「拼后缀」）⇒ 两侧的类名都是 `apollo-trigger` / `apollo-color-block`，
 *    与 antd 的 `ant-*` 无关。`bare` 用例才用来钉 D1。
 * 2. **`aria-describedby` 两侧必然不同**：上游 `open` 时由 React 的 `useId` 生成
 *    （`_R_7_`），本仓走自己的 id 方案 ⇒ 用 `ignoreAttrs` 排除（登记 D 家族）。
 */

import { type DomRenderResult, domContractTest } from '@apollo-design/test-utils';
import { defineComponent, h, provide, type VNodeChild } from 'vue';
import baseline from '../../../../../tests/compat/baselines/color-picker.dom.json';
import {
  type ConfigContextValue,
  configContextKey,
  DEFAULT_CONFIG_CONTEXT,
} from '../../config-provider/context';
import { ColorPicker } from '../index';
import type { ColorPickerProps } from '../interface';

/** 两侧共用的前缀。与 `tests/compat/baseline/color-picker.mjs` 里的 `PREFIX` 必须一致。 */
const PREFIX = 'apollo';
const BLUE = '#1677ff';

/** 在指定的 ConfigProvider 上下文下渲染（Vue 侧对应物是 `provide`）。 */
function withConfig(config: Partial<ConfigContextValue>, children: () => VNodeChild) {
  return defineComponent({
    name: 'AColorPickerCompatConfigProbe',
    setup() {
      provide(configContextKey, { ...DEFAULT_CONFIG_CONTEXT, ...config });
      return () => children();
    },
  });
}

const BASE = { prefixCls: PREFIX, defaultValue: BLUE };

/** 用例规格表：id → Vue 侧的 props / slots / ctx。 */
const specs: Record<
  string,
  {
    props: ColorPickerProps & Record<string, unknown>;
    /** ⚠️ 本仓的 `children` 是**默认插槽**（规则 C8）⇒ 单独一个字段，不能塞进 props */
    slots?: Record<string, () => VNodeChild>;
    ctx?: Partial<ConfigContextValue>;
    /** 不包 ConfigProvider（用来钉「默认根前缀」的差异 D1）。 */
    bare?: boolean;
  }
> = {
  'color-picker:basic': { props: { ...BASE } },
  'color-picker:cleared': { props: { prefixCls: PREFIX } },
  'color-picker:default-value-null': { props: { prefixCls: PREFIX, defaultValue: null } },
  // ⚠️ **不包 ConfigProvider** ⇒ 根前缀回落各家默认值（antd `ant` vs 我们 `apollo`）⇒ D1
  'color-picker:prefix-cls:no-props': { props: {}, bare: true },
  'color-picker:prefix-cls:custom': { props: { prefixCls: 'custom', defaultValue: BLUE } },
  'color-picker:rtl': { props: { ...BASE }, ctx: { direction: 'rtl' } },

  'color-picker:disabled': { props: { ...BASE, disabled: true } },
  'color-picker:disabled-cleared': { props: { prefixCls: PREFIX, disabled: true } },
  'color-picker:size-small': { props: { ...BASE, size: 'small' } },
  'color-picker:size-large': { props: { ...BASE, size: 'large' } },

  'color-picker:show-text': { props: { ...BASE, showText: true } },
  'color-picker:show-text-cleared': { props: { prefixCls: PREFIX, showText: true } },
  'color-picker:show-text-fn': {
    props: {
      ...BASE,
      showText: (color: { toHexString: () => string }) => color.toHexString().toUpperCase(),
    },
  },
  'color-picker:show-text-format-rgb': { props: { ...BASE, showText: true, format: 'rgb' } },
  'color-picker:show-text-format-hsb': { props: { ...BASE, showText: true, format: 'hsb' } },
  'color-picker:show-text-alpha': {
    props: { prefixCls: PREFIX, defaultValue: 'rgba(22,119,255,0.5)', showText: true },
  },

  'color-picker:className': {
    props: { ...BASE, className: 'my-cls', rootClassName: 'my-root' },
  },
  'color-picker:attrs': { props: { ...BASE, 'data-testid': 'cp', 'aria-label': '颜色' } },

  'color-picker:children': {
    props: { prefixCls: PREFIX, defaultValue: BLUE },
    slots: { default: () => h('div', { class: 'my-trigger' }, 'T') },
  },

  // 🚨 事实哨兵：`open` 时面板**不在** SSR 产物里（面板归 L6）
  'color-picker:open-no-portal': {
    props: { ...BASE, open: true, placement: 'bottomLeft' },
  },

  'color-picker:class-names': {
    props: {
      ...BASE,
      classNames: {
        root: 'cn-root',
        body: 'cn-body',
        content: 'cn-content',
        description: 'cn-desc',
      },
    },
  },
  'color-picker:class-names-popup': {
    props: { ...BASE, classNames: { root: 'cn-root', popup: { root: 'cn-popup' } } },
  },
  'color-picker:styles': {
    props: {
      ...BASE,
      classNames: { root: 'cn-root' },
      styles: { root: { background: '#fafafa' }, body: { opacity: 0.8 } },
    },
  },
};

domContractTest('ColorPicker', {
  baseline,
  keepStyle: true,
  // 上游 `open` 时由 React 的 `useId` 生成 `aria-describedby`（`_R_7_`），
  // 本仓走自己的 id 方案 ⇒ 两侧必然不同（D 家族，id 生成策略是平台差异）。
  ignoreAttrs: ['aria-describedby'],
  allow: {
    // 默认前缀不同（裁决 `prefix-cls-default` = A）：`bare` 用例下两侧的根前缀分别是
    // antd 的 `ant` 与我们的 `apollo` ⇒ **每一层带前缀的元素**都不同。
    // ⚠️ 该用例**没有 defaultValue** ⇒ 走 `cleared` 分支（渲染 `-clear` 而不是 `-color-block`），
    //    且**裸用**时 `-css-var` 类不出现（`useCSSVarCls` 在没有 Provider 时返回空）。
    'color-picker:prefix-cls:no-props': {
      reason: 'D1 · 默认根前缀 apollo vs ant（bare 用例，cleared 分支）',
      deviationId: 'D1',
      diff: [
        '$/div[0]: 类名不同 [ant-color-picker-trigger] vs [apollo-color-picker-trigger]',
        '$/div[0]/div[0]: 类名不同 [ant-color-picker-clear] vs [apollo-color-picker-clear]',
      ],
    },
    // ✅ `children` 通道的差异**已修**（2026-10-02）：改为经一个渲染函数宿主组件转交
    //    ⇒ `Trigger` 的 `children[0]` 拿到**元素**而不是数组 ⇒ 不再多包一层 `<span>`。
    //    机制与修法见 `ColorPicker.vue` 的 `TriggerHost` 注释与 PITFALLS 330。
    // React 侧是 **SSR**（Portal 不渲染 ⇒ 只有触发器），Vue 侧在 **jsdom 里挂载**
    // ⇒ 浮层真的渲染出来。这条用例的**唯一目的**是钉「面板不在 React 的 SSR 产物里」
    // 这个事实（面板的 DOM 契约归 L6）。两侧渲染方式不同 ⇒ 根节点数必然不同。
    'color-picker:open-no-portal': {
      reason:
        'PLATFORM · React 侧 SSR（Portal 不渲染 ⇒ 1 个根），Vue 侧 jsdom 挂载（浮层渲染 ⇒ 2 个根）。本用例是「面板不归 L4」的事实哨兵。',
      deviationId: 'D5',
      diff: ['$: 根节点数不同 1 vs 2'],
    },
    // CSSOM 把十六进制色规范化成 rgb()，语义等价（D114 家族）。
    'color-picker:styles': {
      reason: 'PLATFORM · CSSOM 把十六进制色规范化成 rgb()，语义等价',
      deviationId: 'D114',
      diff: ['$/div[0]: style 不同 [background:#fafafa] vs [background:rgb(250,250,250)]'],
    },
  },
  render: (id) => {
    const spec = specs[id];
    if (!spec) {
      throw new Error(`[ColorPicker L4] 用例 "${id}" 缺少 Vue 侧规格 —— baseline 与 specs 失配`);
    }
    const vnode = h(ColorPicker, spec.props as never, spec.slots as never);
    if (spec.bare) return vnode;
    const result: DomRenderResult = spec.ctx ? withConfig(spec.ctx, () => vnode) : vnode;
    return result;
  },
});
