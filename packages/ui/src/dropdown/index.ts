/**
 * Dropdown 的公共导出。
 *
 * 与 antd 的 es/dropdown/index.js 对齐的对外面。
 */

import { withInstall } from '../_internal/with-install';
import DropdownComponent from './Dropdown';
import DropdownButtonComponent from './DropdownButton';
import PurePanelComponent from './PurePanel';

/** Apollo split-button composition. */
export const DropdownButton = withInstall(DropdownButtonComponent);

/** 静态面板（`Dropdown._InternalPanelDoNotUseOrYouWillBeFired` 的对应物）。 */
export const DropdownPurePanel = withInstall(PurePanelComponent);

/** Dropdown component and its typed existing static aliases. */
export const Dropdown = Object.assign(withInstall(DropdownComponent), {
  _InternalPanelDoNotUseOrYouWillBeFired: DropdownPurePanel,
  Button: DropdownButton,
});

export type {
  DropdownArrowOptions,
  DropdownButtonEmits,
  DropdownButtonProps,
  DropdownButtonRef,
  DropdownButtonSlots,
  DropdownClassNames,
  DropdownEmits,
  DropdownOpenInfo,
  DropdownPlacement,
  DropdownPopupPlacement,
  DropdownPopupRenderSlotProps,
  DropdownProps,
  DropdownRef,
  DropdownSemanticType,
  DropdownSlots,
  DropdownStyles,
  DropdownTriggerAction,
} from './interface';
export { genDropdownStyle, genDropdownTokenDecls } from './style';
export type { ComponentToken as DropdownComponentToken } from './style/token';
export { prepareComponentToken as prepareDropdownComponentToken } from './style/token';

export default Dropdown;
