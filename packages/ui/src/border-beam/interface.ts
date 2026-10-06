/**
 * BorderBeam 的类型定义。
 *
 * 契约来源：antd 6.6.4 的 `es/border-beam/BorderBeam.d.ts` / `util.d.ts`。
 * **逐字段对齐**（规则 R7）。差异：children 不在 Props（规则 C19，默认插槽）。
 */

import type { CSSProperties } from 'vue';

/** 渐变色标（percent 0–100，用户视角的整段分布）。 */
export interface BorderBeamGradient {
  color: string;
  percent: number;
}

/** color：纯色串或显式色标数组。 */
export type BorderBeamColor = string | BorderBeamGradient[];

export interface BorderBeamProps {
  /** 类名前缀。不传则从 ConfigProvider 取，兜底 `apollo-border-beam`。 */
  prefixCls?: string;
  /**
   * 语义化类名。**本仓自有 API** —— `BorderBeam` 是 renderless（没有自己的 DOM 根，
   * 它把 Effect 层注入宿主的 children），所以「根类名」在 Vue 里无处可放；
   * 槽位让这个落点有个 Vue-native 的名字。
   */
  classNames?: BorderBeamSemanticClassNames;
  /** 语义化内联样式，与 `classNames` 同槽位。 */
  styles?: BorderBeamSemanticStyles;
  /** 透传到 Effect 根元素的类名。@deprecated 用 `classNames.effect`。 */
  className?: string;
  /** 透传到 Effect 根元素的样式（合并 CSS 变量之后）。@deprecated 用 `styles.effect`。 */
  style?: CSSProperties;
  /** 渐变：纯色或色标数组（0–100 会线性映射到 0–70% 保留尾部淡出）。 */
  color?: BorderBeamColor;
  /** 流光条数（≥1 取整；非法值回落 1）。 */
  count?: number;
  /** 单圈时长秒数（>0 才生效）。 */
  duration?: number;
  /** 流光描边厚度（数字补 px）。 */
  lineWidth?: number | string;
  /** 覆盖四边统一的 inset 偏移（默认随宿主 border 宽度）。 */
  outset?: number | string;
  /** 流光头部长度（数字补 px）。 */
  size?: number | string;
}

/** 语义化类名槽位。 */
export interface BorderBeamSemanticClassNames {
  /** Effect 层（每个流光一个 div；= 上游 `className` 的落点）。 */
  effect?: string;
}

/** 语义化内联样式槽位。 */
export interface BorderBeamSemanticStyles {
  /** Effect 层（= 上游 `style` 的落点）。 */
  effect?: CSSProperties;
}

/** 默认插槽（宿主；必须是可以挂 ref 的元素/组件才有流光效果）。 */
export type BorderBeamSlot = () => unknown;
