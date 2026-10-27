import type { CSSProperties, VNodeChild } from 'vue';
import type { PresetColorKey, PresetStatusColorType } from '../_internal/preset-color';
import type { ComponentStyleConfig } from '../config-provider/context';

export type TagColor = PresetColorKey | PresetStatusColorType | (string & {});
export type TagVariant = 'filled' | 'solid' | 'outlined';
export interface TagSemanticClassNames {
  root?: string;
  icon?: string;
  content?: string;
  close?: string;
}
export interface TagSemanticStyles {
  root?: CSSProperties;
  icon?: CSSProperties;
  content?: CSSProperties;
  close?: CSSProperties;
}
export type TagClosableConfig = {
  closeIcon?: VNodeChild;
  disabled?: boolean;
} & { [name: `aria-${string}`]: string | number | boolean | undefined } & {
  [name: `data-${string}`]: unknown;
};
export type TagClosable = boolean | TagClosableConfig | null;
export interface TagProps {
  prefixCls?: string;
  color?: TagColor;
  variant?: TagVariant;
  /** @deprecated Please use variant="filled" instead. */
  bordered?: boolean;
  closable?: TagClosable;
  href?: string;
  target?: string;
  disabled?: boolean;
  classNames?: TagSemanticClassNames;
  styles?: TagSemanticStyles;
}
export interface TagSlots {
  default?: () => VNodeChild;
  icon?: () => VNodeChild;
  closeIcon?: () => VNodeChild;
}
export interface TagEmits {
  close: [event: MouseEvent];
}
export interface TagRef {
  nativeElement: HTMLElement | null;
}

type TagConfigFields = ComponentStyleConfig & {
  variant?: TagVariant;
  closable?: TagClosable;
  closeIcon?: VNodeChild;
  classNames?: TagSemanticClassNames;
  styles?: TagSemanticStyles;
};
export type TagConfig = { [K in keyof TagConfigFields]: TagConfigFields[K] };

export interface CheckableTagProps {
  prefixCls?: string;
  checked?: boolean;
  disabled?: boolean;
}
export interface CheckableTagSlots {
  default?: () => VNodeChild;
  icon?: () => VNodeChild;
}
export interface CheckableTagEmits {
  'update:checked': [checked: boolean];
  change: [checked: boolean];
  click: [event: MouseEvent];
  keydown: [event: KeyboardEvent];
}
export interface CheckableTagRef {
  nativeElement: HTMLElement | null;
}
export type CheckableTagValue = string | number;
export type CheckableTagGroupValue<
  T extends CheckableTagValue = CheckableTagValue,
  M extends boolean = boolean,
> = M extends true ? T[] : T | null;
export interface CheckableTagOption<T extends CheckableTagValue = CheckableTagValue> {
  value: T;
  label?: VNodeChild;
  className?: string;
  style?: CSSProperties;
}
export interface GroupSemanticClassNames {
  root?: string;
  item?: string;
}
export interface GroupSemanticStyles {
  root?: CSSProperties;
  item?: CSSProperties;
}
export interface CheckableTagGroupProps<
  T extends CheckableTagValue = CheckableTagValue,
  M extends boolean = boolean,
> {
  id?: string;
  prefixCls?: string;
  classNames?: GroupSemanticClassNames;
  styles?: GroupSemanticStyles;
  disabled?: boolean;
  options?: (T | CheckableTagOption<T>)[];
  value?: CheckableTagGroupValue<T, M>;
  defaultValue?: CheckableTagGroupValue<T, M>;
  multiple?: M;
}
export interface CheckableTagGroupEmits<
  T extends CheckableTagValue = CheckableTagValue,
  M extends boolean = boolean,
> {
  'update:value': [value: CheckableTagGroupValue<T, M>];
  change: [value: CheckableTagGroupValue<T, M>];
}
export interface CheckableTagGroupRef {
  nativeElement: HTMLDivElement | null;
}
