/**
 * `virtual-list` 的类型契约。
 *
 * 这些类型全部是**纯数据**：键、偏移、范围、滚动目标。
 * DOM 类型只出现在组件层与 `useHeights`（`src/use-heights.ts`）。
 */

import type { Component, CSSProperties, HTMLAttributes, VNodeChild, VNodeProps } from 'vue';
import type { ScrollArg } from './scroll-target';

/** 项键。与 React 的 `React.Key` 对齐（`string | number`）。 */
export type ItemKey = string | number;

export type GetKey<T> = (item: T) => ItemKey;

/** 对齐方式。只出现在 `scrollTo({ align })` 与 `getSize` 的入参里。 */
export type ScrollAlign = 'top' | 'bottom';

/** 虚拟滚动偏移。RTL 下 `x` 取 `-offsetLeft`。 */
export interface ScrollInfo {
  x: number;
  y: number;
}

/** 按「绝对坐标」滚动。 */
export interface ScrollPos {
  left?: number;
  top?: number;
}

/** 按「项」滚动。`index` 与 `key` 二选一。 */
export interface ScrollTarget {
  index?: number;
  key?: ItemKey;
  align?: ScrollAlign;
  /** 相对 `align` 的额外偏移；可以是函数（拿到 `getSize` 后计算） */
  offset?: number | ((info: ScrollOffsetInfo) => number);
}

export type ScrollConfig = ScrollTarget | ScrollPos;

export interface ScrollOffsetInfo {
  getSize: GetSize;
  align?: ScrollAlign | undefined;
}

/**
 * 查询两个键之间的区间尺寸。
 *
 * ⚠️ `top` 是**第一项的顶**（含），`bottom` 是**最后一项的底**（含）。
 *    单项查询时 `startKey === endKey`。
 */
export type GetSize = (startKey: ItemKey, endKey?: ItemKey) => { top: number; bottom: number };

/** `computeRange` 的返回值。 */
export interface RangeResult {
  /** 内容总高；**非虚拟路径下是 `undefined`**（上游如此，不是 0） */
  scrollHeight: number | undefined;
  /** 起始项下标（含） */
  start: number;
  /** 结束项下标（含，且已含「多渲染一项」） */
  end: number;
  /** Filler 内层的 `translateY`；**非虚拟路径下是 `undefined`** */
  offset: number | undefined;
}

/** 只读的高度查询口子。`CacheMap` 与假对象都满足它。 */
export interface HeightsLookup {
  get(key: ItemKey): number | undefined;
}

/** Native item slot scope. Exactly one measurable HTMLElement root is required. */
export interface VirtualListItemSlotProps<T> {
  item: T;
  index: number;
  style: CSSProperties;
  offsetX: number;
}

/** `extraRender` 的入参。与上游 `interface.d.ts` 的 `ExtraRenderInfo` 对齐。 */
export interface ExtraRenderInfo {
  /** 本帧渲染的起始项下标 */
  start: number;
  /** 本帧渲染的结束项下标 */
  end: number;
  /** 当前是否真的在虚拟渲染（对应上游的 `inVirtual`） */
  virtual: boolean;
  /** 横向偏移 */
  offsetX: number;
  /** holder 的真实 `scrollTop` */
  scrollTop: number;
  /** Filler 内层的 `translateY` */
  offsetY: number | undefined;
  rtl: boolean;
  getSize: GetSize;
}

/** 容器尺寸快照。 */
export interface SizeInfo {
  width: number;
  height: number;
}

/** Field keys must resolve to stable item keys, without requiring an object index signature. */
type KeyField<T, P extends keyof T> = P extends keyof T
  ? T[P] extends ItemKey
    ? P
    : never
  : never;
export type VirtualListItemKey<T> = KeyField<T, keyof T> | GetKey<T>;
export type VirtualListSlots<T = unknown> = {
  default?: (scope: VirtualListItemSlotProps<T>) => VNodeChild;
  extra?: (info: ExtraRenderInfo) => VNodeChild;
};
export interface VirtualListEmits<T = unknown> {
  scroll: [event: Event];
  virtualScroll: [info: ScrollInfo];
  visibleChange: [visibleList: T[], fullList: T[]];
}
export type VirtualListInnerProps = HTMLAttributes & VNodeProps & Record<string, unknown>;
export type VirtualListProps<T = unknown> = {
  prefixCls?: string | undefined;
  data?: T[] | undefined;
  height?: number | undefined;
  itemHeight?: number | undefined;
  itemKey: VirtualListItemKey<T>;
  fullHeight?: boolean | undefined;
  virtual?: boolean | undefined;
  direction?: 'ltr' | 'rtl' | undefined;
  scrollWidth?: number | undefined;
  innerProps?: VirtualListInnerProps | undefined;
  component?: string | Component | undefined;
  onScroll?: ((event: Event) => void) | undefined;
  onVirtualScroll?: ((info: ScrollInfo) => void) | undefined;
  onVisibleChange?: ((visibleList: T[], fullList: T[]) => void) | undefined;
};
export type ScrollTo = (arg?: ScrollArg) => void;
export interface VirtualListExposed {
  readonly nativeElement: HTMLElement | null;
  readonly containerElement: HTMLElement | null;
  getScrollInfo(): ScrollInfo;
  scrollTo: ScrollTo;
}

export type FillerProps = {
  prefixCls?: string | undefined;
  height?: number | undefined;
  offsetY?: number | undefined;
  rtl?: boolean | undefined;
  scrollWidth?: number | undefined;
  innerProps?: VirtualListInnerProps | undefined;
  onInnerResize?: (() => void) | undefined;
};
export type FillerSlots = {
  default?: () => VNodeChild;
  extra?: () => VNodeChild;
};
export interface FillerEmits {
  innerResize: [];
}
export interface FillerExposed {
  getInnerHeight(): number;
}
