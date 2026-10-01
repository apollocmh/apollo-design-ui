/**
 * L4 · DOM 契约（与 antd 6.6.4 的实测 DOM 比对）
 *
 * ── 基准是什么 ────────────────────────────────────────────────────────────────
 *
 * `tests/compat/baselines/masonry.dom.json`，由 `tests/compat/baseline/masonry.mjs`
 * 直接调用 `react-dom/server.renderToStaticMarkup` 渲染 antd 的 `Masonry` 产出。
 * 机械 oracle，不是「我们读了源码之后写下的期望值」。
 *
 * ── 🚨 这个契约**几乎是空的**，而那正是上游的真实行为 ─────────────────────────
 *
 * antd 的 SSR 产物是 `<div class="apollo …" style="height:0"></div>` —— **一个条目都没有**。
 * 原因是 `mergedItems` 的一拍延迟（`useState([]) + useEffect`）：`useEffect` 在服务端
 * **不跑** ⇒ 服务端永远渲染空容器。本仓用 `onMounted` 复刻同一时机，所以同样为空 ✓
 * （这正是「一拍延迟必须复刻」那条判据的**可观测后果**）。
 *
 * ⇒ 本文件钉的是**结构**：根类名 / 根内联样式 / 语义化槽 / RTL。
 * **条目的类名与内联样式模板由 L2（`index.test.ts`）钉，排布结果由 L1 纯函数 + L6 钉。**
 *
 * ── 类名不做「事后归一化」──────────────────────────────────────────────────────
 *
 * 两侧传**同一个** `prefixCls`（`apollo`）。注意它是**完整前缀**：
 * `getPrefixCls('masonry', 'apollo')` 直接返回 `apollo`，根类名**没有** `-masonry` 段。
 * 默认前缀单独由 `prefix-cls:no-props` 用例覆盖（allow 登记为 D1）。
 *
 * ── 这个测试没有证明什么 ─────────────────────────────────────────────────────
 *   - 没证明**像素**一致（那是 L6，见 `tests/visual`）
 *   - 没证明排布正确（SSR 没有布局，`positions` 恒为空）
 */

import { type DomRenderResult, domContractTest } from '@apollo-design/test-utils';
import { defineComponent, h, provide, type VNodeChild } from 'vue';
import baseline from '../../../../../tests/compat/baselines/masonry.dom.json';
import {
  type ConfigContextValue,
  configContextKey,
  DEFAULT_CONFIG_CONTEXT,
} from '../../config-provider/context';
import { Masonry } from '../index';
import type { MasonryItemRenderInfo, MasonryItemType, MasonryProps } from '../interface';

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
const renderBamboo = ({ data, index, column }: MasonryItemRenderInfo<unknown>): VNodeChild =>
  h(
    'div',
    { class: 'bamboo', 'data-height': String(data), 'data-column': String(column) },
    String(index + 1),
  );

const HEIGHTS = [150, 30, 90, 70, 110];

const buildItems = (heights = HEIGHTS) =>
  heights.map((height, index) => ({ key: `item-${index}`, data: height }));

/** 所有用例都带 `itemRender` + `items`（与基线一致）。 */
const base = { itemRender: renderBamboo, items: buildItems() };

/**
 * 用例规格表：id → Vue 侧的 props / ctx。
 *
 * ⚠️ 必须覆盖基线里的**每一个**用例（`domContractTest` 会校验）。键名与
 * `tests/compat/baseline/masonry.mjs` 的 `push` 一一对应，缺一条即红。
 */
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
  // 两者都没有 ⇒ 条目是空的（`itemRender: undefined`）
  'masonry:item-no-content': {
    props: { prefixCls: PREFIX, itemRender: undefined, items: [{ key: 'a', data: 10 }] },
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
      /**
       * ⚠️ 故意**不给 `key`**：上游运行时用 `item.key ?? index` 兜底（JS 可达路径，
       * 基线生成器同样是 JS 侧产物）。
       * 但类型上 `MasonryItemType.key` 是**必填**（上游 `.d.ts` 也如此）⇒ 这里只能绕过类型。
       * 这条差异本身是**有意**的：类型严于运行时，是上游的原始形态。
       */
      items: [{ data: 10 }, { data: 20 }] as unknown as MasonryItemType[],
    },
  },
};

domContractTest('Masonry', {
  baseline,
  /**
   * `keepStyle: false` —— **与 date-picker 同判**。
   *
   * 根的内联样式在 SSR 下**恒为 `height:0`**（没有布局 ⇒ `totalHeight` 恒 0）
   * ⇒ 这条声明在本契约里**零信息量**；而保留它反而会引入一条纯序列化差异：
   * React 的 SSR 是字符串（对数字 0 不补 px ⇒ `height:0`），Vue 侧经 jsdom 的**真实 DOM**
   * 读回，CSSOM 把长度序列化成带单位的 `0px`（与 flex 的 `gap:0 → gap:0px` 同一现象）。
   *
   * ⚠️ 那条差异**能对齐**（`Masonry.vue` 的 `rootHeight` 已经让我们的 SSR 产物与上游逐字一致），
   * 但 L4 比的是「React 字符串 vs Vue DOM」⇒ 仍会差一个单位。
   * 与其为 20 个用例各登记一条 `[height:0] vs [height:0px]`（把可对齐的东西伪装成平台限制），
   * 不如**不把这条无信息量的声明纳入契约**，改在 L2 里钉真正有意义的
   * 「用户 `styles.root` 排在 `height` 之后」（`index.test.ts` 的语义化用例）。
   */
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
    const vnode = h(Masonry, spec.props as never);
    const result: DomRenderResult = spec.ctx ? withConfig(spec.ctx, () => vnode) : vnode;
    return result;
  },
});
