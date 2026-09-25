/**
 * Dropdown 的公共导出。
 *
 * 与 antd 的 es/dropdown/index.js 对齐的对外面。
 */

import { withInstall } from '../_internal/with-install';
import DropdownComponent from './Dropdown';
import DropdownButtonComponent from './DropdownButton';
import PurePanelComponent from './PurePanel';

/** Dropdown 组件。注册名 `ADropdown`（COMPONENT-RULES.md 规则 R2）。 */
export const Dropdown = withInstall(DropdownComponent);

/** 复合按钮（⚠️ antd 已 deprecated，本仓保留同款告警）。 */
export const DropdownButton = withInstall(DropdownButtonComponent);

/** 静态面板（`Dropdown._InternalPanelDoNotUseOrYouWillBeFired` 的对应物）。 */
export const DropdownPurePanel = withInstall(PurePanelComponent);

Dropdown._InternalPanelDoNotUseOrYouWillBeFired = DropdownPurePanel as never;
Dropdown.Button = DropdownButton as never;

export type {
  DropdownArrowOptions,
  DropdownButtonProps,
  DropdownPlacement,
  DropdownPopupPlacement,
  DropdownProps,
  DropdownSemanticType,
  DropdownTriggerAction,
} from './interface';
export { genDropdownStyle, genDropdownTokenDecls } from './style';
export type { ComponentToken as DropdownComponentToken } from './style/token';
export { prepareComponentToken as prepareDropdownComponentToken } from './style/token';

export default Dropdown;
