/**
 * Badge（含 Ribbon）的类型定义。
 *
 * 契约来源：antd 6.6.4 的 `es/badge/Badge.d.ts` / `Ribbon.d.ts` / `ScrollNumber.d.ts`。
 * **逐字段对齐**（规则 R7）。有意差异见 `packages/ui/src/badge/README.md`。
 *
 * ── 与 antd 类型面的差异 ─────────────────────────────────────────────────────
 *
 * 1. `children` 不在 Props 里（规则 C19）—— Vue 侧是默认插槽。
 * 2. `count` / `text` 的 `React.ReactNode` → `VNodeChild`（规则 C16）。
 * 3. `color` 不用 `LiteralUnion`（PITFALLS 同 flex/gap：`(string & {})` 会让
 *    SFC 编译器把运行时 prop 推成 String|Object）—— 预设键用联合类型 +
 *    注释说明可传任意自定义色串。
 * 4. 语义槽位 `classNames` / `styles` 支持函数式（裁决 `empty-semantic-fn` = B）。
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
  /**
   * 内联样式。⚠️ **条件目标**：状态徽标（`status`）落**根元素**，其余落**角标**（indicator）
   * —— 上游 `useSemanticRootStyle(style, isStatusBadge ? 'root' : 'indicator')` 的行为，
   * 属独立目标，因此保留为专用 prop；根节点的类名请用 Vue 原生 `class`。
   */
  style?: CSSProperties;
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
  /** 丝带本体内联样式（⚠️ 同上是**独立目标**，落 indicator）。 */
  style?: CSSProperties;
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
  nativeElement: HTMLElement | null;
}

/** Ribbon ref 暴露面（antd 的 `RibbonRef`：nativeElement 指向 wrapper）。 */
export interface RibbonRef {
  nativeElement: HTMLElement | null;
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
