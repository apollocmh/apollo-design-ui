/**
 * InputNumber 的公共导出。
 *
 * 与 antd 的 `es/input-number/index.js` 对齐：默认导出 InputNumber。
 * antd 的 `_InternalPanelDoNotUseOrYouWillBeFired`（PureInputNumber）在本仓
 * **暂不导出**（它是 handleVisible=true 的 ConfigProvider 预设包装，等
 * ConfigProvider 组件级 token 覆盖面落地后补 —— 登记 INTENDED，见 analysis §6 I9）。
 */

import { withInstall } from '../_internal/with-install';
import { InputNumberComponent } from './InputNumber';

/** InputNumber 组件。注册名 `AInputNumber`（COMPONENT-RULES.md 规则 R2）。 */
export const InputNumber = withInstall(InputNumberComponent);

export default InputNumber;

export type {
  InputNumberControls,
  InputNumberMode,
  InputNumberProps,
  InputNumberRef,
  InputNumberSemanticClassNames,
  InputNumberSemanticClassNamesFn,
  InputNumberSemanticContext,
  InputNumberSemanticStyles,
  InputNumberSemanticStylesFn,
  InputNumberStepInfo,
  ValueType,
} from './interface';
export { InputNumberComponent };
