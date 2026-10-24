/** Historical CSR pre-appear root snapshots plus native SSR content contracts.
 * The dated React SSR empty-container evidence remains unchanged. domContractTest
 * mounts synchronously on the client; it does not test Vue SSR content. */
import { type DomRenderResult, domContractTest } from '@apollo-design/test-utils';
import { describe, expect, it } from 'vitest';
import { createSSRApp, defineComponent, h, provide, type VNodeChild } from 'vue';
import { renderToString } from 'vue/server-renderer';
import baseline from '../../../../../tests/compat/baselines/masonry.dom.json';
import {
  type ConfigContextValue,
  configContextKey,
  DEFAULT_CONFIG_CONTEXT,
} from '../../config-provider/context';
import { Masonry } from '../index';
import type { MasonryItemSlotProps, MasonryProps } from '../interface';

/** 两侧共用的前缀。与 `tests/compat/baseline/masonry.mjs` 里的 `PREFIX` 必须一致。 */
const PREFIX = 'apollo';

/** 在指定的 ConfigProvider 上下文下渲染（Vue 侧对应物是 `provide`）。 */
function withConfig(config: Partial<ConfigContextValue>, children: () => VNodeChild) {
  return defineComponent({
    name: 'AMasonryCompatConfigProbe',
    setup() {
      provide(configContextKey, { ...DEFAULT_CONFIG_CONTEXT, ...config });
      return () => children();
    },
  });
}

/** 与 `tests/compat/baseline/masonry.mjs` 的 `renderBamboo` **逐字对应**。 */
const renderBamboo = ({ data, index, column }: MasonryItemSlotProps<unknown>): VNodeChild =>
  h(
    'div',
    { class: 'bamboo', 'data-height': String(data), 'data-column': String(column) },
    String(index + 1),
  );

const HEIGHTS = [150, 30, 90, 70, 110];

const buildItems = (heights = HEIGHTS) =>
  heights.map((height, index) => ({ key: `item-${index}`, data: height }));

/** Shared source data; render adapters supply the native item slot. */
const base = { items: buildItems() };

/**
 * 用例规格表：id → Vue 侧的 props / ctx。
 *
 * ⚠️ 必须覆盖基线里的**每一个**用例（`domContractTest` 会校验）。键名与
 * `tests/compat/baseline/masonry.mjs` 的 `push` 一一对应，缺一条即红。
 */
function buildUnkeyedItems() {
  const items = [
    { key: 'a', data: 10 },
    { key: 'b', data: 20 },
  ];
  for (const item of items) Reflect.deleteProperty(item, 'key');
  return items;
}

const specs: Record<
  string,
  { props: MasonryProps & Record<string, unknown>; ctx?: Partial<ConfigContextValue> }
> = {
  'masonry:basic': { props: { ...base, prefixCls: PREFIX } },
  'masonry:prefix-cls:no-props': { props: { ...base } },
  'masonry:prefix-cls:custom': { props: { ...base, prefixCls: 'custom' } },
  'masonry:empty': { props: { ...base, prefixCls: PREFIX, items: [] } },

  'masonry:columns-1': { props: { ...base, prefixCls: PREFIX, columns: 1 } },
  'masonry:columns-4': { props: { ...base, prefixCls: PREFIX, columns: 4 } },
  // 🚨 `columns={0}` 是 falsy ⇒ 落到默认 3
  'masonry:columns-0': { props: { ...base, prefixCls: PREFIX, columns: 0 } },
  'masonry:columns-responsive': {
    props: { ...base, prefixCls: PREFIX, columns: { xs: 1, sm: 2, md: 3 } },
  },
  'masonry:columns-responsive-no-xs': {
    props: { ...base, prefixCls: PREFIX, columns: { md: 3 } },
  },

  'masonry:gutter-number': { props: { ...base, prefixCls: PREFIX, gutter: 16 } },
  'masonry:gutter-array': { props: { ...base, prefixCls: PREFIX, gutter: [8, 16] } },
  'masonry:gutter-responsive': {
    props: { ...base, prefixCls: PREFIX, gutter: { sm: 8, md: 16 } },
  },

  'masonry:item-children': {
    props: {
      ...base,
      prefixCls: PREFIX,
      items: [
        { key: 'a', data: 10, children: h('div', { class: 'from-children' }, 'A') },
        { key: 'b', data: 20 },
      ],
    },
  },
  // Neither fallback children nor an item slot: keep an empty item wrapper.
  'masonry:item-no-content': {
    props: { prefixCls: PREFIX, items: [{ key: 'a', data: 10 }] },
  },

  'masonry:class-names': {
    props: { ...base, prefixCls: PREFIX, classNames: { root: 'custom-root', item: 'custom-item' } },
  },
  'masonry:styles': {
    props: {
      ...base,
      prefixCls: PREFIX,
      classNames: { root: 'custom-root' },
      styles: { root: { border: '2px solid red' }, item: { padding: '10px' } },
    },
  },
  // 函数式变体：入参的 `props.columns` 是**解析后的列数**
  'masonry:class-names-fn': {
    props: {
      ...base,
      prefixCls: PREFIX,
      columns: 4,
      classNames: ({ props }) => ({ root: `cols-${props.columns}`, item: 'fn-item' }),
    },
  },

  'masonry:rtl': { props: { ...base, prefixCls: PREFIX }, ctx: { direction: 'rtl' } },

  'masonry:key-number': {
    props: {
      ...base,
      prefixCls: PREFIX,
      items: [
        { key: 0, data: 10 },
        { key: 1, data: 20 },
      ],
    },
  },
  'masonry:key-fallback-index': {
    props: {
      ...base,
      prefixCls: PREFIX,
      // Exercise JavaScript callers without weakening the public required-key type.
      items: buildUnkeyedItems(),
    },
  },
};

domContractTest('Masonry', {
  baseline,
  // Preserve the historical class/ARIA projection; real SSR styles are asserted below.
  keepStyle: false,
  allow: {
    // 默认前缀不同（裁决 `prefix-cls-default` = A）：antd `ant-masonry` vs 我们 `apollo-masonry`。
    'masonry:prefix-cls:no-props': {
      reason: 'D1 · 默认前缀 apollo vs ant',
      deviationId: 'D1',
      diff: ['$/div[0]: 类名不同 [ant-masonry] vs [apollo-masonry]'],
    },
    // ⚠️ 其余 19 条**零豁免**（逐字一致）。
  },
  render: (id) => {
    const spec = specs[id];
    if (!spec) {
      throw new Error(`[Masonry L4] 用例 "${id}" 缺少 Vue 侧规格 —— baseline 与 specs 失配`);
    }
    const vnode = h(
      Masonry,
      spec.props,
      id === 'masonry:item-no-content' || id === 'masonry:item-children'
        ? {}
        : { item: renderBamboo },
    );
    const result: DomRenderResult = spec.ctx ? withConfig(spec.ctx, () => vnode) : vnode;
    return result;
  },
});

describe('Masonry native SSR for every historical root scenario', () => {
  it.each(Object.entries(specs))('%s renders current content before mount', async (id, spec) => {
    const vnode = h(
      Masonry,
      spec.props,
      id === 'masonry:item-no-content' || id === 'masonry:item-children'
        ? {}
        : { item: renderBamboo },
    );
    const App = spec.ctx
      ? withConfig(spec.ctx, () => vnode)
      : defineComponent({ render: () => vnode });
    const container = document.createElement('div');
    container.innerHTML = await renderToString(createSSRApp(App));
    const root = container.firstElementChild;
    if (!(root instanceof HTMLDivElement)) throw new Error('Masonry SSR root must be a div');
    const prefix =
      id === 'masonry:prefix-cls:no-props'
        ? 'apollo-masonry'
        : id === 'masonry:prefix-cls:custom'
          ? 'custom'
          : 'apollo';
    expect(root.classList.contains(prefix)).toBe(true);
    expect(root.classList.contains(`${prefix}-css-var`)).toBe(true);
    expect(root.hasAttribute('role')).toBe(false);
    const tiles = root.querySelectorAll(`.${prefix}-item`);
    expect(tiles).toHaveLength(spec.props.items?.length ?? 0);
    for (const tile of tiles) expect(tile.getAttribute('style')).toContain('position:relative');
    if (tiles.length > 0) {
      expect(root.style.display).toBe('grid');
      expect(root.style.height).toBe('');
      const columns =
        id === 'masonry:columns-1' || id.startsWith('masonry:columns-responsive')
          ? 1
          : id === 'masonry:columns-4' || id === 'masonry:class-names-fn'
            ? 4
            : 3;
      expect(root.style.gridTemplateColumns).toBe(`repeat(${columns}, minmax(0, 1fr))`);
    } else expect(root.style.height).toBe('0px');
    if (id === 'masonry:item-children') {
      expect(tiles[0]?.textContent).toBe('A');
      expect(tiles[1]?.textContent).toBe('');
    } else if (id === 'masonry:item-no-content') expect(tiles[0]?.textContent).toBe('');
    else
      expect([...tiles].map((tile) => tile.textContent)).toEqual(
        spec.props.items?.map((_, index) => String(index + 1)) ?? [],
      );
    if (id === 'masonry:rtl') expect(root.classList.contains('apollo-rtl')).toBe(true);
    if (id === 'masonry:class-names' || id === 'masonry:styles')
      expect(root.classList.contains('custom-root')).toBe(true);
    if (id === 'masonry:class-names-fn') expect(root.classList.contains('cols-4')).toBe(true);
    if (id === 'masonry:styles') {
      expect(root.style.border).toBe('2px solid red');
      for (const tile of tiles) expect(tile.getAttribute('style')).toContain('padding:10px');
    }
    if (id === 'masonry:gutter-number' || id === 'masonry:gutter-array') {
      expect(root.style.columnGap).toBe(id === 'masonry:gutter-array' ? '8px' : '16px');
      expect(root.style.rowGap).toBe('16px');
    }
  });
});
