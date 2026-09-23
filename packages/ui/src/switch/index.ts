/**
 * Switch 的公共导出。
 *
 * 与 antd 的 `es/switch/index.js` 对齐：默认导出 Switch + `Switch.__ANT_SWITCH`
 * 静态标记（上游 index.test「have static property for type detecting」）。
 * Switch **没有**子组件（与 Radio/Checkbox 不同），所以不需要静态属性挂载。
 */

import { withInstall } from '../_internal/with-install';
import { SwitchComponent } from './Switch';

/** Switch 组件。注册名 `ASwitch`（COMPONENT-RULES.md 规则 R2）。 */
export const Switch = withInstall(
  Object.assign(SwitchComponent, {
    /** antd 的内部识别标记。 */
    __ANT_SWITCH: true,
  }),
);

export default Switch;

export type {
  SwitchChangeEventHandler,
  SwitchClickEventHandler,
  SwitchEvent,
  SwitchProps,
  SwitchRef,
  SwitchSemanticClassNames,
  SwitchSemanticContext,
  SwitchSemanticStyles,
  SwitchSize,
} from './interface';
export { genSwitchStyle, genTokenDecls as genSwitchTokenDecls } from './style';
export type { ComponentToken as SwitchComponentToken } from './style/token';
export { prepareComponentToken as prepareSwitchComponentToken } from './style/token';
