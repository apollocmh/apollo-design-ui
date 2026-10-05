/**
 * Grid 的类型面（Row + Col）。
 *
 * 契约来源：antd 6.6.4 的 `es/grid/row.d.ts` / `col.d.ts` / `hooks/useGutter.d.ts`。
 * **逐字段对齐**。有意差异见 `packages/ui/src/grid/README.md`。
 *
 * ── 与 antd 类型面的差异 ─────────────────────────────────────────────────────
 *
 * 1. `children` 不在 Props 里（规则 C19）—— Vue 侧是默认插槽。
 * 2. `React.CSSProperties` → Vue 的 `CSSProperties`（规则 C16）。
 */

import type { ComputedRef, CSSProperties } from 'vue';
import type { Breakpoint } from '../_internal/responsive-observer';

export type { Breakpoint };

/** 响应式取值：直接给值，或按断点给值（antd 的 `RowAlign` / gutter 泛型同构）。 */
export type ResponsiveValue<T> = T | Partial<Record<Breakpoint, T>>;

/** gutter 的单值。数字按 px、字符串原样（`calc()` / 百分比均可）。 */
export type GutterValue = number | string;

/** 水平 + 纵向。与 antd 的 `Gutter` 一致。 */
export type Gutter = GutterValue | ResponsiveValue<GutterValue> | readonly [Gutter, GutterValue];

export type RowJustify =
  | 'start'
  | 'end'
  | 'center'
  | 'space-around'
  | 'space-between'
  | 'space-evenly';

export type RowAlign = 'top' | 'middle' | 'bottom' | 'stretch';

/** Col 的响应式对象取值。与 antd 的 `col.d.ts` 内嵌接口同构。 */
export interface ColSize {
  span?: number;
  order?: number;
  offset?: number;
  push?: number;
  pull?: number;
  flex?: string | number;
}

export interface RowProps {
  /** 类名前缀。不传则从 ConfigProvider 取，兜底 `apollo-row`。 */
  prefixCls?: string;
  /** 间距。 */
  gutter?: Gutter;
  /** 主轴对齐。 */
  justify?: ResponsiveValue<RowJustify>;
  /** 交叉轴对齐。 */
  align?: ResponsiveValue<RowAlign>;
  /**
   * 是否自动换行。
   *
   * ⚠️ 未传必须保持 `undefined`（D21）：antd 的判据是 `wrap === false` 才加
   * `-no-wrap` —— 未传与显式 true 同效，但「显式 false」经 provide 传给 Col
   * 时参与 `wrap === false` 的 minWidth hack 判断，不能被 Boolean 转换破坏。
   */
  wrap?: boolean;
}

export interface ColProps {
  /** 类名前缀。不传则从 ConfigProvider 取，兜底 `apollo-col`。 */
  prefixCls?: string;
  /** 栅格占位（1–24）。 */
  span?: number;
  /** 栅格顺序。 */
  order?: number;
  /** 左侧间隔栅格数。 */
  offset?: number;
  /** 右移栅格数。 */
  push?: number;
  /** 左移栅格数。 */
  pull?: number;
  /** flex 布局填充。`'auto'` / 数字 / 长度串 / 原样。 */
  flex?: string | number;
  /** ≥<576px 响应式栅格。 */
  xs?: number | ColSize;
  /** ≥576px 响应式栅格。 */
  sm?: number | ColSize;
  /** ≥768px 响应式栅格。 */
  md?: number | ColSize;
  /** ≥992px 响应式栅格。 */
  lg?: number | ColSize;
  /** ≥1200px 响应式栅格。 */
  xl?: number | ColSize;
  /** ≥1600px 响应式栅格。 */
  xxl?: number | ColSize;
  /** ≥1920px 响应式栅格。 */
  xxxl?: number | ColSize;
}

/** Row 在 ConfigProvider 上的组件配置（antd：无额外字段，仅基础项）。 */
export interface RowConfig {
  className?: string;
  style?: CSSProperties;
}

/** Col 在 ConfigProvider 上的组件配置（antd：无额外字段，仅基础项）。 */
export interface ColConfig {
  className?: string;
  style?: CSSProperties;
}

/**
 * Row 向 Col 提供的上下文。与 antd 的 `RowContext` 同构。
 *
 * antd 每次 render 重建 context 值（React 的更新模型）；Vue 侧用 `ComputedRef`
 * 承载 —— Col 在 computed 里读 `.value`，Row 的 gutter/wrap 变化能传导（D27 的反面：
 * provide 的是 ref 本身，不是快照）。
 */
export interface RowContextValue {
  gutter: ComputedRef<readonly [GutterValue | undefined, GutterValue | undefined]>;
  wrap: ComputedRef<boolean | undefined>;
}

/** ref 暴露面。与 antd 的 `RefAttributes<HTMLDivElement>` 对应。 */
export interface GridRef {
  nativeElement: HTMLElement | null;
}

/** 默认插槽。 */
export type GridSlot = () => unknown;
