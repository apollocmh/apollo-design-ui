/**
 * Input 的公共导出。
 *
 * 与 antd 的 `es/input/index.js` 对齐：`Input` 默认导出 + 静态属性
 * `Input.Group` / `Input.TextArea` / `Input.Password`；另有具名别名
 * `InputGroup` / `TextArea` / `InputPassword`（Vue 模板里没有 `Input.Password`
 * 这种写法，具名导出是模板唯一可用形态 —— 与 Radio/Form 同判）。
 *
 * 本轮范围：Input / TextArea / Password / Group。`Search` / `OTP` 顺延
 * （见 docs/analysis/input.md §7，登记 INTENDED 缺口）。
 */

import { withInstall } from '../_internal/with-install';
import { GroupComponent } from './Group';
import { InputComponent } from './Input';
import { PasswordComponent } from './Password';
import { TextAreaComponent } from './TextArea';

/** Input 组件。注册名 `AInput`。 */
export const Input = withInstall(
  Object.assign(InputComponent, {
    Group: GroupComponent,
    TextArea: TextAreaComponent,
    Password: PasswordComponent,
  }),
);

/** `Input.Group`（deprecated ⇒ Space.Compact）。 */
export const InputGroup = withInstall(GroupComponent);
/** `Input.TextArea`。 */
export const TextArea = withInstall(TextAreaComponent);
/** `Input.Password`。 */
export const InputPassword = withInstall(PasswordComponent);

export default Input;

export type {
  AllowClearProp,
  InputCountProp,
  InputFocusOptions,
  InputGroupProps,
  InputPasswordProps,
  InputProps,
  InputRef,
  InputSemanticClassNames,
  InputSemanticContext,
  InputSemanticStyles,
  PasswordSemanticClassNames,
  ShowCountProp,
  TextAreaProps,
  TextAreaRef,
  TextAreaSemanticClassNames,
  TextAreaSemanticStyles,
} from './interface';
