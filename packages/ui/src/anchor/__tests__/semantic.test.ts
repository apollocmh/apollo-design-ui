/**
 * L4 · DOM 契约（与 antd 6.6.4 的实测 DOM 比对）
 *
 * ── 基准是什么 ────────────────────────────────────────────────────────────────
 *
 * `tests/compat/baselines/anchor.dom.json`，由 `tests/compat/baseline/anchor.mjs`
 * 直接调用 `react-dom/server.renderToStaticMarkup` 渲染 antd 的 `Anchor` 产出。
 * 机械 oracle，不是「我们读了源码之后写下的期望值」。
 *
 * ── 这个契约覆盖什么、不覆盖什么 ──────────────────────────────────────────────
 *
 * ✅ 覆盖：`-wrapper` / `.{p}` / `-fixed` / `-wrapper-horizontal` / `-rtl` 的**类名判据**、
 *    `max-height`、链接的两套类名、`title` 属性（仅字符串）、语义化四槽、嵌套展开、
 *    废弃 children 路径、以及 **Affix 的两层结构**。
 * ❌ 不覆盖：`-link-active` / `-ink-visible` / ink 的内联几何 —— 它们来自**滚动侦测**，
 *    而 SSR 不跑 effect、也没有滚动 ⇒ `activeLink` 恒 `null`（真滚动归 **L6**）。
 *
 * ── 🚨 一处必须记住的判据：`AnchorLink` **不继承** `Anchor` 的 `prefixCls` ───────
 *
 * 上游 `AnchorLink` 用的是 `React.useContext(ConfigContext).getPrefixCls('anchor', customize)`
 * —— 即 **ConfigProvider 的根前缀**，与 `Anchor` 的 `prefixCls` prop **无关**。
 * 所以传 `prefixCls: 'apollo'` 给 `Anchor` 时：`Anchor` 自己是 `apollo`，
 * 而链接是 **`ant-anchor-link`**（根前缀默认 `ant`）。
 * 本仓的 `AnchorLink` 是同一逻辑（`useConfigContext().getPrefixCls`）⇒ 逐字一致 ✓。
 */

import { type DomRenderResult, domContractTest } from '@apollo-design/test-utils';
import { defineComponent, h, provide, type VNodeChild } from 'vue';
import baseline from '../../../../../tests/compat/baselines/anchor.dom.json';
import {
  type ConfigContextValue,
  configContextKey,
  DEFAULT_CONFIG_CONTEXT,
} from '../../config-provider/context';
import { Anchor } from '../Anchor';
import type { AnchorLinkItemProps, AnchorProps } from '../interface';

/** 两侧共用的前缀。与 `tests/compat/baseline/anchor.mjs` 里的 `PREFIX` 必须一致。 */
const PREFIX = 'apollo';

/** 在指定的 ConfigProvider 上下文下渲染（Vue 侧对应物是 `provide`）。 */
function withConfig(config: Partial<ConfigContextValue>, children: () => VNodeChild) {
  return defineComponent({
    name: 'AAnchorCompatConfigProbe',
    setup() {
      provide(configContextKey, { ...DEFAULT_CONFIG_CONTEXT, ...config });
      return () => children();
    },
  });
}

/** 与基线逐字相同的 items。 */
const ITEMS: AnchorLinkItemProps[] = [
  { key: 'a', href: '#section-a', title: 'Section A' },
  { key: 'b', href: '#section-b', title: 'Section B' },
  { key: 'c', href: '#section-c', title: 'Section C' },
];

const NESTED: AnchorLinkItemProps[] = [
  {
    key: 'a',
    href: '#section-a',
    title: 'Section A',
    children: [{ key: 'a1', href: '#section-a1', title: 'Section A1' }],
  },
  { key: 'b', href: '#section-b', title: 'Section B' },
];

const base = { prefixCls: PREFIX, items: ITEMS };

/**
 * 用例规格表：id → Vue 侧的 props / ctx。
 *
 * ⚠️ 必须覆盖基线里的**每一个**用例（`domContractTest` 会校验）。
 */
const specs: Record<
  string,
  {
    props: AnchorProps & Record<string, unknown>;
    /** ⚠️ 本仓的 `children` 是**默认插槽**（规则 C19）⇒ 单独一个字段，不能塞进 props */
    slots?: Record<string, () => VNodeChild>;
    ctx?: Partial<ConfigContextValue>;
    /** 不包 ConfigProvider（用来钉「默认根前缀」的差异 D1）。 */
    bare?: boolean;
  }
> = {
  'anchor:basic': { props: { ...base } },
  'anchor:affix-false': { props: { ...base, affix: false } },
  'anchor:affix-config': { props: { ...base, affix: { offsetBottom: 20 } } },
  // ⚠️ **不包 ConfigProvider** ⇒ 根前缀回落各家默认值（antd `ant` vs 我们 `apollo`）⇒ D1
  'anchor:prefix-cls:no-props': { props: { items: ITEMS }, bare: true },
  'anchor:prefix-cls:custom': { props: { prefixCls: 'custom', items: ITEMS } },

  'anchor:fixed-ink': { props: { ...base, affix: false, showInkInFixed: true } },
  'anchor:fixed-default': { props: { ...base, affix: false, showInkInFixed: false } },
  'anchor:horizontal': { props: { ...base, direction: 'horizontal' } },
  'anchor:rtl': { props: { ...base }, ctx: { direction: 'rtl' } },

  'anchor:offset-top': { props: { ...base, offsetTop: 80 } },
  'anchor:target-offset': { props: { ...base, targetOffset: 60 } },
  'anchor:bounds': { props: { ...base, bounds: 20 } },
  'anchor:replace': { props: { ...base, replace: true } },

  'anchor:items-nested': { props: { ...base, items: NESTED } },
  'anchor:items-nested-horizontal': {
    props: { ...base, items: NESTED, direction: 'horizontal' },
  },
  'anchor:items-empty': { props: { ...base, items: [] } },
  'anchor:key-number': {
    props: {
      ...base,
      items: [
        { key: 0, href: '#section-a', title: 'A' },
        { key: 1, href: '#section-b', title: 'B' },
      ],
    },
  },
  'anchor:title-vnode': {
    props: {
      ...base,
      items: [{ key: 'a', href: '#section-a', title: h('span', { class: 'title-span' }, 'A') }],
    },
  },
  'anchor:link-props': {
    props: {
      ...base,
      items: [
        { key: 'a', href: '#section-a', title: 'A', className: 'link-cls', target: '_blank' },
        { key: 'b', href: 'https://example.com', title: 'B', replace: true },
      ],
    },
  },

  // 废弃的 children 路径（`items` 未传）
  'anchor:children': {
    props: { prefixCls: PREFIX },
    slots: { default: () => h('div', { class: 'legacy-child' }, 'legacy') },
  },

  'anchor:class-names': {
    props: {
      ...base,
      classNames: {
        root: 'custom-root',
        item: 'custom-item',
        itemTitle: 'custom-item-title',
        indicator: 'custom-indicator',
      },
    },
  },
  'anchor:styles': {
    props: {
      ...base,
      classNames: { root: 'custom-root' },
      styles: {
        root: { background: '#fafafa' },
        item: { opacity: 0.8 },
        itemTitle: { fontWeight: 'bold' },
        indicator: { backgroundColor: 'red' },
      },
    },
  },
  'anchor:class-names-fn': {
    props: {
      ...base,
      direction: 'horizontal',
      classNames: ({ props }) => ({ root: `dir-${props.direction}`, item: 'fn-item' }),
    },
  },
};

domContractTest('Anchor', {
  baseline,
  keepStyle: true,
  allow: {
    // 默认前缀不同（裁决 `prefix-cls-default` = A）：`bare` 用例下两侧的根前缀分别是
    // antd 的 `ant` 与我们的 `apollo` ⇒ **每一层带前缀的元素**都不同（wrapper / anchor / ink / link）。
    'anchor:prefix-cls:no-props': {
      reason: 'D1 · 默认根前缀 apollo vs ant（bare 用例，5 层带前缀元素）',
      deviationId: 'D1',
      diff: [
        '$/div[0]/div[0]/div[0]: 类名不同 [ant-anchor-wrapper] vs [apollo-anchor-wrapper]',
        '$/div[0]/div[0]/div[0]/div[0]: 类名不同 [ant-anchor] vs [apollo-anchor]',
        '$/div[0]/div[0]/div[0]/div[0]/span[0]: 类名不同 [ant-anchor-ink] vs [apollo-anchor-ink]',
        '$/div[0]/div[0]/div[0]/div[0]/div[1]: 类名不同 [ant-anchor-link] vs [apollo-anchor-link]',
        '$/div[0]/div[0]/div[0]/div[0]/div[1]/a[0]: 类名不同 [ant-anchor-link-title] vs [apollo-anchor-link-title]',
        '$/div[0]/div[0]/div[0]/div[0]/div[2]: 类名不同 [ant-anchor-link] vs [apollo-anchor-link]',
        '$/div[0]/div[0]/div[0]/div[0]/div[2]/a[0]: 类名不同 [ant-anchor-link-title] vs [apollo-anchor-link-title]',
        '$/div[0]/div[0]/div[0]/div[0]/div[3]: 类名不同 [ant-anchor-link] vs [apollo-anchor-link]',
        '$/div[0]/div[0]/div[0]/div[0]/div[3]/a[0]: 类名不同 [ant-anchor-link-title] vs [apollo-anchor-link-title]',
      ],
    },
    // React 侧是 SSR **字符串**（`#fafafa` 原样），Vue 侧经真实 DOM 的 CSSOM 读回时
    // 被规范化为 `rgb(250,250,250)` —— 语义完全等价（与 flex 的 `gap:0 → 0px` 同一现象，D114 家族）。
    'anchor:styles': {
      reason: 'PLATFORM · CSSOM 把十六进制色规范化成 rgb()，语义等价',
      deviationId: 'D114',
      diff: [
        '$/div[0]/div[0]/div[0]: style 不同 [background:#fafafa;max-height:100vh] vs [background:rgb(250,250,250);max-height:100vh]',
      ],
    },
  },
  render: (id) => {
    const spec = specs[id];
    if (!spec) {
      throw new Error(`[Anchor L4] 用例 "${id}" 缺少 Vue 侧规格 —— baseline 与 specs 失配`);
    }
    const vnode = h(Anchor, spec.props as never, spec.slots as never);
    if (spec.bare) return vnode;
    const result: DomRenderResult = spec.ctx ? withConfig(spec.ctx, () => vnode) : vnode;
    return result;
  },
});
