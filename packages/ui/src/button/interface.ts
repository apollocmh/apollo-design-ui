import type { Component, CSSProperties, VNodeChild } from 'vue';
import type { ComponentStyleConfig } from '../config-provider/context';
import type { SizeType } from '../config-provider/size-context';

/** Visual shorthand; explicit color and variant may independently override it. */
export type ButtonType = 'default' | 'primary' | 'dashed' | 'link' | 'text';
export type ButtonShape = 'default' | 'circle' | 'round' | 'square';
export type ButtonHTMLType = 'submit' | 'button' | 'reset';
export type ButtonVariantType = 'outlined' | 'dashed' | 'solid' | 'filled' | 'text' | 'link';
export type ButtonColorType =
  | 'default'
  | 'primary'
  | 'danger'
  | 'blue'
  | 'purple'
  | 'cyan'
  | 'green'
  | 'magenta'
  | 'pink'
  | 'red'
  | 'orange'
  | 'yellow'
  | 'volcano'
  | 'geekblue'
  | 'lime'
  | 'gold';
export type ButtonSize = SizeType;
export type ButtonIconPlacement = 'start' | 'end';
/** Renderable data or a Vue component; complete #icon content takes precedence. */
export type ButtonIcon = VNodeChild | Component;
/** A request blocks activation immediately; delay only postpones its indicator. */
export type ButtonLoading = boolean | { delay?: number; icon?: ButtonIcon };

export interface ButtonSemanticClassNames {
  root?: string;
  icon?: string;
  content?: string;
}
export interface ButtonSemanticStyles {
  root?: CSSProperties;
  icon?: CSSProperties;
  content?: CSSProperties;
}
export interface ButtonSemanticType {
  classNames?: ButtonSemanticClassNames;
  styles?: ButtonSemanticStyles;
}

/** Native class/style and other root attributes belong to Vue attrs. */
export interface ButtonProps {
  type?: ButtonType;
  color?: ButtonColorType;
  variant?: ButtonVariantType;
  icon?: ButtonIcon;
  /** @deprecated Use iconPlacement. */
  iconPosition?: ButtonIconPlacement;
  iconPlacement?: ButtonIconPlacement;
  shape?: ButtonShape;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: ButtonLoading;
  prefixCls?: string;
  ghost?: boolean;
  danger?: boolean;
  block?: boolean;
  /** Defined, including an empty string, renders an anchor. */
  href?: string;
  htmlType?: ButtonHTMLType;
  /** Visual spacing for two Chinese characters; original text remains unchanged. */
  autoInsertSpace?: boolean;
  classNames?: ButtonSemanticClassNames;
  styles?: ButtonSemanticStyles;
}
export interface ButtonRef {
  nativeElement: HTMLButtonElement | HTMLAnchorElement | null;
}
export type ButtonSlot = () => VNodeChild;
export interface ButtonSlots {
  default?: ButtonSlot;
  icon?: ButtonSlot;
}
type ButtonConfigFields = ComponentStyleConfig &
  Pick<ButtonProps, 'classNames' | 'styles'> & {
    loadingIcon?: ButtonIcon;
    shape?: ButtonShape;
    color?: ButtonColorType;
    variant?: ButtonVariantType;
    autoInsertSpace?: boolean;
  };

/** A closed config object retains every field and is assignable to the Provider config map. */
export type ButtonConfig = { [Key in keyof ButtonConfigFields]: ButtonConfigFields[Key] };
