/**
 * Checkbox 的类型定义（G2 产物）。
 *
 * 契约来源：antd 6.6.4 的 `es/checkbox/Checkbox.d.ts` / `Group.d.ts`。
 * **逐字段对齐**。差异：`React.CSSProperties` → Vue 的 `CSSProperties`、
 * `React.ReactNode` → `VNodeChild`（规则 C16 / C18）。
 */

import type { CSSProperties, VNodeChild } from 'vue';

/** 与 antd 的 `CheckboxRef`（@rc-component/checkbox）一致。 */
export interface CheckboxRef {
  focus: (options?: FocusOptions) => void;
  blur: () => void;
  input: HTMLInputElement | null;
  nativeElement: HTMLElement | null;
}

export interface CheckboxChangeEventTarget {
  checked: boolean;
  // antd 的 target 是 `{...props, type, checked}` —— 这里枚举常用字段
  value?: unknown;
  disabled?: boolean;
  name?: string;
  id?: string;
  indeterminate?: boolean;
  type?: string;
  // 允许携带其余 props（与 antd 的展开语义一致）
  [key: string]: unknown;
}

export interface CheckboxChangeEvent {
  target: CheckboxChangeEventTarget;
  stopPropagation: () => void;
  preventDefault: () => void;
  nativeEvent: Event;
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
  onChange?: (e: CheckboxChangeEvent) => void;
  onClick?: (e: MouseEvent) => void;
  onMouseEnter?: (e: MouseEvent) => void;
  onMouseLeave?: (e: MouseEvent) => void;
  onKeyPress?: (e: KeyboardEvent) => void;
  onKeyDown?: (e: KeyboardEvent) => void;
  onFocus?: (e: FocusEvent) => void;
  onBlur?: (e: FocusEvent) => void;
  /** ⚠️ 组外传 `value` 不是有效 prop（发 usage 告警）；在 Group 内是选项值。 */
  value?: string | number | boolean;
  tabIndex?: number;
  name?: string;
  id?: string;
  autoFocus?: boolean;
  type?: string;
  skipGroup?: boolean;
  required?: boolean;
}

export interface CheckboxProps extends AbstractCheckboxProps {
  indeterminate?: boolean;
  classNames?: CheckboxSemanticClassNames | CheckboxSemanticClassNamesFn;
  styles?: CheckboxSemanticStyles | CheckboxSemanticStylesFn;
}

// ================================ Group ================================

export interface CheckboxOptionType<T = unknown> {
  label: VNodeChild;
  value: T;
  style?: CSSProperties;
  className?: string;
  disabled?: boolean;
  title?: string;
  id?: string;
  onChange?: (e: CheckboxChangeEvent) => void;
  required?: boolean;
}

export interface CheckboxGroupProps<T = unknown> {
  prefixCls?: string;
  options?: (CheckboxOptionType<T> | string | number)[];
  disabled?: boolean;
  style?: CSSProperties;
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
  toggleOption?: (option: { label: VNodeChild; value: unknown }) => void;
  value?: unknown[];
  disabled?: boolean;
  name?: string;
  registerValue?: (val: unknown) => void;
  cancelValue?: (val: unknown) => void;
}
