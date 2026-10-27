import { describe, expect, it } from 'vitest';
import { avatarContractDifferences } from './contract-differences';
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

  // React 的 className + rootClassName 在 Vue 侧是同一个原生 `class`。
  'avatar:className': {
    props: { class: ['user-cls', 'root-cls'] },
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
    groupProps: { max: { count: 1 } },
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
    groupProps: { class: ['g-cls', 'g-root'] },
    slots: { default: () => kids(2) },
  },
};

/** 「字符串 `src`」用例共有的 React 19 SSR 预加载豁免。 */
domContractTest('Avatar', {
  baseline,
  keepStyle: true,
  allow: avatarContractDifferences,
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

describe('Avatar reference preservation', () => {
  it('retains every original scenario and no unused difference allowance', () => {
    const ids = baseline.cases.map((c) => c.id).sort();
    expect(ids).toHaveLength(31);
    expect(Object.keys(specs).sort()).toEqual(ids);
    for (const id of Object.keys(avatarContractDifferences)) expect(ids).toContain(id);
  });
});
