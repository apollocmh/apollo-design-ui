/** Segmented's native radio data, model, notification and semantic contracts. */
import type { CSSProperties, VNodeChild } from 'vue';
import type { SemanticInput } from '../_internal/use-merge-semantic';
import type { Orientation } from '../_internal/use-orientation';
import type { SizeType } from '../config-provider/size-context';
import type { TooltipProps } from '../tooltip';

export type SegmentedValue = string | number;
export type SegmentedRawOption = SegmentedValue;

interface SegmentedOptionFields {
  value: SegmentedValue;
  disabled?: boolean;
  /** Native label title; primitive label data supplies the default. */
  title?: string;
  className?: string;
  /** Native id on the option's label element. */
  id?: string;
  tooltip?: string | TooltipProps;
}
export interface SegmentedLabeledOptionWithIcon extends SegmentedOptionFields {
  icon: VNodeChild;
  label?: VNodeChild;
}
export interface SegmentedLabeledOptionWithoutIcon extends SegmentedOptionFields {
  label: VNodeChild;
  icon?: VNodeChild;
}
export type SegmentedLabeledOption =
  | SegmentedLabeledOptionWithIcon
  | SegmentedLabeledOptionWithoutIcon;
export type SegmentedOption = SegmentedRawOption | SegmentedLabeledOption;
export type SegmentedOptions = readonly SegmentedOption[];

export interface SegmentedSemanticClassNames {
  root?: string;
  icon?: string;
  label?: string;
  item?: string;
}
export interface SegmentedSemanticStyles {
  root?: CSSProperties;
  icon?: CSSProperties;
  label?: CSSProperties;
  item?: CSSProperties;
}
export interface SegmentedSemanticTypeInput {
  classNames?: SemanticInput<SegmentedSemanticClassNames, SegmentedProps>;
  styles?: SemanticInput<SegmentedSemanticStyles, SegmentedProps>;
}
export interface SegmentedEmits {
  'update:value': (value: SegmentedValue) => void;
  change: (value: SegmentedValue) => void;
  keydown: (event: KeyboardEvent) => void;
}
export interface SegmentedRef {
  nativeElement: HTMLDivElement | null;
}
export interface SegmentedProps {
  prefixCls?: string;
  options?: SegmentedOptions;
  disabled?: boolean;
  /** Initial value; otherwise initializes from the first option when available. */
  defaultValue?: SegmentedValue;
  /** Accepted controlled value; undefined releases control. */
  value?: SegmentedValue;
  name?: string;
  block?: boolean;
  size?: SizeType;
  vertical?: boolean;
  orientation?: Orientation;
  shape?: 'default' | 'round';
  classNames?: SegmentedSemanticTypeInput['classNames'];
  styles?: SegmentedSemanticTypeInput['styles'];
  onChange?: SegmentedEmits['change'];
  onKeydown?: SegmentedEmits['keydown'];
  'onUpdate:value'?: SegmentedEmits['update:value'];
}
