/**
 * Masonry 的类型定义（G2 产物）。
 *
 * 契约来源：antd 6.6.4 的 `es/masonry/Masonry.d.ts` / `MasonryItem.d.ts` /
 * `index.d.ts`（**重新定义**，不复制搬运 —— H2）。逐字段对齐名称、可选性与默认值。
 *
 * ── 四处平台映射（COMPONENT-RULES.md 规则 C16 / C18）─────────────────────────
 *
 * | antd | 本仓 | 理由 |
 * |---|---|---|
 * | `React.Key` | `MasonryKey = string \| number` | 与 tree / listy / message 同判 |
 * | `React.ReactNode` | `VNodeChild` | |
 * | `React.CSSProperties` | `Record<string, string \| number>` | 本仓内联样式惯例 |
 * | 泛型默认 `any` | `unknown` | H10 禁 `any`；upload / listy / checkbox 同判 |
 *
 * ── 本组件**没有**的东西（「有」比「没有」更容易搞错）──────────────────────────
 *
 * - **没有 `v-model`**：上游没有 `value` / `onChange` ⇒ 无 C11 双发可言。
 * - **没有默认插槽**：`Masonry.tsx` 从不读 `props.children`
 *   （类型上的 `PropsWithChildren` 是 `forwardRef` 写法的顺带产物），
 *   内容走 `items` + `#item` / `item.children`。
 * - **没有 Component Token**：上游 `ComponentToken` 是**空接口**（registry `tokenCount: 0`）。
 */

import type { VNodeChild } from 'vue';
import type { Breakpoint } from '../_internal/responsive-observer';
import type { Gutter } from '../grid/interface';

/** `React.Key` 的 Vue 对应物。 */
export type MasonryKey = string | number;

/** Item data and fallback content. Layout heights are always measured. */
export interface MasonryItemType<ItemDataType = unknown> {
  key: MasonryKey;
  /** 指定该 item 落在第几列（0 基）。不给 ⇒ 自动选**当前最矮**的一列。 */
  column?: number | undefined;
  /** Optional metadata forwarded to slots/events; does not set layout height. */
  height?: number | undefined;
  /** Fallback content when the item slot is absent. */
  children?: VNodeChild | undefined;
  /** 业务数据，原样透传给 `#item`。 */
  data: ItemDataType;
}

/** Current item scope. Column is provisional (0) before the first measurement. */
export type MasonryItemSlotProps<ItemDataType = unknown> = Omit<
  MasonryItemType<ItemDataType>,
  'column'
> & {
  index: number;
  column: number;
};

/** Native scoped slots. A present item slot overrides item.children, even when empty. */
export interface MasonrySlots<ItemDataType = unknown> {
  item?: (props: MasonryItemSlotProps<ItemDataType>) => VNodeChild;
}

/**
 * `onLayoutChange` 的载荷元素（上游 `onLayoutChange?: (sortInfo: { key; column }[]) => void`）。
 *
 * ⚠️ 运行时载荷是 **`{...item, column}`** —— 即 **item 本体被展开**
 * （`data` / `children` / `height` 都在），不是只有 `{key, column}`。
 * 类型按**实际**行为声明（上游的 `.d.ts` 写窄了）。
 */
export type MasonryLayoutItem<ItemDataType = unknown> = Omit<
  MasonryItemType<ItemDataType>,
  'column'
> & {
  column: number;
};

// ---------------------------------------------------------------------------
// 语义化（classNames / styles）—— 两个槽：`root` / `item`
// ---------------------------------------------------------------------------

export interface MasonrySemanticClassNames {
  root?: string | undefined;
  item?: string | undefined;
}

export interface MasonrySemanticStyles {
  root?: Record<string, string | number> | undefined;
  item?: Record<string, string | number> | undefined;
}

export interface MasonryProps<ItemDataType = unknown> {
  // ---------------------------------------------------------------- 样式
  /** 类名前缀。不传则从 ConfigProvider 取，兜底 `apollo-masonry`。 */
  prefixCls?: string | undefined;
  classNames?:
    | MasonrySemanticClassNames
    | ((info: { props: MasonryProps<ItemDataType> }) => MasonrySemanticClassNames)
    | undefined;
  styles?:
    | MasonrySemanticStyles
    | ((info: { props: MasonryProps<ItemDataType> }) => MasonrySemanticStyles)
    | undefined;

  // ---------------------------------------------------------------- 布局
  /** CSS spacing; numbers use px. Vertical percentages use zero-gap intrinsic
   * height, or the caller's explicit root height. @default 0 */
  gutter?: Gutter | undefined;
  /**
   * 列数。
   * - `number` ⇒ 直接用；
   * - 对象 ⇒ 按 `responsiveArray`（**从大到小**）取第一个「命中且非 `undefined`」的断点值；
   *   都没命中 ⇒ `columns.xs ?? 1`。
   * @default 3
   */
  columns?: number | Partial<Record<Breakpoint, number>> | undefined;
  /**
   * 为**每个 item** 单独挂 `ResizeObserver`（内容高度会变时用，如可点击变高的卡片）。
   * ⚠️ **不改变 DOM 结构**（上游的 `ResizeObserver` 是 `cloneElement`，不产节点）。
   * @default false
   */
  fresh?: boolean | undefined;

  // ---------------------------------------------------------------- 数据
  items?: MasonryItemType<ItemDataType>[] | undefined;

  // ---------------------------------------------------------------- 事件监听
  /**
   * `layoutChange` 的 Vue 事件监听器。全部当前条目完成测量后发布布局变化；
   * 与 `@layout-change` 是同一个事件，不另行调用回调。
   */
  onLayoutChange?: ((sortInfo: MasonryLayoutItem<ItemDataType>[]) => void) | undefined;
}

/** Native Vue events. This component has no v-model. */
export interface MasonryEmits<ItemDataType = unknown> {
  layoutChange: [sortInfo: MasonryLayoutItem<ItemDataType>[]];
}

/** Public Vue component ref. The getter returns null after unmount. */
export interface MasonryExpose {
  nativeElement: () => HTMLDivElement | null;
}

/** The component ref has the same shape as its exposed API. */
export type MasonryRef = MasonryExpose;
