/**
 * L4 · DOM 契约（与 antd 6.6.4 的实测 DOM 比对）
 *
 * ── 基准是什么 ────────────────────────────────────────────────────────────────
 *
 * `tests/compat/baselines/list.dom.json`，由 `tests/compat/baseline/list.mjs`
 * 直接调用 `react-dom/server.renderToStaticMarkup` 渲染 antd 的 `List` 产出。
 * 机械 oracle，不是「我们读了源码之后写下的期望值」。
 *
 * ── 这个契约覆盖什么、不覆盖什么 ──────────────────────────────────────────────
 *
 * ✅ 覆盖：`<div>` 根 + 条件类名的组合、`<ul>-items.-container` 与 `<li>-item` 的两层结构、
 *    `Item.Meta` 的三段、`actions` 的 `<ul>/<li>/<em>`、`-vertical` 的两段式、
 *    grid 的 `Row > div[style] > Col > div`、分页的三处落点与 `position` 的两处渲染、
 *    `loading` 的 53px 占位块、空态的 `-empty-text`、`data-*` / `id` 的落点。
 * ❌ 不覆盖：**响应式断点**（SSR 里 `useBreakpoint` 不订阅 ⇒ `currentBreakpoint` 恒 `undefined`）、
 *    分页的**交互**（切页 / 改 pageSize 归 L1）、视觉（归 L6）。
 *
 * ── 🚨 一条必须记住的判据 ────────────────────────────────────────────────────
 *
 * **每个用例都包 `ConfigProvider`，但两侧都「不传 `prefixCls` prop」** ——
 * `Item` 渲染出的子项也是 `getPrefixCls('list')` 的结果，统一靠 Provider 的根前缀，
 * 两侧的 `.apollo-list` / `.apollo-list-container` 才是同一前缀。
 */

import { type DomRenderResult, domContractTest } from '@apollo-design/test-utils';
import { defineComponent, h, provide, type VNodeChild } from 'vue';
import baseline from '../../../../../tests/compat/baselines/list.dom.json';
import {
  type ConfigContextValue,
  configContextKey,
  DEFAULT_CONFIG_CONTEXT,
} from '../../config-provider/context';
import { List, ListItem, ListItemMeta } from '../index';
import type { ListItemProps, ListProps } from '../interface';

/** 在指定的 ConfigProvider 上下文下渲染（Vue 侧对应物是 `provide`）。 */
function withConfig(config: Partial<ConfigContextValue>, children: () => VNodeChild) {
  return defineComponent({
    name: 'AListCompatConfigProbe',
    setup() {
      provide(configContextKey, { ...DEFAULT_CONFIG_CONTEXT, ...config });
      return () => children();
    },
  });
}

const DATA = ['Alpha', 'Beta', 'Gamma'];
const DATA6 = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta'];

// ⚠️ 参数必须收 `unknown` —— `renderItem` 的签名是 `(item: unknown, index: number) => VNodeChild`，
//    函数参数**逆变** ⇒ 写成 `(item: string)` 会 TS2322（与 button 的 `itemRender` 同判）。
const textItem = (item: unknown) =>
  h(ListItem, { key: String(item) }, { default: () => String(item) });

const metaItem = (item: unknown) =>
  h(
    ListItem,
    { key: String(item) },
    {
      default: () =>
        h(ListItemMeta, {
          avatar: h('span', { class: 'my-avatar' }),
          title: String(item),
          description: 'desc',
        }),
    },
  );

const actionItem = (item: unknown) =>
  h(
    ListItem,
    {
      key: String(item),
      actions: [
        h('a', { key: 'e', href: '#edit' }, 'edit'),
        h('a', { key: 'm', href: '#more' }, 'more'),
      ],
    },
    { default: () => String(item) },
  );

/** 用例规格表：id → Vue 侧的 props / slots / ctx。 */
const specs: Record<
  string,
  {
    props?: ListProps & Record<string, unknown>;
    /** ⚠️ 本仓的 `children` 是**默认插槽**（规则 C19）⇒ 单独一个字段，不能塞进 props */
    slots?: Record<string, () => VNodeChild>;
    ctx?: Partial<ConfigContextValue>;
    /** 不包 ConfigProvider（用来钉「默认根前缀」的差异 D1）。 */
    bare?: boolean;
  }
> = {
  'list:basic': { props: { dataSource: DATA, renderItem: textItem } },
  // ⚠️ **不包 ConfigProvider** ⇒ 根前缀回落各家默认值（antd `ant` vs 我们 `apollo`）⇒ D1
  'list:prefix-cls:no-props': {
    props: { dataSource: DATA, renderItem: textItem },
    bare: true,
  },
  'list:prefix-cls:custom': {
    props: { prefixCls: 'custom', dataSource: DATA, renderItem: textItem },
  },

  'list:empty': { props: {} },
  'list:children': { props: {}, slots: { default: () => h('div', 'custom content') } },
  'list:no-render-item': { props: { dataSource: DATA } },
  'list:empty-locale': { props: { locale: { emptyText: 'no data' } } },

  'list:header-footer': {
    props: { header: 'Header', footer: 'Footer', dataSource: DATA, renderItem: textItem },
  },
  'list:loadmore': {
    props: { loadMore: h('div', 'more'), dataSource: DATA, renderItem: textItem },
  },
  'list:split-false': { props: { split: false, dataSource: DATA, renderItem: textItem } },

  'list:size-large': { props: { size: 'large', dataSource: DATA, renderItem: textItem } },
  'list:size-small': { props: { size: 'small', dataSource: DATA, renderItem: textItem } },
  'list:size-default': { props: { size: 'default', dataSource: DATA, renderItem: textItem } },
  'list:bordered': { props: { bordered: true, dataSource: DATA, renderItem: textItem } },
  'list:bordered-sm': {
    props: {
      bordered: true,
      size: 'small',
      header: 'H',
      footer: 'F',
      dataSource: DATA,
      renderItem: textItem,
    },
  },
  'list:bordered-lg': {
    props: {
      bordered: true,
      size: 'large',
      header: 'H',
      footer: 'F',
      dataSource: DATA,
      renderItem: textItem,
    },
  },

  'list:item-meta': { props: { dataSource: DATA, renderItem: metaItem } },
  'list:item-actions': { props: { dataSource: DATA, renderItem: actionItem } },
  'list:item-no-flex': {
    props: {
      dataSource: DATA,
      renderItem: (item: unknown) =>
        h(ListItem, { key: String(item) }, { default: () => [String(item), '-more'] }),
    },
  },
  'list:item-extra': {
    props: {
      dataSource: DATA,
      renderItem: (item: unknown) =>
        h(ListItem, { key: String(item), extra: h('span', 'E') } as ListItemProps, {
          default: () => String(item),
        }),
    },
  },

  'list:vertical': {
    props: {
      itemLayout: 'vertical',
      dataSource: DATA,
      renderItem: (item: unknown) =>
        h(ListItem, { key: String(item), extra: h('span', 'E') } as ListItemProps, {
          default: () => h(ListItemMeta, { title: String(item), description: 'desc' }),
        }),
    },
  },
  'list:vertical-no-extra': {
    props: { itemLayout: 'vertical', dataSource: DATA, renderItem: textItem },
  },

  'list:grid': {
    props: { grid: { column: 2, gutter: 16 }, dataSource: DATA6, renderItem: textItem },
  },
  'list:grid-responsive': {
    props: {
      grid: { column: 3, xs: 1, sm: 2, md: 3, lg: 4, xl: 5, xxl: 6, xxxl: 7 },
      dataSource: DATA6,
      renderItem: textItem,
    },
  },
  'list:grid-no-column': {
    props: { grid: { gutter: 16 }, dataSource: DATA, renderItem: textItem },
  },

  'list:pagination': {
    props: { pagination: { pageSize: 2 }, dataSource: DATA6, renderItem: textItem },
  },
  'list:pagination-top': {
    props: {
      pagination: { pageSize: 2, position: 'top' },
      dataSource: DATA6,
      renderItem: textItem,
    },
  },
  'list:pagination-both': {
    props: {
      pagination: { pageSize: 2, position: 'both' },
      dataSource: DATA6,
      renderItem: textItem,
    },
  },
  'list:pagination-clamp': {
    props: {
      pagination: { pageSize: 2, current: 99 },
      dataSource: DATA6,
      renderItem: textItem,
    },
  },

  'list:loading': { props: { loading: true, dataSource: DATA, renderItem: textItem } },
  'list:loading-spin-props': {
    props: { loading: { spinning: true }, dataSource: DATA, renderItem: textItem },
  },

  'list:className': {
    props: {
      className: 'my-cls',
      rootClassName: 'my-root',
      dataSource: DATA,
      renderItem: textItem,
    },
  },
  'list:style': {
    props: {
      style: { backgroundColor: '#fde3cf', color: '#f56a00' },
      dataSource: DATA,
      renderItem: textItem,
    },
  },
  'list:attrs': {
    props: { id: 'my-id', 'data-x': 'y', dataSource: DATA, renderItem: textItem },
  },
  'list:rtl': {
    props: { dataSource: DATA, renderItem: textItem },
    ctx: { direction: 'rtl' },
  },
};

domContractTest('List', {
  baseline,
  keepStyle: true,
  allow: {
    // 默认前缀不同（裁决 `prefix-cls-default` = A）：`bare` 用例下两侧的根前缀分别是
    // antd 的 `ant` 与我们的 `apollo` ⇒ **每一层带前缀的元素**都不同。
    'list:prefix-cls:no-props': {
      reason: 'D1 · 默认根前缀 apollo vs ant（bare 用例）',
      deviationId: 'D1',
      // ⚠️ 差异清单是**实测值**（L4 断言「恰好这些」）—— 含 Spin 的两层与**每一个** li。
      diff: [
        '$/div[0]: 类名不同 [ant-list ant-list-split] vs [apollo-list apollo-list-split]',
        '$/div[0]/div[0]: 类名不同 [ant-spin] vs [apollo-spin]',
        '$/div[0]/div[0]/div[0]: 类名不同 [ant-spin-container] vs [apollo-spin-container]',
        '$/div[0]/div[0]/div[0]/ul[0]: 类名不同 [ant-list-container ant-list-items] vs [apollo-list-container apollo-list-items]',
        '$/div[0]/div[0]/div[0]/ul[0]/li[0]: 类名不同 [ant-list-item] vs [apollo-list-item]',
        '$/div[0]/div[0]/div[0]/ul[0]/li[1]: 类名不同 [ant-list-item] vs [apollo-list-item]',
        '$/div[0]/div[0]/div[0]/ul[0]/li[2]: 类名不同 [ant-list-item] vs [apollo-list-item]',
      ],
    },
    // CSSOM 把十六进制色规范化成 rgb()，语义等价（D114 家族）。
    'list:style': {
      reason: 'PLATFORM · CSSOM 把十六进制色规范化成 rgb()，语义等价',
      deviationId: 'D114',
      diff: [
        '$/div[0]: style 不同 [background-color:#fde3cf;color:#f56a00] vs [background-color:rgb(253,227,207);color:rgb(245,106,0)]',
      ],
    },
  },
  render: (id) => {
    const spec = specs[id];
    if (!spec) {
      throw new Error(`[List L4] 用例 "${id}" 缺少 Vue 侧规格 —— baseline 与 specs 失配`);
    }
    const vnode = h(List, spec.props as never, spec.slots as never);
    if (spec.bare) return vnode;
    const result: DomRenderResult = spec.ctx ? withConfig(spec.ctx, () => vnode) : vnode;
    return result;
  },
});
