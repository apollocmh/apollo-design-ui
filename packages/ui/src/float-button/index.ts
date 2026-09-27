/**
 * FloatButton 的公共导出。
 *
 * 与 antd 的 es/float-button/index.js 对齐的对外面（compound：Group / BackTop /
 * PurePanel）。
 */

import { withInstall } from '../_internal/with-install';
import BackTopComponent from './BackTop';
import FloatButtonComponent from './FloatButton';
import FloatButtonGroupComponent from './FloatButtonGroup';
import PurePanelComponent from './PurePanel';

/** FloatButton 组件。注册名 `AFloatButton`（COMPONENT-RULES.md 规则 R2）。 */
export const FloatButton = withInstall(FloatButtonComponent);
export const FloatButtonGroup = withInstall(FloatButtonGroupComponent);
export const FloatButtonBackTop = withInstall(BackTopComponent);

/** @private 调试面板（antd 的 `_InternalPanelDoNotUseOrYouWillBeFired` 对应物）。 */
export const FloatButtonPurePanel = withInstall(PurePanelComponent);

export default FloatButton;

export { floatButtonPrefixCls } from './FloatButton';
export type {
  FloatButtonBackTopProps,
  FloatButtonBadgeProps,
  FloatButtonGroupPlacement,
  FloatButtonGroupProps,
  FloatButtonGroupRef,
  FloatButtonGroupTrigger,
  FloatButtonProps,
  FloatButtonRef,
  FloatButtonShape,
  FloatButtonType,
} from './interface';
export { genFloatButtonStyle } from './style';
