/**
 * menu 的类型定义（G2 产物）。
 *
 * 契约来源：antd `components/menu/interface.ts`（ItemType 泛型族）+
 * rc-menu `interface.d.ts`（MenuInfo/MenuRef）。按本仓 Vue 化约定重新定义（H2）：
 * icon 收窄为 RenderIconType（VNodeChild | 函数）。
 */

import type { VNodeChild } from 'vue';

export type MenuMode = 'horizontal' | 'vertical' | 'inline';
export type MenuTheme = 'light' | 'dark';
export type TriggerSubMenuAction = 'click' | 'hover';

/** rc 的 RenderIconInfo。 */
export interface RenderIconInfo {
  isSelected?: boolean;
  isOpen?: boolean;
  isSubMenu?: boolean;
  disabled?: boolean;
}

export type RenderIconType = VNodeChild | ((info: RenderIconInfo) => VNodeChild);

/** rc 的 MenuInfo（item 的 React 实例 → domEvent 的 Event）。 */
export interface MenuInfo {
  key: string;
  keyPath: string[];
  /** @deprecated 未来不再支持。 */
  item: unknown;
  domEvent: Event;
  itemData: ItemData;
}

export interface ItemData {
  label?: VNodeChild;
  itemIcon?: RenderIconType;
  extra?: VNodeChild;
  key: string;
  title?: string;
}

export interface SelectInfo extends MenuInfo {
  selectedKeys: string[];
}

export type MenuClickEventHandler = (info: MenuInfo) => void;
export type SelectEventHandler = (info: SelectInfo) => void;
export type MenuHoverEventHandler = (info: { key: string; domEvent: MouseEvent }) => void;

// ---------------------------------------------------------------------------
// items 联合（antd interface.ts 的 ItemType 族）
// ---------------------------------------------------------------------------

export interface MenuItemType {
  type?: 'item';
  label?: VNodeChild;
  key?: string;
  disabled?: boolean;
  danger?: boolean;
  icon?: RenderIconType;
  itemIcon?: RenderIconType;
  title?: string;
  extra?: VNodeChild;
  onMouseEnter?: MenuHoverEventHandler;
  onMouseLeave?: MenuHoverEventHandler;
  onClick?: MenuClickEventHandler;
}

export interface SubMenuType {
  type?: 'submenu';
  label?: VNodeChild;
  /** rc 的 string 形态 title（collapsed 态 Tooltip 通道）。 */
  title?: string;
  key?: string;
  disabled?: boolean;
  danger?: boolean;
  icon?: RenderIconType;
  itemIcon?: RenderIconType;
  expandIcon?: RenderIconType;
  children: ItemType[];
  rootClassName?: string;
  popupClassName?: string;
  popupOffset?: [number, number];
  popupStyle?: Record<string, string | number>;
  onMouseEnter?: MenuHoverEventHandler;
  onMouseLeave?: MenuHoverEventHandler;
  onTitleClick?: (info: { key: string; domEvent: MouseEvent }) => void;
  onTitleMouseEnter?: MenuHoverEventHandler;
  onTitleMouseLeave?: MenuHoverEventHandler;
  onClick?: MenuClickEventHandler;
}

export interface MenuItemGroupType {
  type: 'group';
  label?: VNodeChild;
  key?: string;
  children?: ItemType[];
}

export interface MenuDividerType {
  type: 'divider';
  key?: string;
  dashed?: boolean;
}

export type ItemType = MenuItemType | SubMenuType | MenuItemGroupType | MenuDividerType | null;

// ---------------------------------------------------------------------------
// 语义槽（antd menu.tsx 的 5+3 组；D36 手写接口）
// ---------------------------------------------------------------------------

export interface MenuSemanticType {
  classNames?: {
    root?: string;
    itemTitle?: string;
    list?: string;
    item?: string;
    itemIcon?: string;
    itemContent?: string;
  };
  styles?: {
    root?: Record<string, string | number>;
    itemTitle?: Record<string, string | number>;
    list?: Record<string, string | number>;
    item?: Record<string, string | number>;
    itemIcon?: Record<string, string | number>;
    itemContent?: Record<string, string | number>;
  };
}

export interface MenuPopupSemanticType {
  classNames?: { root?: string };
  styles?: { root?: Record<string, string | number> };
}

export interface SubMenuSemanticType {
  classNames?: {
    item?: string;
    itemTitle?: string;
    list?: string;
    itemContent?: string;
    itemIcon?: string;
  };
  styles?: {
    item?: Record<string, string | number>;
    itemTitle?: Record<string, string | number>;
    list?: Record<string, string | number>;
    itemContent?: Record<string, string | number>;
    itemIcon?: Record<string, string | number>;
  };
}

// ---------------------------------------------------------------------------
// expose（antd MenuRef + rc MenuRef）
// ---------------------------------------------------------------------------

export interface MenuRef {
  focus: (options?: FocusOptions) => void;
  list: HTMLUListElement | null;
  findItem: (params: { key: string }) => HTMLElement | null;
}
