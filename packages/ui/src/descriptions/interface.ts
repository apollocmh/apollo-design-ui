/** Apollo's native Vue description-list contracts. */
import type { CSSProperties, StyleValue, VNodeChild } from 'vue';
import type { Breakpoint } from '../_internal/responsive-observer';

export type DescriptionsColumn = number | Partial<Record<Breakpoint, number>>;
/** `filled` consumes the remainder of the current row and then ends that row. */
export type DescriptionsItemSpan = number | 'filled' | Partial<Record<Breakpoint, number>>;

export interface DescriptionsItemType {
  key?: PropertyKey;
  label?: VNodeChild;
  children?: VNodeChild;
  span?: DescriptionsItemSpan;
  prefixCls?: string;
  /** Data-record class; template Items use native `class`. */
  className?: string;
  style?: StyleValue;
  /** @deprecated Use styles.label. */
  labelStyle?: CSSProperties;
  /** @deprecated Use styles.content. */
  contentStyle?: CSSProperties;
  styles?: { label?: CSSProperties; content?: CSSProperties };
  classNames?: { label?: string; content?: string };
}

export interface DescriptionsItemProps {
  label?: string;
  span?: DescriptionsItemSpan;
  prefixCls?: string;
  /** @deprecated Use native class. */
  className?: string;
  /** @deprecated Use styles.label. */
  labelStyle?: CSSProperties;
  /** @deprecated Use styles.content. */
  contentStyle?: CSSProperties;
  styles?: DescriptionsItemType['styles'];
  classNames?: DescriptionsItemType['classNames'];
}

export interface DescriptionsSemanticClassNames {
  root?: string;
  header?: string;
  title?: string;
  extra?: string;
  label?: string;
  content?: string;
}
export interface DescriptionsSemanticStyles {
  root?: CSSProperties;
  header?: CSSProperties;
  title?: CSSProperties;
  extra?: CSSProperties;
  label?: CSSProperties;
  content?: CSSProperties;
}
export interface DescriptionsSemanticInfo {
  props: DescriptionsProps;
}
export type DescriptionsConfig = {
  className?: string;
  style?: CSSProperties;
  classNames?:
    | DescriptionsSemanticClassNames
    | ((info: DescriptionsSemanticInfo) => DescriptionsSemanticClassNames);
  styles?:
    | DescriptionsSemanticStyles
    | ((info: DescriptionsSemanticInfo) => DescriptionsSemanticStyles);
};
export interface DescriptionsProps {
  prefixCls?: string;
  id?: string;
  bordered?: boolean;
  size?: 'large' | 'medium' | 'small' | 'default' | 'middle';
  /** Text title; a present #title slot takes priority, including an empty slot. */
  title?: string;
  column?: DescriptionsColumn;
  layout?: 'horizontal' | 'vertical';
  colon?: boolean;
  /** @deprecated Use styles.label. */
  labelStyle?: CSSProperties;
  /** @deprecated Use styles.content. */
  contentStyle?: CSSProperties;
  /** Takes priority over the default slot, including an empty array. */
  items?: DescriptionsItemType[];
  classNames?: DescriptionsConfig['classNames'];
  styles?: DescriptionsConfig['styles'];
}
export interface DescriptionsSlots {
  default?: () => VNodeChild;
  title?: () => VNodeChild;
  extra?: () => VNodeChild;
}
export interface DescriptionsItemSlots {
  default?: () => VNodeChild;
  label?: () => VNodeChild;
}
export interface DescriptionsRef {
  nativeElement: HTMLDivElement | null;
}
/** Normalized row entry; index is a fallback identity for entries without a key. */
export interface DescriptionsRowItem extends Omit<DescriptionsItemType, 'span'> {
  span?: number;
  filled?: boolean;
  index: number;
}
