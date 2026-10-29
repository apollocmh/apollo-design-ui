/**
 * Input 的公共导出。
 *
 * 与 antd 的 `es/input/index.js` 对齐：`Input` 默认导出 + 静态属性
 * `Input.Group` / `Input.TextArea` / `Input.Password` / `Input.Search` / `Input.OTP`；
 * 另有具名别名 `InputGroup` / `TextArea` / `InputPassword` / `InputSearch` / `InputOTP`
 * （Vue SFC 同时支持具名导出与 `Input.Password` 等静态成员）。
 */

import { withInstall } from '../_internal/with-install';
import { GroupComponent } from './Group';
import { InputComponent } from './Input';
import { OTPComponent } from './OTP';
import { PasswordComponent } from './Password';
import { SearchComponent } from './Search';
import { TextAreaComponent } from './TextArea';

/** Input 组件。注册名 `AInput`。 */
export const Input = withInstall(
  Object.assign(InputComponent, {
    Group: GroupComponent,
    TextArea: TextAreaComponent,
    Password: PasswordComponent,
    Search: SearchComponent,
    OTP: OTPComponent,
  }),
);

/** `Input.Group`（deprecated ⇒ Space.Compact）。 */
export const InputGroup = withInstall(GroupComponent);
/** `Input.TextArea`。 */
export const TextArea = withInstall(TextAreaComponent);
/** `Input.Password`。 */
export const InputPassword = withInstall(PasswordComponent);
/** `Input.Search`。 */
export const InputSearch = withInstall(SearchComponent);
/** `Input.OTP`。 */
export const InputOTP = withInstall(OTPComponent);

export default Input;

export type {
  AllowClearProp,
  InputCountProp,
  InputFocusOptions,
  InputGroupProps,
  InputPasswordProps,
  InputPasswordSlots,
  InputProps,
  InputRef,
  InputSearchProps,
  InputSearchSemanticClassNames,
  InputSearchSemanticContext,
  InputSearchSemanticStyles,
  InputSemanticClassNames,
  InputSemanticContext,
  InputSemanticStyles,
  InputSlots,
  OTPProps,
  OTPRef,
  OTPSemanticClassNames,
  OTPSemanticContext,
  OTPSemanticStyles,
  OTPSlots,
  PasswordSemanticClassNames,
  PasswordSemanticContext,
  ShowCountProp,
  TextAreaProps,
  TextAreaRef,
  TextAreaSemanticClassNames,
  TextAreaSemanticStyles,
} from './interface';
