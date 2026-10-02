/**
 * L4 · DOM 契约（与 antd 6.6.4 的实测 DOM 比对）
 *
 * ── 基准是什么 ────────────────────────────────────────────────────────────────
 *
 * `tests/compat/baselines/avatar.dom.json`，由 `tests/compat/baseline/avatar.mjs`
 * 直接调用 `react-dom/server.renderToStaticMarkup` 渲染 antd 的 `Avatar` 产出。
 * 机械 oracle，不是「我们读了源码之后写下的期望值」。
 *
 * ── 这个契约覆盖什么、不覆盖什么 ──────────────────────────────────────────────
 *
 * ✅ 覆盖：`<span>` 根 + `-string` span 的两层结构、**五路互斥分支**的产物、
 *    类名的条件组合（`-lg` / `-sm` / `-circle` / `-square` / `-image` / `-icon`）、
 *    数字尺寸的**内联** width/height/fontSize、`Avatar.Group` 的截断与 context 透传、
 *    `data-*` / `aria-*` 的落点。
 * ❌ 不覆盖：**`scale` 的测量**（SSR 里恒 `opacity:0`、没有 transform —— 客户端行为归 L1）、
 *    `onError` 的回退（需要真实 error 事件，归 L1）、浮层（`max` 的 Popover 默认不展开）。
 *
 * ── 🚨 两条必须记住的判据（都实测过）─────────────────────────────────────────
 *
 * 1. **每个用例都包 `ConfigProvider`，但两侧都「不传 `prefixCls` prop」**：
 *    `Avatar.Group` 内部那个「+N」头像是 `<Avatar>`（**不带 prefixCls**）⇒ 取
 *    `getPrefixCls('avatar')`；子头像若传了 `prefixCls: 'apollo'` 就会**前缀不一致**。
 * 2. **React 19 的 SSR 会给字符串 `src` 注入 `<link rel="preload" as="image">`** ——
 *    那是 **React 运行时**的产物，**不是 antd 的组件 DOM**（客户端挂载后并不存在这个节点）。
 *    ⇒ 所有「字符串 src」用例都登记了豁免（见 `allow`）。
 */

import { type DomRenderResult, domContractTest } from '@apollo-design/test-utils';
import { defineComponent, h, provide, type VNodeChild } from 'vue';
import baseline from '../../../../../tests/compat/baselines/avatar.dom.json';
import {
  type ConfigContextValue,
  configContextKey,
  DEFAULT_CONFIG_CONTEXT,
} from '../../config-provider/context';
import { Avatar, AvatarGroup } from '../index';
import type { AvatarGroupProps, AvatarProps } from '../interface';

/** 在指定的 ConfigProvider 上下文下渲染（Vue 侧对应物是 `provide`）。 */
function withConfig(config: Partial<ConfigContextValue>, children: () => VNodeChild) {
  return defineComponent({
    name: 'AAvatarCompatConfigProbe',
    setup() {
      provide(configContextKey, { ...DEFAULT_CONFIG_CONTEXT, ...config });
      return () => children();
    },
  });
}

const kids = (n: number) =>
  Array.from({ length: n }, (_, i) =>
    h(Avatar, null, { default: () => String.fromCharCode(65 + i) }),
  );

/** 用例规格表：id → Vue 侧的 props / slots / ctx。 */
const specs: Record<
  string,
  {
    props: AvatarProps & Record<string, unknown>;
    /** ⚠️ 本仓的 `children` 是**默认插槽**（规则 C19）⇒ 单独一个字段，不能塞进 props */
    slots?: Record<string, () => VNodeChild>;
    /** `Avatar.Group` 的用例走这里。 */
    group?: boolean;
    groupProps?: AvatarGroupProps & Record<string, unknown>;
    ctx?: Partial<ConfigContextValue>;
    /** 不包 ConfigProvider（用来钉「默认根前缀」的差异 D1）。 */
    bare?: boolean;
  }
> = {
  'avatar:basic': { props: {}, slots: { default: () => 'U' } },
  // ⚠️ **不包 ConfigProvider** ⇒ 根前缀回落各家默认值（antd `ant` vs 我们 `apollo`）⇒ D1
  'avatar:prefix-cls:no-props': { props: {}, slots: { default: () => 'U' }, bare: true },
  'avatar:prefix-cls:custom': { props: { prefixCls: 'custom' }, slots: { default: () => 'U' } },
  'avatar:empty': { props: {} },

  'avatar:shape-square': { props: { shape: 'square' }, slots: { default: () => 'U' } },
  'avatar:shape-circle': { props: { shape: 'circle' }, slots: { default: () => 'U' } },
  'avatar:size-large': { props: { size: 'large' }, slots: { default: () => 'U' } },
  'avatar:size-small': { props: { size: 'small' }, slots: { default: () => 'U' } },
  'avatar:size-medium': { props: { size: 'medium' }, slots: { default: () => 'U' } },
  'avatar:size-number': { props: { size: 40 }, slots: { default: () => 'U' } },
  'avatar:size-number-icon': {
    props: { size: 40, icon: h('span', { class: 'my-icon' }, 'i') },
  },
  'avatar:size-responsive': {
    props: { size: { xs: 24, sm: 32, md: 40, lg: 64, xl: 80, xxl: 100 } },
    slots: { default: () => 'U' },
  },
  'avatar:size-number-square': {
    props: { size: 40, shape: 'square' },
    slots: { default: () => 'U' },
  },

  'avatar:icon': { props: { icon: h('span', { class: 'my-icon' }, 'i') } },
  'avatar:src-string': { props: { src: 'x.png' } },
  'avatar:src-string-attrs': {
    props: {
      src: 'x.png',
      srcSet: 'x.png 2x',
      alt: 'a',
      crossOrigin: 'anonymous',
      draggable: false,
    },
  },
  'avatar:src-vnode': { props: { src: h('span', { class: 'my-src' }, 'S') } },
  'avatar:src-and-icon': {
    props: { src: 'x.png', icon: h('span', { class: 'my-icon' }, 'i') },
  },
  'avatar:draggable-string': { props: { src: 'x.png', draggable: 'false' } },

  'avatar:className': {
    props: { className: 'user-cls', rootClassName: 'root-cls' },
    slots: { default: () => 'U' },
  },
  'avatar:style': {
    props: { style: { backgroundColor: '#fde3cf', color: '#f56a00' } },
    slots: { default: () => 'U' },
  },
  'avatar:attrs': {
    props: { 'data-testid': 'av', 'aria-label': '头像' },
    slots: { default: () => 'U' },
  },

  'avatar:group': { props: {}, group: true, groupProps: {}, slots: { default: () => kids(3) } },
  'avatar:group-empty': { props: {}, group: true, groupProps: {} },
  'avatar:group-max': {
    props: {},
    group: true,
    groupProps: { max: { count: 1 } },
    slots: { default: () => kids(3) },
  },
  'avatar:group-max-style': {
    props: {},
    group: true,
    groupProps: { max: { count: 1, style: { color: '#f56a00' } } },
    slots: { default: () => kids(3) },
  },
  'avatar:group-max-count-deprecated': {
    props: {},
    group: true,
    groupProps: { maxCount: 1 },
    slots: { default: () => kids(3) },
  },
  'avatar:group-max-no-truncate': {
    props: {},
    group: true,
    groupProps: { max: { count: 5 } },
    slots: { default: () => kids(3) },
  },
  'avatar:group-size-shape': {
    props: {},
    group: true,
    groupProps: { size: 'large', shape: 'square' },
    slots: { default: () => kids(2) },
  },
  'avatar:group-rtl': {
    props: {},
    group: true,
    groupProps: {},
    slots: { default: () => kids(2) },
    ctx: { direction: 'rtl' },
  },
  'avatar:group-className': {
    props: {},
    group: true,
    groupProps: { className: 'g-cls', rootClassName: 'g-root' },
    slots: { default: () => kids(2) },
  },
};

/** 「字符串 `src`」用例共有的 React 19 SSR 预加载豁免。 */
const REACT_PRELOAD_REASON =
  'PLATFORM · React 19 的 `renderToStaticMarkup` 会为字符串 `src` 的 `<img>` 注入 `<link rel="preload" as="image">`（React 运行时的 SSR 优化，**不是 antd 的组件 DOM**；客户端挂载后并不存在该节点）。';

domContractTest('Avatar', {
  baseline,
  keepStyle: true,
  allow: {
    // 默认前缀不同（裁决 `prefix-cls-default` = A）：`bare` 用例下两侧的根前缀分别是
    // antd 的 `ant` 与我们的 `apollo` ⇒ **每一层带前缀的元素**都不同。
    'avatar:prefix-cls:no-props': {
      reason: 'D1 · 默认根前缀 apollo vs ant（bare 用例）',
      deviationId: 'D1',
      diff: [
        '$/span[0]: 类名不同 [ant-avatar ant-avatar-circle] vs [apollo-avatar apollo-avatar-circle]',
        '$/span[0]/span[0]: 类名不同 [ant-avatar-string] vs [apollo-avatar-string]',
      ],
    },
    // CSSOM 把十六进制色规范化成 rgb()，语义等价（D114 家族）。
    'avatar:style': {
      reason: 'PLATFORM · CSSOM 把十六进制色规范化成 rgb()，语义等价',
      deviationId: 'D114',
      diff: [
        '$/span[0]: style 不同 [background-color:#fde3cf;color:#f56a00] vs [background-color:rgb(253,227,207);color:rgb(245,106,0)]',
      ],
    },
    'avatar:group-max-style': {
      reason: 'PLATFORM · CSSOM 把十六进制色规范化成 rgb()，语义等价',
      deviationId: 'D114',
      diff: ['$/div[0]/span[1]: style 不同 [color:#f56a00] vs [color:rgb(245,106,0)]'],
    },
    ...Object.fromEntries(
      [
        'avatar:src-string',
        'avatar:src-string-attrs',
        'avatar:src-and-icon',
        'avatar:draggable-string',
      ].map((id) => [
        id,
        {
          reason: REACT_PRELOAD_REASON,
          deviationId: 'D115',
          diff: ['$: 根节点数不同 2 vs 1'],
        },
      ]),
    ),
  },
  render: (id) => {
    const spec = specs[id];
    if (!spec) {
      throw new Error(`[Avatar L4] 用例 "${id}" 缺少 Vue 侧规格 —— baseline 与 specs 失配`);
    }
    const vnode = spec.group
      ? h(AvatarGroup, (spec.groupProps ?? {}) as never, spec.slots as never)
      : h(Avatar, spec.props as never, spec.slots as never);
    if (spec.bare) return vnode;
    const result: DomRenderResult = spec.ctx ? withConfig(spec.ctx, () => vnode) : vnode;
    return result;
  },
});
