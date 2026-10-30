/** Native Checkbox props, owned event listeners and scalar option data contracts. */

import type { CSSProperties, StyleValue, VNodeChild } from 'vue';

/** 与 antd 的 `CheckboxRef`（@rc-component/checkbox）一致。 */
export interface CheckboxRef {
  focus: (options?: FocusOptions) => void;
  blur: () => void;
  input: HTMLInputElement | null;
  nativeElement: HTMLElement | null;
}

/** Native change event; the requested checked value is emitted separately. */
export type CheckboxChangeEvent = Event;
export type CheckboxValueType = string | number | boolean;
export interface CheckboxEmits {
  'update:checked': (checked: boolean) => void;
  change: (event: Event, checked: boolean) => void;
  click: (event: MouseEvent) => void;
  mouseenter: (event: MouseEvent) => void;
  mouseleave: (event: MouseEvent) => void;
  focus: (event: FocusEvent) => void;
  blur: (event: FocusEvent) => void;
  keydown: (event: KeyboardEvent) => void;
  keypress: (event: KeyboardEvent) => void;
}
export interface CheckboxSlots {
  default?: () => VNodeChild;
}

export interface CheckboxSemanticClassNames {
  root?: string;
  icon?: string;
  label?: string;
}

export interface CheckboxSemanticStyles {
  root?: CSSProperties;
  icon?: CSSProperties;
  label?: CSSProperties;
}

/** 语义化函数形态的入参（antd 的 `GenerateSemantic`）。 */
export interface CheckboxSemanticContext {
  props: CheckboxProps;
}

export type CheckboxSemanticClassNamesFn = (
  context: CheckboxSemanticContext,
) => CheckboxSemanticClassNames;
export type CheckboxSemanticStylesFn = (context: CheckboxSemanticContext) => CheckboxSemanticStyles;

export interface AbstractCheckboxProps {
  prefixCls?: string;
  defaultChecked?: boolean;
  checked?: boolean;
  disabled?: boolean;
  title?: string;
  onChange?: CheckboxEmits['change'];
  onClick?: (e: MouseEvent) => void;
  onMouseenter?: (e: MouseEvent) => void;
  onMouseleave?: (e: MouseEvent) => void;
  onKeypress?: (e: KeyboardEvent) => void;
  onKeydown?: (e: KeyboardEvent) => void;
  onFocus?: (e: FocusEvent) => void;
  onBlur?: (e: FocusEvent) => void;
  /** ⚠️ 组外传 `value` 不是有效 prop（发 usage 告警）；在 Group 内是选项值。 */
  value?: CheckboxValueType;
  tabIndex?: number;
  name?: string;
  id?: string;
  autoFocus?: boolean;
  skipGroup?: boolean;
  required?: boolean;
}

export interface CheckboxProps extends AbstractCheckboxProps {
  indeterminate?: boolean;
  classNames?: CheckboxSemanticClassNames | CheckboxSemanticClassNamesFn;
  styles?: CheckboxSemanticStyles | CheckboxSemanticStylesFn;
}

// ================================ Group ================================

export interface CheckboxOptionType<T extends CheckboxValueType = CheckboxValueType> {
  label: VNodeChild;
  value: T;
  style?: CSSProperties;
  className?: string;
  disabled?: boolean;
  title?: string;
  id?: string;
  onChange?: CheckboxEmits['change'];
  required?: boolean;
}

export interface CheckboxGroupProps<T extends CheckboxValueType = CheckboxValueType> {
  prefixCls?: string;
  options?: (CheckboxOptionType<T> | string | number)[];
  disabled?: boolean;
  style?: StyleValue;
  name?: string;
  defaultValue?: T[];
  value?: T[];
  onChange?: (checkedValue: T[]) => void;
  role?: string;
}

/** 暴露给父组件的实例（antd：Group 的 ref 是 `HTMLDivElement`）。 */
export interface CheckboxGroupRef {
  nativeElement: HTMLDivElement | null;
}

/** GroupContext（antd 的 `GroupContextValue`）。 */
export interface CheckboxGroupContext {
  toggleOption: (value: CheckboxValueType) => void;
  value: readonly CheckboxValueType[];
  disabled?: boolean;
  name?: string;
  registerValue: (value: CheckboxValueType) => void;
  cancelValue: (value: CheckboxValueType) => void;
}
export interface CheckboxGroupEmits {
  'update:value': (value: CheckboxValueType[]) => void;
  change: (value: CheckboxValueType[]) => void;
}
