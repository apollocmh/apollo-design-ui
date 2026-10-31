import type { CSSProperties, VNodeChild } from 'vue';

export type ListyKey = string | number;
/** Only fields whose complete value is a stable key may be used as rowKey. */
type KeyField<T, P extends keyof T> = P extends keyof T
  ? T[P] extends ListyKey
    ? P
    : never
  : never;
export type ListyRowKeyField<T> = KeyField<T, keyof T>;
export type ListyRowKey<T> = ListyRowKeyField<T> | ((item: T) => ListyKey);
export type ListyScrollAlign = 'top' | 'bottom' | 'auto';
export type ListySemanticName = 'root' | 'item' | 'groupHeader';
export type ListyClassNames = Partial<Record<ListySemanticName, string>>;
export type ListyStyleObject = CSSProperties;
export type ListyStyles = Partial<Record<ListySemanticName, CSSProperties>>;

export interface ListyGroup<T, K extends ListyKey = ListyKey> {
  key: (item: T) => K;
}
export interface ListyItemSlotProps<T> {
  item: T;
  /** Index in the original items array, including grouped lists. */
  index: number;
}
export interface ListyGroupHeaderSlotProps<T, K extends ListyKey = ListyKey> {
  groupKey: K;
  items: T[];
  sticky: boolean;
  fixed: boolean;
}
export interface ListySlots<T = unknown, K extends ListyKey = ListyKey> {
  default?: (scope: ListyItemSlotProps<T>) => VNodeChild;
  groupHeader?: (scope: ListyGroupHeaderSlotProps<T, K>) => VNodeChild;
}
export interface ListyEmits {
  scroll: [event: Event];
}
export interface ListyGroupScrollToConfig<K extends ListyKey = ListyKey> {
  groupKey: K;
  align?: ListyScrollAlign;
  offset?: number;
}
export interface ListyKeyScrollToConfig {
  key: ListyKey;
  align?: ListyScrollAlign;
  offset?: number;
}
export interface ListyPositionScrollToConfig {
  left?: number;
  top?: number;
}
export type ListyScrollToConfig<K extends ListyKey = ListyKey> =
  | number
  | null
  | ListyKeyScrollToConfig
  | ListyPositionScrollToConfig
  | ListyGroupScrollToConfig<K>;
export interface ListyRef<K extends ListyKey = ListyKey> {
  scrollTo: (config?: ListyScrollToConfig<K>) => void;
}
export interface ListyProps<T = unknown, K extends ListyKey = ListyKey> {
  items?: T[] | undefined;
  rowKey: ListyRowKey<T>;
  group?: ListyGroup<T, K> | undefined;
  sticky?: boolean | undefined;
  virtual?: boolean | undefined;
  /** Raw: maxHeight. Virtual: viewport height. */
  height?: number | undefined;
  prefixCls?: string | undefined;
  classNames?: ListyClassNames | undefined;
  styles?: ListyStyles | undefined;
  onScroll?: ((event: Event) => void) | undefined;
}
