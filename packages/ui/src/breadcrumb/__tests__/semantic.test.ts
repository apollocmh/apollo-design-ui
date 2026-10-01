/**
 * L4 · DOM 契约（与 antd 6.6.4 的实测 DOM 比对）
 *
 * ── 基准是什么 ────────────────────────────────────────────────────────────────
 *
 * `tests/compat/baselines/breadcrumb.dom.json`，由 `tests/compat/baseline/breadcrumb.mjs`
 * 直接调用 `react-dom/server.renderToStaticMarkup` 渲染 antd 的 `Breadcrumb` 产出。
 * 机械 oracle，不是「我们读了源码之后写下的期望值」。
 *
 * ── 这个契约覆盖什么、不覆盖什么 ──────────────────────────────────────────────
 *
 * ✅ 覆盖：`<nav>` / `<ol>` / `<li>` 的**层序与类名**、分隔符的**存在性**（最后一项
 *    不渲染）、`<a href>` vs `<span>`、`href` 的**累加**、`:param` 替换、
 *    三条数据通道（`items` / `routes` / `children`）、`itemRender`、
 *    语义化三槽、`-rtl`、`data-*` / `aria-*` 透传，以及 **`item.style` 的落点**。
 * ❌ 不覆盖：`menu` 的**浮层内容**（Dropdown 默认不展开 ⇒ SSR 产物里没有 popup）。
 *
 * ── 🚨 两条必须记住的判据（都实测过）─────────────────────────────────────────
 *
 * 1. **每个用例都要包 `ConfigProvider`**：上游 `BreadcrumbSeparator` 的类名前缀取自
 *    `React.useContext(ConfigContext).getPrefixCls('breadcrumb')` —— 即**根前缀**，
 *    与 `Breadcrumb` 的 `prefixCls` prop **无关**（它连 prop 都没有）。
 *    基线生成器已经包了；本文件用 `withConfig` 复刻。
 * 2. **`isRenderable('')` 是 false**（读了 `@rc-component/util@1.13.0` 的 `es/is.js` 确认）
 *    ⇒ 最后一项的 `separator=''` **不会**产出 `<li class="-separator">`。
 */

import { type DomRenderResult, domContractTest } from '@apollo-design/test-utils';
import { defineComponent, h, provide, type VNodeChild } from 'vue';
import baseline from '../../../../../tests/compat/baselines/breadcrumb.dom.json';
import {
  type ConfigContextValue,
  configContextKey,
  DEFAULT_CONFIG_CONTEXT,
} from '../../config-provider/context';
import { Breadcrumb } from '../Breadcrumb';
import { BreadcrumbItem } from '../BreadcrumbItem';
import { BreadcrumbSeparator } from '../BreadcrumbSeparator';
import type { BreadcrumbItemInput, BreadcrumbProps } from '../interface';

/** 两侧共用的前缀。与 `tests/compat/baseline/breadcrumb.mjs` 里的 `PREFIX` 必须一致。 */
const PREFIX = 'apollo';

/** 在指定的 ConfigProvider 上下文下渲染（Vue 侧对应物是 `provide`）。 */
function withConfig(config: Partial<ConfigContextValue>, children: () => VNodeChild) {
  return defineComponent({
    name: 'ABreadcrumbCompatConfigProbe',
    setup() {
      provide(configContextKey, { ...DEFAULT_CONFIG_CONTEXT, ...config });
      return () => children();
    },
  });
}

/** 与基线逐字相同的 items。 */
const ITEMS: BreadcrumbItemInput[] = [
  { title: 'Home', href: '#/home' },
  { title: 'List', href: '#/list' },
  { title: 'Detail' },
];

const base = { prefixCls: PREFIX, items: ITEMS };

/** 用例规格表：id → Vue 侧的 props / slots / ctx。 */
const specs: Record<
  string,
  {
    props: BreadcrumbProps & Record<string, unknown>;
    /** ⚠️ 本仓的 `children` 是**默认插槽**（规则 C19）⇒ 单独一个字段，不能塞进 props */
    slots?: Record<string, () => VNodeChild>;
    ctx?: Partial<ConfigContextValue>;
    /** 不包 ConfigProvider（用来钉「默认根前缀」的差异 D1）。 */
    bare?: boolean;
  }
> = {
  'breadcrumb:basic': { props: { ...base } },
  // ⚠️ **不包 ConfigProvider** ⇒ 根前缀回落各家默认值（antd `ant` vs 我们 `apollo`）⇒ D1
  'breadcrumb:prefix-cls:no-props': { props: { items: ITEMS }, bare: true },
  'breadcrumb:prefix-cls:custom': { props: { prefixCls: 'custom', items: ITEMS } },
  'breadcrumb:rtl': { props: { ...base }, ctx: { direction: 'rtl' } },
  'breadcrumb:items-empty': { props: { ...base, items: [] } },

  'breadcrumb:separator-default': { props: { ...base } },
  'breadcrumb:separator-custom': { props: { ...base, separator: '>' } },
  'breadcrumb:separator-empty': { props: { ...base, separator: '' } },
  'breadcrumb:separator-item': {
    props: {
      ...base,
      items: [
        { title: 'Home', href: '#/home' },
        { type: 'separator', separator: '|' },
        { title: 'Detail' },
      ],
    },
  },
  'breadcrumb:separator-item-empty': {
    props: {
      ...base,
      items: [
        { title: 'Home', href: '#/home' },
        { type: 'separator', separator: '' },
        { title: 'Detail' },
      ],
    },
  },

  'breadcrumb:path': {
    props: {
      ...base,
      params: { id: '7' },
      items: [
        { title: 'Home', path: 'home' },
        { title: 'List :id', path: 'list/:id' },
        { title: 'Detail' },
      ],
    },
  },
  'breadcrumb:path-slash': {
    props: { ...base, items: [{ title: 'A', path: '/a' }, { title: 'B' }] },
  },
  'breadcrumb:params-empty': { props: { ...base, items: [{ title: 'x:y:z' }] } },
  'breadcrumb:params-falsy': {
    props: { ...base, params: { id: 0, name: '' }, items: [{ title: 'a-:id-b-:name' }] },
  },
  'breadcrumb:href-direct': { props: { ...base, items: [{ title: 'A', href: 'https://x.dev' }] } },
  'breadcrumb:title-vnode': {
    props: {
      ...base,
      params: { id: '7' },
      items: [{ title: h('span', { class: 'title-span' }, ':id') }],
    },
  },
  'breadcrumb:title-empty': { props: { ...base, items: [{ title: '' }, { title: 'B' }] } },

  'breadcrumb:routes': {
    props: {
      prefixCls: PREFIX,
      routes: [
        { breadcrumbName: 'ignored', title: 'parent-title' },
        {
          breadcrumbName: 'child',
          children: [{ breadcrumbName: 'child-name', title: 'ignored-child-title' }],
        },
      ],
    },
  },
  'breadcrumb:items-over-routes': { props: { ...base, routes: [{ title: 'from-routes' }] } },
  'breadcrumb:children': {
    props: { prefixCls: PREFIX },
    slots: {
      default: () => [
        h(BreadcrumbItem, { key: 'a' }, { default: () => 'A' }),
        h(BreadcrumbSeparator, { key: 's' }, { default: () => '|' }),
        h(BreadcrumbItem, { key: 'b' }, { default: () => 'B' }),
      ],
    },
  },
  'breadcrumb:children-separator': {
    props: { prefixCls: PREFIX, separator: '>' },
    slots: {
      default: () => [
        h(BreadcrumbItem, { key: 'a' }, { default: () => 'A' }),
        h(BreadcrumbItem, { key: 'b' }, { default: () => 'B' }),
      ],
    },
  },

  'breadcrumb:item-render': {
    props: {
      ...base,
      itemRender: (item: BreadcrumbItemInput, params, routes, paths) =>
        h(
          'span',
          { class: 'custom-render' },
          `${String(item.title)}|${Object.keys(params).length}|${routes.length}|${paths.join(',')}`,
        ),
    },
  },

  'breadcrumb:item-class-style': {
    props: {
      ...base,
      items: [{ title: 'A', href: '#/a', className: 'item-cls', style: { color: 'red' } }],
    },
  },
  'breadcrumb:item-data-aria': {
    props: {
      ...base,
      items: [{ title: 'A', href: '#/a', 'data-testid': 'x', 'aria-label': 'A 项' }],
    },
  },
  'breadcrumb:key-number': {
    props: {
      ...base,
      items: [
        { key: 0, title: 'A' },
        { key: 1, title: 'B' },
      ],
    },
  },

  'breadcrumb:menu': {
    props: {
      ...base,
      items: [
        { title: 'Home', href: '#/home' },
        {
          title: 'Group',
          menu: {
            items: [
              { key: 'a', label: 'A' },
              { key: 'b', title: 'B' },
              { key: 'c', label: 'C', path: '/c' },
            ],
          },
        },
        { title: 'Detail' },
      ],
    },
  },
  'breadcrumb:dropdown-icon': {
    props: {
      ...base,
      dropdownIcon: h('span', { class: 'my-icon' }, 'v'),
      items: [
        { title: 'Home', href: '#/home' },
        { title: 'Group', menu: { items: [{ key: 'a', label: 'A' }] } },
      ],
    },
  },

  'breadcrumb:class-names': {
    props: {
      ...base,
      classNames: { root: 'custom-root', item: 'custom-item', separator: 'custom-separator' },
    },
  },
  'breadcrumb:styles': {
    props: {
      ...base,
      classNames: { root: 'custom-root' },
      styles: {
        root: { background: '#fafafa' },
        item: { opacity: 0.8 },
        separator: { color: 'red' },
      },
    },
  },
  'breadcrumb:class-names-fn': {
    props: {
      ...base,
      separator: '>',
      classNames: ({ props }) => ({ root: `sep-${String(props.separator)}`, item: 'fn-item' }),
    },
  },
};

domContractTest('Breadcrumb', {
  baseline,
  keepStyle: true,
  allow: {
    // 默认前缀不同（裁决 `prefix-cls-default` = A）：`bare` 用例下两侧的根前缀分别是
    // antd 的 `ant` 与我们的 `apollo` ⇒ **每一层带前缀的元素**都不同。
    // ⚠️ 注意分隔符是 `-breadcrumb-separator`（它取 `getPrefixCls('breadcrumb')`，
    //    即**根前缀**），而 item / link 是 `-item` / `-link`（用传进来的 `prefixCls`）
    //    —— 两侧都是这样，所以只有「前缀本身」不同。
    'breadcrumb:prefix-cls:no-props': {
      reason: 'D1 · 默认根前缀 apollo vs ant（bare 用例，9 个带前缀元素）',
      deviationId: 'D1',
      diff: [
        '$/nav[0]: 类名不同 [ant-breadcrumb] vs [apollo-breadcrumb]',
        '$/nav[0]/ol[0]/li[0]: 类名不同 [ant-breadcrumb-item] vs [apollo-breadcrumb-item]',
        '$/nav[0]/ol[0]/li[0]/a[0]: 类名不同 [ant-breadcrumb-link] vs [apollo-breadcrumb-link]',
        '$/nav[0]/ol[0]/li[1]: 类名不同 [ant-breadcrumb-separator] vs [apollo-breadcrumb-separator]',
        '$/nav[0]/ol[0]/li[2]: 类名不同 [ant-breadcrumb-item] vs [apollo-breadcrumb-item]',
        '$/nav[0]/ol[0]/li[2]/a[0]: 类名不同 [ant-breadcrumb-link] vs [apollo-breadcrumb-link]',
        '$/nav[0]/ol[0]/li[3]: 类名不同 [ant-breadcrumb-separator] vs [apollo-breadcrumb-separator]',
        '$/nav[0]/ol[0]/li[4]: 类名不同 [ant-breadcrumb-item] vs [apollo-breadcrumb-item]',
        '$/nav[0]/ol[0]/li[4]/span[0]: 类名不同 [ant-breadcrumb-link] vs [apollo-breadcrumb-link]',
      ],
    },
    // React 侧是 SSR **字符串**（`#fafafa` 原样），Vue 侧经真实 DOM 的 CSSOM 读回时
    // 被规范化为 `rgb(250,250,250)` —— 语义完全等价（D114 家族）。
    'breadcrumb:styles': {
      reason: 'PLATFORM · CSSOM 把十六进制色规范化成 rgb()，语义等价',
      deviationId: 'D114',
      diff: ['$/nav[0]: style 不同 [background:#fafafa] vs [background:rgb(250,250,250)]'],
    },
  },
  render: (id) => {
    const spec = specs[id];
    if (!spec) {
      throw new Error(`[Breadcrumb L4] 用例 "${id}" 缺少 Vue 侧规格 —— baseline 与 specs 失配`);
    }
    const vnode = h(Breadcrumb, spec.props as never, spec.slots as never);
    if (spec.bare) return vnode;
    const result: DomRenderResult = spec.ctx ? withConfig(spec.ctx, () => vnode) : vnode;
    return result;
  },
});
