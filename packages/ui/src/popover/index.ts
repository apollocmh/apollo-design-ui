/**
 * Popover 的公共导出。
 *
 * 与 antd 的 es/popover/index.js 对齐的对外面。
 */

import { withInstall } from '../_internal/with-install';
import PopoverComponent from './Popover';
import PurePanelComponent from './PurePanel';

/** Popover 组件。注册名 `APopover`（COMPONENT-RULES.md 规则 R2）。 */
export const Popover = withInstall(PopoverComponent);

/** 静态面板（`Popover._InternalPanelDoNotUseOrYouWillBeFired` 的对应物）。 */
export const PopoverPurePanel = withInstall(PurePanelComponent);

Popover._InternalPanelDoNotUseOrYouWillBeFired = PopoverPurePanel;

export type {
  PopoverClassNames,
  PopoverProps,
  PopoverRef,
  PopoverSemanticType,
  PopoverStyles,
  TooltipArrow,
  TooltipContent,
  TooltipPlacement,
} from './interface';
export { genPopoverStyle, genPopoverTokenDecls } from './style';
export type { ComponentToken as PopoverComponentToken } from './style/token';
export { prepareComponentToken as preparePopoverComponentToken } from './style/token';

export default Popover;
