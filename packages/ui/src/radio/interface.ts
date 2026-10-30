/** Radio models, native notifications, semantic regions and scalar option data. */
import type { CSSProperties, VNodeChild } from 'vue';
import type { CheckboxOptionType, CheckboxRef } from '../checkbox/interface';
import type { SizeType } from '../config-provider/size-context';

export type RadioRef = CheckboxRef;
/** The native event; the requested checked value is emitted separately. */
export type RadioChangeEvent = Event;
export type RadioValue = string | number | boolean;
export type RadioGroupButtonStyle = 'outline' | 'solid';
export type RadioGroupOptionType = 'default' | 'button';
export type RadioOrientation = 'horizontal' | 'vertical';
export type RadioOptionItem = CheckboxOptionType<RadioValue>;
export type RadioOptionLabel = VNodeChild;

export type RadioEmits = {
  'update:checked': (checked: boolean) => void;
  change: (event: Event, checked: boolean) => void;
  click: (event: MouseEvent) => void;
  mouseenter: (event: MouseEvent) => void;
  mouseleave: (event: MouseEvent) => void;
  focus: (event: FocusEvent) => void;
  blur: (event: FocusEvent) => void;
  keydown: (event: KeyboardEvent) => void;
  keypress: (event: KeyboardEvent) => void;
};
export type RadioGroupEmits = {
  'update:value': (value: RadioValue) => void;
  change: (value: RadioValue, event: Event) => void;
  mouseenter: (event: MouseEvent) => void;
  mouseleave: (event: MouseEvent) => void;
  focus: (event: FocusEvent) => void;
  blur: (event: FocusEvent) => void;
};
export type RadioSlots = {
  default?: () => VNodeChild;
};
export type RadioGroupSlots = {
  default?: () => VNodeChild;
};
export interface RadioSemanticClassNames {
  root?: string;
  icon?: string;
  label?: string;
}
export interface RadioSemanticStyles {
  root?: CSSProperties;
  icon?: CSSProperties;
  label?: CSSProperties;
}
export interface RadioSemanticContext {
  props: RadioProps;
}
export type RadioSemanticClassNamesFn = (context: RadioSemanticContext) => RadioSemanticClassNames;
export type RadioSemanticStylesFn = (context: RadioSemanticContext) => RadioSemanticStyles;

export interface AbstractRadioProps {
  prefixCls?: string;
  defaultChecked?: boolean;
  checked?: boolean;
  disabled?: boolean;
  title?: string;
  onChange?: RadioEmits['change'];
  onClick?: RadioEmits['click'];
  onMouseenter?: RadioEmits['mouseenter'];
  onMouseleave?: RadioEmits['mouseleave'];
  onKeypress?: RadioEmits['keypress'];
  onKeydown?: RadioEmits['keydown'];
  onFocus?: RadioEmits['focus'];
  onBlur?: RadioEmits['blur'];
  /** Scalar option identity inside a Group; native input value outside it. */
  value?: RadioValue;
  tabIndex?: number;
  name?: string;
  id?: string;
  autoFocus?: boolean;
  required?: boolean;
}
export interface RadioProps extends AbstractRadioProps {
  classNames?: RadioSemanticClassNames | RadioSemanticClassNamesFn;
  styles?: RadioSemanticStyles | RadioSemanticStylesFn;
}
export interface RadioGroupProps {
  prefixCls?: string;
  options?: (RadioOptionItem | string | number)[];
  disabled?: boolean;
  name?: string;
  defaultValue?: RadioValue;
  value?: RadioValue;
  onChange?: RadioGroupEmits['change'];
  size?: SizeType;
  onMouseenter?: RadioGroupEmits['mouseenter'];
  onMouseleave?: RadioGroupEmits['mouseleave'];
  onFocus?: RadioGroupEmits['focus'];
  onBlur?: RadioGroupEmits['blur'];
  id?: string;
  optionType?: RadioGroupOptionType;
  buttonStyle?: RadioGroupButtonStyle;
  orientation?: RadioOrientation;
  /** Orientation takes precedence over this boolean shorthand. */
  vertical?: boolean;
  block?: boolean;
  role?: string;
}

/** Reactive Group ownership, including native same-name checked restoration. */
export interface RadioGroupContextValue {
  registerChecked: (sync: () => void) => () => void;
  syncChecked: () => void;
  onChange: (value: RadioValue, event: Event) => void;
  readonly value?: RadioValue;
  readonly disabled?: boolean;
  readonly name: string;
  readonly optionType?: RadioGroupOptionType;
  readonly block: boolean;
}
export type RadioOptionTypeContextProps = RadioGroupOptionType;
export interface RadioGroupRef {
  nativeElement: HTMLDivElement | null;
}
