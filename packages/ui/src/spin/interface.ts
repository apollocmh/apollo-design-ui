/** Native Vue Spin contracts. Historical upstream comparison is evidence, not policy. */
import type { CSSProperties, VNode, VNodeChild } from 'vue';
import type { ComponentStyleConfig } from '../config-provider/context';

/** Existing medium aliases remain accepted; new examples use small/medium/large. */
export type SpinSize = 'small' | 'medium' | 'middle' | 'large' | 'default';
/** Programmatic Provider content. Templates use the complete indicator slot. */
export type SpinIndicator = VNode;
export type SpinPercent = number | 'auto';

export interface SpinSemanticClassNames {
  root?: string;
  section?: string;
  indicator?: string;
  description?: string;
  container?: string;
  /** @deprecated Please use description instead. */
  tip?: string;
  /** Actual fullscreen cover, sharing the stable section element. */
  mask?: string;
}
export interface SpinSemanticStyles {
  root?: CSSProperties;
  section?: CSSProperties;
  indicator?: CSSProperties;
  description?: CSSProperties;
  container?: CSSProperties;
  /** @deprecated Please use description instead. */
  tip?: CSSProperties;
  mask?: CSSProperties;
}
export type SpinSemanticValue<T> = T | ((info: { props: SpinProps }) => T);
export interface SpinSemanticType {
  classNames?: SpinSemanticClassNames;
  styles?: SpinSemanticStyles;
}
export interface SpinSemanticAllType {
  classNames: SpinSemanticClassNames;
  classNamesAndFn: SpinSemanticValue<SpinSemanticClassNames>;
  styles: SpinSemanticStyles;
  stylesAndFn: SpinSemanticValue<SpinSemanticStyles>;
}

export interface SpinProps {
  /** Current class prefix. Matching static CSS must be loaded. */
  prefixCls?: string;
  /** Target loading state, true by default. */
  spinning?: boolean;
  size?: SpinSize;
  /** @deprecated Please use description instead. */
  tip?: VNodeChild;
  /** Current content, including numeric zero. The description slot takes precedence. */
  description?: VNodeChild;
  /** Positive finite milliseconds before showing. Closing is immediate. */
  delay?: number;
  /** @deprecated Please use classNames.root instead. */
  wrapperClassName?: string;
  /** Omitted is indeterminate; explicit numbers including zero are determinate. */
  percent?: SpinPercent;
  fullscreen?: boolean;
  classNames?: SpinSemanticValue<SpinSemanticClassNames>;
  styles?: SpinSemanticValue<SpinSemanticStyles>;
}
export interface SpinRef {
  nativeElement: HTMLDivElement | null;
}
export type SpinConfig = ComponentStyleConfig &
  Pick<SpinProps, 'classNames' | 'styles'> & {
    indicator?: SpinIndicator | null;
  };
export type SpinSlot = () => VNodeChild;
export interface SpinIndicatorSlotProps {
  /** Current finite numeric progress; auto is resolved and undefined is indeterminate. */
  percent: number | undefined;
}
export interface SpinSlots {
  default?: SpinSlot;
  indicator?: (scope: SpinIndicatorSlotProps) => VNodeChild;
  description?: SpinSlot;
}
