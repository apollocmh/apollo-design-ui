/** Current Collapse data, native Vue composition and disclosure contracts. */
import type { CSSProperties, StyleValue, VNodeChild } from 'vue';

export type CollapsibleType = 'header' | 'icon' | 'disabled';
export type ExpandIconPlacement = 'start' | 'end';
export type CollapseHeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
export type CollapseSize = 'large' | 'middle' | 'small';
export interface CollapseSemanticClassNames {
  root?: string;
  header?: string;
  title?: string;
  body?: string;
  icon?: string;
}
export interface CollapseSemanticStyles {
  root?: CSSProperties;
  header?: CSSProperties;
  title?: CSSProperties;
  body?: CSSProperties;
  icon?: CSSProperties;
}
export interface CollapseExpandIconScope {
  key: string;
  isActive: boolean;
  prefixCls: string;
  collapsible: CollapsibleType | undefined;
  direction: 'ltr' | 'rtl';
}
/** Programmatic defaults; the component renderer itself is a named slot. */
export interface CollapseConfig {
  className?: string;
  style?: CSSProperties;
  classNames?: CollapseSemanticClassNames;
  styles?: CollapseSemanticStyles;
  expandIcon?: (scope: CollapseExpandIconScope) => VNodeChild;
}
export interface CollapsePanelProps {
  key?: string | number;
  header?: string;
  /** Existing VNode data fallback after header; a present #header has priority. */
  label?: VNodeChild;
  /** Existing item target, not a replacement for native class. */
  className?: string;
  style?: StyleValue;
  prefixCls?: string;
  showArrow?: boolean;
  forceRender?: boolean;
  collapsible?: CollapsibleType;
  /** @deprecated Use collapsible=disabled. */
  disabled?: boolean;
  destroyOnHidden?: boolean;
  onItemClick?: (key: string) => void;
  headerClass?: string;
  id?: string;
  classNames?: CollapseSemanticClassNames;
  styles?: CollapseSemanticStyles;
}
export interface CollapseItemType {
  key?: string | number;
  label?: VNodeChild;
  header?: VNodeChild;
  children?: VNodeChild;
  extra?: VNodeChild;
  collapsible?: CollapsibleType;
  onItemClick?: (key: string) => void;
  destroyOnHidden?: boolean;
  forceRender?: boolean;
  showArrow?: boolean;
  className?: string;
  style?: StyleValue;
  headerClass?: string;
  id?: string;
  classNames?: CollapseSemanticClassNames;
  styles?: CollapseSemanticStyles;
}
export interface CollapseProps {
  items?: CollapseItemType[];
  activeKey?: (string | number)[] | string | number;
  defaultActiveKey?: (string | number)[] | string | number;
  accordion?: boolean;
  /** @deprecated Use destroyOnHidden. */
  destroyInactivePanel?: boolean;
  destroyOnHidden?: boolean;
  bordered?: boolean;
  prefixCls?: string;
  expandIconPlacement?: ExpandIconPlacement;
  /** @deprecated Use expandIconPlacement. */
  expandIconPosition?: ExpandIconPlacement;
  ghost?: boolean;
  size?: CollapseSize;
  collapsible?: CollapsibleType;
  headingLevel?: CollapseHeadingLevel;
  onChange?: (key: string[]) => void;
  classNames?: CollapseSemanticClassNames;
  styles?: CollapseSemanticStyles;
}
export interface CollapseSlots {
  default?: () => VNodeChild;
  expandIcon?: (scope: CollapseExpandIconScope) => VNodeChild;
}
export interface CollapsePanelSlots {
  default?: () => VNodeChild;
  header?: () => VNodeChild;
  extra?: () => VNodeChild;
}
export interface CollapseRef {
  nativeElement: HTMLDivElement | null;
}
