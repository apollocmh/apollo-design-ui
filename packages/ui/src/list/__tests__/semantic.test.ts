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
import type { ListItemProps, ListProps, ListSlots } from '../interface';
import reviewedDiffs from './list-reference-diffs.json';

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
    slots?: ListSlots<string>;
    ctx?: Partial<ConfigContextValue>;
    /** 不包 ConfigProvider（用来钉「默认根前缀」的差异 D1）。 */
    bare?: boolean;
  }
> = {
  'list:basic': {
    props: { dataSource: DATA },
    slots: { item: ({ item }: { item: string }) => textItem(item) },
  },
  // ⚠️ **不包 ConfigProvider** ⇒ 根前缀回落各家默认值（antd `ant` vs 我们 `apollo`）⇒ D1
  'list:prefix-cls:no-props': {
    props: { dataSource: DATA },
    bare: true,
    slots: { item: ({ item }: { item: string }) => textItem(item) },
  },
  'list:prefix-cls:custom': {
    props: { prefixCls: 'custom', dataSource: DATA },
    slots: { item: ({ item }: { item: string }) => textItem(item) },
  },

  'list:empty': { props: {} },
  'list:children': { props: {}, slots: { default: () => h('div', 'custom content') } },
  'list:no-render-item': { props: { dataSource: DATA } },
  'list:empty-locale': { props: { locale: { emptyText: 'no data' } } },

  'list:header-footer': {
    props: { header: 'Header', footer: 'Footer', dataSource: DATA },
    slots: { item: ({ item }: { item: string }) => textItem(item) },
  },
  'list:loadmore': {
    props: { loadMore: h('div', 'more'), dataSource: DATA },
    slots: { item: ({ item }: { item: string }) => textItem(item) },
  },
  'list:split-false': {
    props: { split: false, dataSource: DATA },
    slots: { item: ({ item }: { item: string }) => textItem(item) },
  },

  'list:size-large': {
    props: { size: 'large', dataSource: DATA },
    slots: { item: ({ item }: { item: string }) => textItem(item) },
  },
  'list:size-small': {
    props: { size: 'small', dataSource: DATA },
    slots: { item: ({ item }: { item: string }) => textItem(item) },
  },
  'list:size-default': {
    props: { size: 'default', dataSource: DATA },
    slots: { item: ({ item }: { item: string }) => textItem(item) },
  },
  'list:bordered': {
    props: { bordered: true, dataSource: DATA },
    slots: { item: ({ item }: { item: string }) => textItem(item) },
  },
  'list:bordered-sm': {
    props: {
      bordered: true,
      size: 'small',
      header: 'H',
      footer: 'F',
      dataSource: DATA,
    },
    slots: { item: ({ item }: { item: string }) => textItem(item) },
  },
  'list:bordered-lg': {
    props: {
      bordered: true,
      size: 'large',
      header: 'H',
      footer: 'F',
      dataSource: DATA,
    },
    slots: { item: ({ item }: { item: string }) => textItem(item) },
  },

  'list:item-meta': {
    props: { dataSource: DATA },
    slots: { item: ({ item }: { item: string }) => metaItem(item) },
  },
  'list:item-actions': {
    props: { dataSource: DATA },
    slots: { item: ({ item }: { item: string }) => actionItem(item) },
  },
  'list:item-no-flex': {
    props: {
      dataSource: DATA,
    },
    slots: {
      item: ({ item }: { item: unknown }) =>
        h(ListItem, { key: String(item) }, { default: () => [String(item), '-more'] }),
    },
  },
  'list:item-extra': {
    props: {
      dataSource: DATA,
    },
    slots: {
      item: ({ item }: { item: unknown }) =>
        h(ListItem, { key: String(item), extra: h('span', 'E') } as ListItemProps, {
          default: () => String(item),
        }),
    },
  },

  'list:vertical': {
    props: {
      itemLayout: 'vertical',
      dataSource: DATA,
    },
    slots: {
      item: ({ item }: { item: unknown }) =>
        h(ListItem, { key: String(item), extra: h('span', 'E') } as ListItemProps, {
          default: () => h(ListItemMeta, { title: String(item), description: 'desc' }),
        }),
    },
  },
  'list:vertical-no-extra': {
    props: { itemLayout: 'vertical', dataSource: DATA },
    slots: { item: ({ item }: { item: string }) => textItem(item) },
  },

  'list:grid': {
    props: { grid: { column: 2, gutter: 16 }, dataSource: DATA6 },
    slots: { item: ({ item }: { item: string }) => textItem(item) },
  },
  'list:grid-responsive': {
    props: {
      grid: { column: 3, xs: 1, sm: 2, md: 3, lg: 4, xl: 5, xxl: 6, xxxl: 7 },
      dataSource: DATA6,
    },
    slots: { item: ({ item }: { item: string }) => textItem(item) },
  },
  'list:grid-no-column': {
    props: { grid: { gutter: 16 }, dataSource: DATA },
    slots: { item: ({ item }: { item: string }) => textItem(item) },
  },

  'list:pagination': {
    props: { pagination: { pageSize: 2 }, dataSource: DATA6 },
    slots: { item: ({ item }: { item: string }) => textItem(item) },
  },
  'list:pagination-top': {
    props: {
      pagination: { pageSize: 2, position: 'top' },
      dataSource: DATA6,
    },
    slots: { item: ({ item }: { item: string }) => textItem(item) },
  },
  'list:pagination-both': {
    props: {
      pagination: { pageSize: 2, position: 'both' },
      dataSource: DATA6,
    },
    slots: { item: ({ item }: { item: string }) => textItem(item) },
  },
  'list:pagination-clamp': {
    props: {
      pagination: { pageSize: 2, current: 99 },
      dataSource: DATA6,
    },
    slots: { item: ({ item }: { item: string }) => textItem(item) },
  },

  'list:loading': {
    props: { loading: true, dataSource: DATA },
    slots: { item: ({ item }: { item: string }) => textItem(item) },
  },
  'list:loading-spin-props': {
    props: { loading: { spinning: true }, dataSource: DATA },
    slots: { item: ({ item }: { item: string }) => textItem(item) },
  },

  'list:className': {
    props: {
      class: ['my-cls', 'my-root'],
      dataSource: DATA,
    },
    slots: { item: ({ item }: { item: string }) => textItem(item) },
  },
  'list:style': {
    props: {
      style: { backgroundColor: '#fde3cf', color: '#f56a00' },
      dataSource: DATA,
    },
    slots: { item: ({ item }: { item: string }) => textItem(item) },
  },
  'list:attrs': {
    props: { id: 'my-id', 'data-x': 'y', dataSource: DATA },
    slots: { item: ({ item }: { item: string }) => textItem(item) },
  },
  'list:rtl': {
    props: { dataSource: DATA },
    ctx: { direction: 'rtl' },
    slots: { item: ({ item }: { item: string }) => textItem(item) },
  },
};

domContractTest('List', {
  baseline,
  keepStyle: true,
  // Every historical reference case remains active. The exact reviewed diffs
  // describe stable Vue content wrappers, owned presentation classes and fixed
  // prefix/pagination/empty behavior; no shared normalizer is weakened.
  allow: Object.fromEntries(
    Object.entries(reviewedDiffs).map(([id, diff]) => [
      id,
      {
        reason:
          'Apollo List contract audit: stable content and nearest-List presentation; shared Spin now owns stable section/indicator hosts. See docs/migrations/list-contracts.md and docs/migrations/spin-contracts.md.',
        diff,
      },
    ]),
  ),
  render: (id) => {
    const spec = specs[id];
    if (!spec) {
      throw new Error(`[List L4] 用例 "${id}" 缺少 Vue 侧规格 —— baseline 与 specs 失配`);
    }
    const vnode = h(List, spec.props, { ...spec.slots });
    if (spec.bare) return vnode;
    const result: DomRenderResult = spec.ctx ? withConfig(spec.ctx, () => vnode) : vnode;
    return result;
  },
});
