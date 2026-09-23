/**
 * Listy 的类型契约（从 antd 6.6.4 的 `es/listy/index.d.ts` + `@rc-component/listy@1.2.3`
 * 的 `List.d.ts` **重新定义**，不复制）。
 */

import type { VNodeChild } from 'vue';

/** 项键。与 `@apollo-design/virtual-list` 的 `ItemKey` 对齐。 */
export type ListyKey = string | number;

/**
 * 行键：取项的字段名或取键函数。**必填** —— 没有它无法稳定复用 DOM 与定位。
 */
export type ListyRowKey<T> = keyof T | ((item: T) => ListyKey);

/** 吸顶 / 定位的对齐方式。 */
export type ListyScrollAlign = 'top' | 'bottom' | 'auto';

/** 语义槽位（rc 的 `ListySemanticName`）。 */
export type ListySemanticName = 'root' | 'item' | 'groupHeader';

export type ListyClassNames = Partial<Record<ListySemanticName, string>>;

/** 各语义槽的样式对象。 */
export type ListyStyleObject = Record<string, string | number>;
export type ListyStyles = Partial<Record<ListySemanticName, ListyStyleObject>>;

/** 分组配置。`key` 取组键；`title` 渲染组头（antd 原样，带参数所以保持函数）。 */
export interface ListyGroup<T, K extends ListyKey = ListyKey> {
  key: (item: T) => K;
  title: (groupKey: K, items: T[]) => VNodeChild;
}

// ============================== scrollTo ==============================

/** 按组键滚动。 */
export interface ListyGroupScrollToConfig {
  groupKey: ListyKey;
  align?: ListyScrollAlign;
  offset?: number;
}

/** 按项键滚动。 */
export interface ListyKeyScrollToConfig {
  key: ListyKey;
  align?: ListyScrollAlign;
  offset?: number;
}

/** 按绝对坐标滚动。 */
export interface ListyPositionScrollToConfig {
  left?: number;
  top?: number;
}

export type ListyScrollToConfig =
  | number
  | null
  | ListyKeyScrollToConfig
  | ListyPositionScrollToConfig
  | ListyGroupScrollToConfig;

/** ref 形状（rc 的 `ListyRef`）。 */
export interface ListyRef {
  scrollTo: (config?: ListyScrollToConfig) => void;
}

// ============================== Props ==============================

export interface ListyProps<T = Record<string, unknown>, K extends ListyKey = ListyKey> {
  /** 数据（undefined ⇒ 空数组）。 */
  items?: T[] | undefined;
  /** 行键。 */
  rowKey: ListyRowKey<T>;
  /** 项内容。 */
  itemRender?: ((item: T, index: number) => VNodeChild) | undefined;
  /** 分组配置。 */
  group?: ListyGroup<T, K> | undefined;
  /** 分组头吸顶。 */
  sticky?: boolean | undefined;
  /** 虚拟滚动。⚠️ antd 默认 `false`（`virtual ?? contextVirtual ?? false`）。 */
  virtual?: boolean | undefined;
  /** 容器高度（Raw ⇒ maxHeight；Virtual ⇒ 与 itemHeight 一起启用虚拟化）。 */
  height?: number | undefined;
  prefixCls?: string | undefined;
  rootClassName?: string | undefined;
  className?: string | undefined;
  style?: Record<string, string | number> | undefined;
  classNames?: Partial<Record<ListySemanticName, string>> | undefined;
  styles?: ListyStyles | undefined;
  onScroll?: ((event: Event) => void) | undefined;
}
