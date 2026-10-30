/**
 * Menu 的公共导出。
 *
 * 与 antd 的 es/menu/index.js 对齐的对外面。
 */

import { withInstall } from '../_internal/with-install';
import MenuComponent from './Menu';
import MenuDividerComponent from './MenuDivider';
import MenuItemComponent from './MenuItem';
import MenuItemGroupComponent from './MenuItemGroup';
import SubMenuComponent from './SubMenu';

/** Menu 组件。注册名 `AMenu`（COMPONENT-RULES.md 规则 R2）。 */
/** 静态子组件（Menu.Item / Menu.SubMenu / Menu.Divider / Menu.ItemGroup 同物）。 */
export const MenuItem = withInstall(MenuItemComponent);
export const MenuSubMenu = withInstall(SubMenuComponent);
export const MenuDivider = withInstall(MenuDividerComponent);
export const MenuItemGroup = withInstall(MenuItemGroupComponent);

export const Menu = Object.assign(withInstall(MenuComponent), {
  Item: MenuItem,
  SubMenu: MenuSubMenu,
  Divider: MenuDivider,
  ItemGroup: MenuItemGroup,
});

export type {
  ItemType,
  MenuClassNames,
  MenuDividerType,
  MenuEmits,
  MenuInfo,
  MenuItemGroupSlots,
  MenuItemGroupType,
  MenuItemSlots,
  MenuItemType,
  MenuMode,
  MenuPopupSemanticType,
  MenuProps,
  MenuRef,
  MenuSemanticType,
  MenuSlots,
  MenuStyles,
  MenuSubMenuSlots,
  MenuTheme,
  SelectInfo,
  SubMenuSemanticType,
  SubMenuType,
  TriggerSubMenuAction,
} from './interface';
export { genMenuStyle, genMenuTokenDecls } from './style';
export type { ComponentToken as MenuComponentToken } from './style/token';
export { prepareComponentToken as prepareMenuComponentToken } from './style/token';

export default Menu;
