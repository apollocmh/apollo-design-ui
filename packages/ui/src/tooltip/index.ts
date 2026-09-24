/**
 * Tooltip 的公共导出。
 */

import { withInstall } from '../_internal/with-install';
import PurePanelComponent from './PurePanel';
import TooltipComponent from './Tooltip';

/** Tooltip 组件。注册名 `ATooltip`（COMPONENT-RULES.md 规则 R2）。 */
export const Tooltip = withInstall(TooltipComponent);

/** 静态面板（`Tooltip._InternalPanelDoNotUseOrYouWillBeFired` 的对应物）。 */
export const TooltipPurePanel = withInstall(PurePanelComponent);

Tooltip._InternalPanelDoNotUseOrYouWillBeFired = TooltipPurePanel;

export type {
  AdjustOverflow,
  TooltipArrow,
  TooltipClassNames,
  TooltipContent,
  TooltipPlacement,
  TooltipProps,
  TooltipRef,
  TooltipSemanticType,
  TooltipStyles,
} from './interface';
export { genTooltipStyle } from './style';
export type { ComponentToken as TooltipComponentToken } from './style/token';
export { prepareComponentToken as prepareTooltipComponentToken } from './style/token';

export default Tooltip;
declare module './Tooltip' {
  // 静态属性挂载在下方，不重复声明
}
