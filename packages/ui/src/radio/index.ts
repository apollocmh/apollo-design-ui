/**
 * Radio 的公共导出。
 *
 * 提供可安装的 Radio、静态 Radio.Group / Radio.Button 及具名 RadioGroup / RadioButton。
 *
 * ⚠️ `Radio.__ANT_RADIO`：antd 的内部识别标记（`Radio.__ANT_RADIO = true`），
 *    上游 radio.test「have static property for type detecting」钉住它。
 */

import { withInstall } from '../_internal/with-install';
import { GroupComponent } from './Group';
import { RadioComponent } from './Radio';
import { ButtonComponent } from './RadioButton';

/** Radio 组件。注册名 `ARadio`（COMPONENT-RULES.md 规则 R2）。 */
export const Radio = withInstall(
  Object.assign(RadioComponent, {
    Group: GroupComponent,
    Button: ButtonComponent,
    /** antd 的内部识别标记。 */
    __ANT_RADIO: true,
  }),
);

/** `RadioGroup` 具名别名（= `Radio.Group`）。 */
export const RadioGroup = withInstall(GroupComponent);

/** `RadioButton` 具名别名（= `Radio.Button`）。 */
export const RadioButton = withInstall(ButtonComponent);

export default Radio;

export type {
  AbstractRadioProps,
  RadioChangeEvent,
  RadioEmits,
  RadioGroupButtonStyle,
  RadioGroupContextValue,
  RadioGroupEmits,
  RadioGroupOptionType,
  RadioGroupProps,
  RadioGroupRef,
  RadioGroupSlots,
  RadioOptionItem,
  RadioOptionLabel,
  RadioOrientation,
  RadioProps,
  RadioRef,
  RadioSemanticClassNames,
  RadioSemanticContext,
  RadioSemanticStyles,
  RadioSlots,
  RadioValue,
} from './interface';
export { genRadioStyle, genTokenDecls as genRadioTokenDecls } from './style';
export type { ComponentToken as RadioComponentToken } from './style/token';
export { prepareComponentToken as prepareRadioComponentToken } from './style/token';
