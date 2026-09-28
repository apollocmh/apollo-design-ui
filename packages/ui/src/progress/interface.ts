/**
 * Progress 的类型定义（G2 产物）。
 *
 * 契约来源：antd 6.6.4 `es/progress/progress.d.ts`（H2 重新定义，不复制搬运）。
 *
 * C8-R2：format / rounding 是 fn prop（数据通道，豁免）；antd 的 children 被
 * 显式 progressInfo 覆盖（无效 prop），不收。
 */

import type { CSSProperties, VNodeChild } from 'vue';

export type ProgressType = 'line' | 'circle' | 'dashboard';

export type ProgressStatus = 'normal' | 'exception' | 'active' | 'success';

/** Note: `default` is deprecated and will be removed in v7, please use `medium` instead. */
export type ProgressSize = Exclude<'large' | 'middle' | 'small', 'large'> | 'default';

export type StringGradients = Record<string, string>;
type FromToGradients = { from: string; to: string };
export type ProgressGradient = { direction?: string } & (StringGradients | FromToGradients);

export interface PercentPositionType {
  align?: 'start' | 'center' | 'end';
  type?: 'inner' | 'outer';
}

export interface SuccessProps {
  percent?: number;
  strokeColor?: string;
}

export type GapPlacement = 'top' | 'bottom' | 'start' | 'end';
export type GapPosition = 'top' | 'bottom' | 'left' | 'right';

/** antd 的 ProgressSemanticType。 */
export interface ProgressSemanticClassNames {
  root?: string;
  body?: string;
  rail?: string;
  track?: string;
  indicator?: string;
}

export interface ProgressSemanticStyles {
  root?: CSSProperties;
  body?: CSSProperties;
  rail?: CSSProperties;
  track?: CSSProperties;
  indicator?: CSSProperties;
}

export type ProgressSemanticClassNamesFn = (info: {
  props: ProgressProps;
}) => ProgressSemanticClassNames;

export type ProgressSemanticStylesFn = (info: { props: ProgressProps }) => ProgressSemanticStyles;

export interface ProgressProps {
  prefixCls?: string;
  className?: string;
  rootClassName?: string;
  classNames?: ProgressSemanticClassNames | ProgressSemanticClassNamesFn;
  styles?: ProgressSemanticStyles | ProgressSemanticStylesFn;

  type?: ProgressType;
  percent?: number;
  format?: (percent?: number, successPercent?: number) => VNodeChild;
  status?: ProgressStatus;
  showInfo?: boolean;
  strokeWidth?: number;
  strokeLinecap?: 'butt' | 'square' | 'round';
  strokeColor?: string | string[] | ProgressGradient;
  /** @deprecated Please use `railColor` instead */
  trailColor?: string;
  railColor?: string;
  /** @deprecated Use `size` instead */
  width?: number;
  success?: SuccessProps;
  style?: CSSProperties;
  gapDegree?: number;
  gapPlacement?: GapPlacement;
  /** @deprecated please use `gapPlacement` instead */
  gapPosition?: GapPosition;
  size?: number | [number | string, number] | ProgressSize | { width?: number; height?: number };
  steps?: number | { count: number; gap: number };
  percentPosition?: PercentPositionType;
  rounding?: (step: number) => number;

  // ---- ARIA（antd ProgressAriaProps）----
  'aria-label'?: string;
  'aria-labelledby'?: string;
}
