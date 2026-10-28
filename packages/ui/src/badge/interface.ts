/** Apollo Badge / Ribbon public contracts. Native class/style are root attrs;
 * content uses VNodeChild data or typed slots, and semantic styles target inner regions.
 * Original algorithm/reference evidence: antd 6.6.4 badge; see README and migration.
 */

import type { CSSProperties, VNodeChild } from 'vue';
import type { PresetColorKey, PresetStatusColorType } from '../_internal/preset-color';

export type { PresetColorKey, PresetStatusColorType };

/** Badge 的语义槽位（antd 的 `BadgeSemanticType`）。 */
export interface BadgeSemanticClassNames {
  root?: string;
  indicator?: string;
}

export interface BadgeSemanticStyles {
  root?: CSSProperties;
  indicator?: CSSProperties;
}

export interface BadgeProps {
  /** 类名前缀。不传则从 ConfigProvider 取，兜底 `apollo-badge`。 */
  prefixCls?: string;
  /** ScrollNumber 的类名前缀（一般不用传）。 */
  scrollNumberPrefixCls?: string;
  /** 显示的数字或节点。`null` / 不传 = 无 count。 */
  count?: VNodeChild;
  /** 封顶值，超出显示 `${overflowCount}+`。 */
  overflowCount?: number;
  /** 不显示数字只显示小红点。 */
  dot?: boolean;
  /** 数值为 0 时是否显示。 */
  showZero?: boolean;
  /** 状态点。 */
  status?: PresetStatusColorType;
  /**
   * 自定义颜色。预设键（blue 等 13 个）走类名；其它色串走内联样式。
   * ⚠️ 类型只枚举预设键，但运行时接受任意字符串（antd 的 `LiteralUnion` 语义）。
   */
  color?: PresetColorKey | (string & {});
  /** 状态文本。 */
  text?: VNodeChild;
  /**
   * 尺寸。⚠️ `default` 已废弃（v7 移除），等价 `medium`。
   */
  size?: 'medium' | 'small' | 'default';
  /** 原生 title。`null` / `false` 显式禁用；不传回落到 count。 */
  title?: string | null | false;
  /** 偏移 `[x, y]`：x → `inset-inline-end`，y → `margin-top`。 */
  offset?: [number | string, number | string];
  /** 语义槽位类名（root / indicator）。 */
  classNames?: BadgeSemanticClassNames | ((info: { props: BadgeProps }) => BadgeSemanticClassNames);
  /** 语义槽位样式（root / indicator）。 */
  styles?: BadgeSemanticStyles | ((info: { props: BadgeProps }) => BadgeSemanticStyles);
}

/** Ribbon 的语义槽位（antd 的 `RibbonSemanticType`）。 */
export interface RibbonSemanticClassNames {
  root?: string;
  indicator?: string;
  content?: string;
}

export interface RibbonSemanticStyles {
  root?: CSSProperties;
  indicator?: CSSProperties;
  content?: CSSProperties;
}

export interface RibbonProps {
  /** 类名前缀。不传则从 ConfigProvider 取，兜底 `apollo-ribbon`。 */
  prefixCls?: string;
  /** 丝带本体类名（⚠️ 落**丝带本体**，不是包裹层 —— 独立目标）。 */
  className?: string;
  /** 颜色。预设键走类名，其它色串走内联样式（丝带本体 + 角标）。 */
  color?: PresetColorKey | (string & {});
  /** 丝带文本。 */
  text?: VNodeChild;
  /** 挂靠角。 */
  placement?: 'start' | 'end';
  /** 语义槽位类名。 */
  classNames?:
    | RibbonSemanticClassNames
    | ((info: { props: RibbonProps }) => RibbonSemanticClassNames);
  /** 语义槽位样式。 */
  styles?: RibbonSemanticStyles | ((info: { props: RibbonProps }) => RibbonSemanticStyles);
}

/** Badge ref 暴露面。与 antd 的 `RefAttributes<HTMLSpanElement>` 对应。 */
export interface BadgeRef {
  readonly nativeElement: HTMLElement | null;
}

/** Ribbon ref 暴露面（antd 的 `RibbonRef`：nativeElement 指向 wrapper）。 */
export interface RibbonRef {
  readonly nativeElement: HTMLElement | null;
}

/** ScrollNumber 的内部 props（antd 的 `ScrollNumberProps` 子集；组件不公开导出）。 */
export interface ScrollNumberProps {
  prefixCls?: string;
  count?: VNodeChild;
  className?: string;
  motionClassName?: string;
  style?: CSSProperties;
  title?: string | undefined;
  show?: boolean;
  component?: string;
}

/** 默认插槽。 */
export type BadgeSlot = () => VNodeChild;

/** Content slots are evaluated in the public render boundary, including empty results. */
export interface BadgeSlots {
  default?: BadgeSlot;
  count?: BadgeSlot;
  text?: BadgeSlot;
}

/** Ribbon content is rendered without interpreting VNodes as component types. */
export interface RibbonSlots {
  default?: BadgeSlot;
  text?: BadgeSlot;
}
