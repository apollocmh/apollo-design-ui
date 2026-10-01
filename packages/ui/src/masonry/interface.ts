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
 *   内容一律走 `items` + `itemRender` / `item.children`。
 * - **没有 Component Token**：上游 `ComponentToken` 是**空接口**（registry `tokenCount: 0`）。
 */

import type { VNodeChild } from 'vue';
import type { Breakpoint } from '../_internal/responsive-observer';
import type { Gutter } from '../grid/interface';

/** `React.Key` 的 Vue 对应物。 */
export type MasonryKey = string | number;

/**
 * 一个 item（上游 `MasonryItemType<T>`）。
 *
 * ⚠️ **`height` 上游声明了但从不读** —— 高度一律**实测**
 * （`getBoundingClientRect().height`）。保留它只为对齐类型面
 * （`interface.ts` 不裁剪字段的既有约定：类型过了但运行时没实现比类型上没有更糟，
 * 而裁掉会让迁移代码编译不过）。
 */
export interface MasonryItemType<ItemDataType = unknown> {
  key: MasonryKey;
  /** 指定该 item 落在第几列（0 基）。不给 ⇒ 自动选**当前最矮**的一列。 */
  column?: number | undefined;
  /** @see 上面的说明：上游从不读它。 */
  height?: number | undefined;
  /** 内容。🚨 **优先于 `itemRender`**（上游 `item.children ?? itemRender?.(…)`）。 */
  children?: VNodeChild | undefined;
  /** 业务数据，原样透传给 `itemRender`。 */
  data: ItemDataType;
}

/**
 * `itemRender` 的入参（上游 `itemRender?: (itemInfo: MasonryItemType & { index }) => …`
 * 的展开形态）。
 *
 * ⚠️ `column` 是**最终列号**（`number`，非可选）—— 上游传的是
 * `{...item, index, column}`，即把解析出来的列号**覆盖**回 item 上。
 */
export type MasonryItemRenderInfo<ItemDataType = unknown> = Omit<
  MasonryItemType<ItemDataType>,
  'column'
> & {
  index: number;
  column: number;
};

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
  className?: string | undefined;
  rootClassName?: string | undefined;
  style?: Record<string, string | number> | undefined;
  classNames?:
    | MasonrySemanticClassNames
    | ((info: { props: MasonryProps<ItemDataType> }) => MasonrySemanticClassNames)
    | undefined;
  styles?:
    | MasonrySemanticStyles
    | ((info: { props: MasonryProps<ItemDataType> }) => MasonrySemanticStyles)
    | undefined;

  // ---------------------------------------------------------------- 布局
  /** 间距。复用 grid 的 `Gutter`（上游就是 `RowProps['gutter']`）。@default 0 */
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
  /** 单项渲染。🚨 优先级**低于** `item.children`。 */
  itemRender?: ((itemInfo: MasonryItemRenderInfo<ItemDataType>) => VNodeChild) | undefined;

  // ---------------------------------------------------------------- 回调
  /**
   * 布局顺序变化时触发（上游 `onLayoutChange`）。
   *
   * ⚠️ 上游两段 `useLayoutEffect` 都先判 `onLayoutChange &&` ⇒ 不传回调时**完全空转**；
   * 且只有在 `items.length === 已排布项数` 时才回调（长度不等时**不**回调）。
   */
  onLayoutChange?: ((sortInfo: MasonryLayoutItem<ItemDataType>[]) => void) | undefined;
}

/**
 * 事件（C11 双发不适用 —— 本组件没有 `v-model`）。
 *
 * ⚠️ `layoutChange` 是 `onLayoutChange` 的语义事件形态；两者**同时发**
 * （与全仓 `update:*` + 语义事件的约定一致，`PITFALLS 162`）。
 */
export interface MasonryEmits<ItemDataType = unknown> {
  layoutChange: [sortInfo: MasonryLayoutItem<ItemDataType>[]];
}

/**
 * 暴露的命令面（上游 `MasonryRef`）。
 *
 * ⚠️ 上游类型是 `nativeElement: HTMLDivElement`（非空）；本仓按
 * `SplitterRef` 的既有约定声明成可空 —— 未挂载时确实是 `null`，
 * 类型上写非空只是把断言推给消费者。
 */
export interface MasonryRef {
  nativeElement: HTMLDivElement | null;
}

/** `defineExpose` 的形态（`nativeElement` 做成**函数**：`setup` 期 `ref` 还是 `null`）。 */
export interface MasonryExpose {
  nativeElement: () => HTMLDivElement | null;
}
