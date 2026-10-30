/**
 * menu 的类型定义（G2 产物）。
 *
 * 契约来源：antd `components/menu/interface.ts`（ItemType 泛型族）+
 * rc-menu `interface.d.ts`（MenuInfo/MenuRef）。按本仓 Vue 化约定重新定义（H2）：
 * icon 收窄为 RenderIconType（VNodeChild | 函数）。
 */

import type { CSSProperties, HTMLAttributes, VNodeChild } from 'vue';
import type { TooltipProps } from '../tooltip/interface';

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

export interface MenuItemType
  extends Pick<
    HTMLAttributes,
    'aria-expanded' | 'aria-haspopup' | 'aria-label' | 'aria-describedby'
  > {
  type?: 'item';
  label?: VNodeChild;
  key?: string;
  disabled?: boolean;
  /**
   * 节点 `id`（rc 的 `MenuItemType` 继承 HTML 属性 ⇒ 本仓按需补这三个）。
   *
   * 用途：antd 的 Tabs 溢出下拉把 `li` 当 **`role="option"`** 用，
   * 需要 `id` + `aria-controls` 指回对应面板（`aria-activedescendant` 也指向它）。
   */
  id?: string;
  /** `li` 的 role。默认 `'menuitem'`；传 `'option'` 会同时补 `aria-selected`。 */
  role?: string | null;
  /** `role="option"` 时指回受控面板的 id。 */
  'aria-controls'?: string;
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
  /** 该子菜单弹层的独立主题（antd `SubMenuType.theme`）。 */
  theme?: MenuTheme;
  children: ItemType[];
  rootClassName?: string;
  popupClassName?: string;
  popupOffset?: [number, number];
  popupStyle?: CSSProperties;
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
    root?: CSSProperties;
    itemTitle?: CSSProperties;
    list?: CSSProperties;
    item?: CSSProperties;
    itemIcon?: CSSProperties;
    itemContent?: CSSProperties;
  };
}

export interface MenuPopupSemanticType {
  classNames?: { root?: string };
  styles?: { root?: CSSProperties };
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
    item?: CSSProperties;
    itemTitle?: CSSProperties;
    list?: CSSProperties;
    itemContent?: CSSProperties;
    itemIcon?: CSSProperties;
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

export type MenuSlots = {
  expandIcon?: (scope: RenderIconInfo) => VNodeChild;
};
export type MenuItemSlots = {
  default?: () => VNodeChild;
  title?: () => VNodeChild;
  icon?: (scope: RenderIconInfo) => VNodeChild;
  extra?: () => VNodeChild;
};
export type MenuItemGroupSlots = {
  default?: () => VNodeChild;
  title?: () => VNodeChild;
};
export type MenuSubMenuSlots = Pick<MenuItemSlots, 'title' | 'icon'> & {
  expandIcon?: (scope: RenderIconInfo) => VNodeChild;
};
export interface MenuEmits {
  'update:selectedKeys': (keys: string[]) => void;
  'update:openKeys': (keys: string[]) => void;
  click: MenuClickEventHandler;
  select: SelectEventHandler;
  deselect: SelectEventHandler;
  openChange: (keys: string[]) => void;
}
export type MenuClassNames = NonNullable<MenuSemanticType['classNames']> & {
  popup?: MenuPopupSemanticType['classNames'];
  subMenu?: SubMenuSemanticType['classNames'];
};
export type MenuStyles = NonNullable<MenuSemanticType['styles']> & {
  popup?: MenuPopupSemanticType['styles'];
  subMenu?: SubMenuSemanticType['styles'];
};

// ---------------------------------------------------------------------------
// MenuProps（rc MenuProps 的本仓子集 + antd 壳扩展）
// ---------------------------------------------------------------------------

export interface MenuProps {
  prefixCls?: string;
  mode?: MenuMode;
  theme?: MenuTheme;
  items?: ItemType[];
  inlineCollapsed?: boolean;
  disabled?: boolean;
  disabledOverflow?: boolean;
  selectable?: boolean;
  multiple?: boolean;
  selectedKeys?: string[];
  defaultSelectedKeys?: string[];
  openKeys?: string[];
  'onUpdate:selectedKeys'?: MenuEmits['update:selectedKeys'];
  'onUpdate:openKeys'?: MenuEmits['update:openKeys'];
  defaultOpenKeys?: string[];
  activeKey?: string;
  inlineIndent?: number;
  subMenuOpenDelay?: number;
  subMenuCloseDelay?: number;
  forceSubMenuRender?: boolean;
  triggerSubMenuAction?: TriggerSubMenuAction;
  getPopupContainer?: (node: HTMLElement) => HTMLElement | ShadowRoot;
  tabIndex?: number;
  role?: string;
  id?: string;
  onClick?: MenuClickEventHandler;
  onSelect?: SelectEventHandler;
  onDeselect?: SelectEventHandler;
  onOpenChange?: (openKeys: string[]) => void;
  onKeydown?: (e: KeyboardEvent) => void;
  /** 折叠态 item 标题的 Tooltip 配置（`false` 关闭）。 */
  tooltip?: false | TooltipProps;
  classNames?: MenuClassNames;
  styles?: MenuStyles;
}
