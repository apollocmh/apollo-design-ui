/**
 * Input 的公共导出。
 *
 * 与 antd 的 `es/input/index.js` 对齐：`Input` 默认导出 + 静态属性
 * `Input.Group` / `Input.TextArea` / `Input.Password` / `Input.Search` / `Input.OTP`；
 * 另有具名别名 `InputGroup` / `TextArea` / `InputPassword` / `InputSearch` / `InputOTP`
 * （Vue 模板里没有 `Input.Password` 这种写法，具名导出是模板唯一可用形态 ——
 * 与 Radio/Form 同判）。
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
  InputProps,
  InputRef,
  InputSearchProps,
  InputSearchSemanticClassNames,
  InputSearchSemanticContext,
  InputSearchSemanticStyles,
  InputSemanticClassNames,
  InputSemanticContext,
  InputSemanticStyles,
  OTPProps,
  OTPRef,
  OTPSemanticClassNames,
  OTPSemanticContext,
  OTPSemanticStyles,
  PasswordSemanticClassNames,
  ShowCountProp,
  TextAreaProps,
  TextAreaRef,
  TextAreaSemanticClassNames,
  TextAreaSemanticStyles,
} from './interface';
