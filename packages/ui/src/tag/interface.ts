/**
 * Tag 的类型定义（Tag / CheckableTag / CheckableTagGroup）。
 *
 * 契约来源：antd 6.6.4 的 `es/tag/index.d.ts` / `CheckableTag.d.ts` /
 * `CheckableTagGroup.d.ts`。**逐字段对齐**（规则 R7）。
 */

import type { CSSProperties, VNodeChild } from 'vue';
import type { PresetColorKey, PresetStatusColorType } from '../_internal/preset-color';
import type { ClosableType } from '../_internal/use-closable';
import type { ComponentStyleConfig } from '../config-provider/context';

/** color：预设键或任意字符串（LiteralUnion 的收窄形态）。 */
export type TagColor = PresetColorKey | PresetStatusColorType | (string & {});

export type TagVariant = 'filled' | 'solid' | 'outlined';

/** 语义槽位（四个，antd 的 TagSemanticType 逐字）。 */
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

export interface TagProps {
  /** 类名前缀。不传则从 ConfigProvider 取，兜底 `apollo-tag`。 */
  prefixCls?: string;
  className?: string;
  rootClassName?: string;
  /** 预设键或任意色串（`-inverse` 后缀 → solid variant，antd 逐字）。 */
  color?: TagColor;
  variant?: TagVariant;
  /** @deprecated Please use `variant=\"filled\"` instead. */
  bordered?: boolean;
  /** Advised to use closeIcon instead. */
  closable?: ClosableType;
  onClose?: (e: MouseEvent) => void;
  href?: string;
  target?: string;
  disabled?: boolean;
  classNames?: TagSemanticClassNames;
  styles?: TagSemanticStyles;
}

/** 组件实例暴露（antd 的 ref 指向 span/a 元素本身）。 */
export interface TagRef {
  nativeElement: HTMLElement | null;
}

/** ConfigProvider 上的组件配置。与 antd 的 `TagConfig` 逐字一致。 */
export interface TagConfig extends ComponentStyleConfig {
  variant?: TagVariant;
  closable?: ClosableType;
  /** 程序化上下文（ConfigProvider），VNode 合法 —— 模板侧用 `#closeIcon` 插槽（C8-R2）。 */
  closeIcon?: VNodeChild;
  classNames?: TagSemanticClassNames;
  styles?: TagSemanticStyles;
}

// ---------------------------------------------------------------------------

export interface CheckableTagProps {
  prefixCls?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  onClick?: (e: MouseEvent) => void;
  onKeyDown?: (e: KeyboardEvent) => void;
  disabled?: boolean;
}

// ---------------------------------------------------------------------------

export interface CheckableTagOption {
  value: string | number;
  label?: VNodeChild;
  className?: string;
  style?: CSSProperties;
}

export interface CheckableTagGroupProps {
  id?: string;
  prefixCls?: string;
  classNames?: TagSemanticClassNames;
  styles?: TagSemanticStyles;
  disabled?: boolean;
  /** 原始值数组或配置对象（antd 逐字）。 */
  options?: (string | number | CheckableTagOption)[];
  value?: string | number | (string | number)[] | null;
  defaultValue?: string | number | (string | number)[] | null;
  onChange?: (value: string | number | (string | number)[] | null) => void;
  multiple?: boolean;
}
