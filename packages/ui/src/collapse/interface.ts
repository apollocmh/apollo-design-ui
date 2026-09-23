/**
 * Collapse 的类型契约（从 antd 6.6.4 的 `es/collapse/*.d.ts` **重新定义**，不复制）。
 */

import type { VNodeChild } from 'vue';

/** 折叠交互模式。 */
export type CollapsibleType = 'header' | 'icon' | 'disabled';

/** 箭头位置。 */
export type ExpandIconPlacement = 'start' | 'end';

/** 面板 props（items 项 / Collapse.Panel 共用）。 */
export interface CollapsePanelProps {
  key?: string | number | undefined;
  /** items 形态的面板标题（children 形态用 `header`）。 */
  label?: VNodeChild | undefined;
  /** children 形态的面板标题。 */
  header?: VNodeChild | undefined;
  className?: string | undefined;
  style?: Record<string, string | number> | undefined;
  showArrow?: boolean | undefined;
  forceRender?: boolean | undefined;
  extra?: VNodeChild | undefined;
  collapsible?: CollapsibleType | undefined;
  /** @deprecated 用 `collapsible="disabled"`。 */
  disabled?: boolean | undefined;
  /** children 形态：面板内容（items 形态是 `children` 字段）。 */
  children?: VNodeChild | undefined;
  destroyOnHidden?: boolean | undefined;
  onItemClick?: ((key: string) => void) | undefined;
  headerClass?: string | undefined;
  id?: string | undefined;
  classNames?: CollapseSemanticClassNames | undefined;
  styles?: CollapseSemanticStyles | undefined;
}

export interface CollapseSemanticClassNames {
  root?: string | undefined;
  header?: string | undefined;
  title?: string | undefined;
  body?: string | undefined;
  icon?: string | undefined;
}

export interface CollapseSemanticStyles {
  root?: Record<string, string | number> | undefined;
  header?: Record<string, string | number> | undefined;
  title?: Record<string, string | number> | undefined;
  body?: Record<string, string | number> | undefined;
  icon?: Record<string, string | number> | undefined;
}

/** items 项的运行时形状（label/children 双支持）。 */
export interface CollapseItemType {
  key?: string | number | undefined;
  label?: VNodeChild | undefined;
  /** children 形态的对齐字段（rc Panel 的 header）。 */
  header?: VNodeChild | undefined;
  children?: VNodeChild | undefined;
  collapsible?: CollapsibleType | undefined;
  onItemClick?: ((key: string) => void) | undefined;
  destroyOnHidden?: boolean | undefined;
  forceRender?: boolean | undefined;
  showArrow?: boolean | undefined;
  extra?: VNodeChild | undefined;
  className?: string | undefined;
  style?: Record<string, string | number> | undefined;
  headerClass?: string | undefined;
  id?: string | undefined;
  classNames?: CollapseSemanticClassNames | undefined;
  styles?: CollapseSemanticStyles | undefined;
}

export interface CollapseProps {
  /** 面板列表（首选形态）。 */
  items?: CollapseItemType[] | undefined;
  activeKey?: (string | number)[] | string | number | undefined;
  defaultActiveKey?: (string | number)[] | string | number | undefined;
  /** 手风琴（同时只展开一个）。 */
  accordion?: boolean | undefined;
  /** @deprecated 用 `destroyOnHidden`。 */
  destroyInactivePanel?: boolean | undefined;
  destroyOnHidden?: boolean | undefined;
  className?: string | undefined;
  rootClassName?: string | undefined;
  style?: Record<string, string | number> | undefined;
  bordered?: boolean | undefined;
  prefixCls?: string | undefined;
  /** 自定义展开图标（返回 VNodeChild；panelProps 含 isActive/collapsible 等）。 */
  expandIcon?:
    | ((panelProps: {
        isActive?: boolean;
        prefixCls?: string;
        collapsible?: CollapsibleType;
      }) => VNodeChild)
    | undefined;
  expandIconPlacement?: ExpandIconPlacement | undefined;
  /** @deprecated 用 `expandIconPlacement`。 */
  expandIconPosition?: ExpandIconPlacement | undefined;
  ghost?: boolean | undefined;
  size?: 'large' | 'middle' | 'small' | undefined;
  collapsible?: CollapsibleType | undefined;
  /** @deprecated 用 `items`。 */
  children?: VNodeChild | undefined;
  onChange?: ((key: string[]) => void) | undefined;
  classNames?: CollapseSemanticClassNames | undefined;
  styles?: CollapseSemanticStyles | undefined;
}

/** ref 形状（antd 的 ref 指向根 div）。 */
export interface CollapseRef {
  nativeElement: HTMLDivElement | null;
}
