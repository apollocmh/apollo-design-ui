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
  /** 透传到 Effect 根元素的类名。 */
  className?: string;
  /** 透传到 Effect 根元素的样式（合并 CSS 变量之后）。 */
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

/** 默认插槽（宿主；必须是可以挂 ref 的元素/组件才有流光效果）。 */
export type BorderBeamSlot = () => unknown;
