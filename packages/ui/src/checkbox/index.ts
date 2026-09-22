/**
 * Checkbox 的公共导出。
 *
 * 与 antd 的 `es/checkbox/index.js` 对齐：默认导出 Checkbox，静态挂
 * `Checkbox.Group`（Skeleton / Statistic / Layout 同范式）。
 */

import { withInstall } from '../_internal/with-install';
import { CheckboxComponent } from './Checkbox';
import { GroupComponent } from './Group';

/** Checkbox 组件。注册名 `ACheckbox`（COMPONENT-RULES.md 规则 R2）。 */
export const Checkbox = withInstall(
  Object.assign(CheckboxComponent, {
    Group: GroupComponent,
  }),
);

/** `CheckboxGroup` 具名别名（= `Checkbox.Group`）。 */
export const CheckboxGroup = withInstall(GroupComponent);

export default Checkbox;

export type {
  AbstractCheckboxProps,
  CheckboxChangeEvent,
  CheckboxChangeEventTarget,
  CheckboxGroupContext,
  CheckboxGroupProps,
  CheckboxGroupRef,
  CheckboxOptionType,
  CheckboxProps,
  CheckboxRef,
  CheckboxSemanticClassNames,
  CheckboxSemanticContext,
  CheckboxSemanticStyles,
} from './interface';
export { genCheckboxStyle } from './style';
export type { ComponentToken as CheckboxComponentToken } from './style/token';
