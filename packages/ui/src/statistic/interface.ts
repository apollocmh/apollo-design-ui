/** Native Vue numeric content, semantic presentation and clock contracts. */
import type { CSSProperties, VNodeChild } from 'vue';
import type { ComponentStyleConfig } from '../config-provider/context';

export type ValueType = number | string;
export type CountdownValueType = ValueType;

export interface StatisticFormatConfig {
  decimalSeparator?: string;
  groupSeparator?: string;
  /** Decimal digits are truncated/padded; negative means zero, nonfinite is ignored. */
  precision?: number;
}
export interface CountdownFormatConfig {
  format?: string;
}

export interface StatisticSemanticClassNames {
  root?: string;
  header?: string;
  title?: string;
  content?: string;
  value?: string;
  prefix?: string;
  suffix?: string;
}
export interface StatisticSemanticStyles {
  root?: CSSProperties;
  header?: CSSProperties;
  title?: CSSProperties;
  content?: CSSProperties;
  value?: CSSProperties;
  prefix?: CSSProperties;
  suffix?: CSSProperties;
}
export type StatisticSemanticValue<T> = T | ((info: { props: StatisticProps }) => T);
export interface StatisticSemanticAllType {
  classNames: StatisticSemanticClassNames;
  classNamesAndFn: StatisticSemanticValue<StatisticSemanticClassNames>;
  styles: StatisticSemanticStyles;
  stylesAndFn: StatisticSemanticValue<StatisticSemanticStyles>;
}

export interface StatisticProps extends StatisticFormatConfig {
  prefixCls?: string;
  value?: ValueType;
  /** @deprecated Existing alias; styles.content takes precedence. */
  valueStyle?: CSSProperties;
  /** Text fallback; an existing #title slot takes precedence, including an empty slot. */
  title?: string;
  prefix?: string;
  suffix?: string;
  loading?: boolean;
  onMouseenter?: (event: MouseEvent) => void;
  onMouseleave?: (event: MouseEvent) => void;
  classNames?: StatisticSemanticValue<StatisticSemanticClassNames>;
  styles?: StatisticSemanticValue<StatisticSemanticStyles>;
}
export interface StatisticConfig
  extends ComponentStyleConfig,
    Pick<StatisticProps, 'classNames' | 'styles'> {}

export interface StatisticValueSlotProps {
  value: ValueType;
  /** Current numeric formatting, including the configured separators and precision. */
  text: string;
}
export interface StatisticSlots {
  title?: () => VNodeChild;
  prefix?: () => VNodeChild;
  suffix?: () => VNodeChild;
  value?: (scope: StatisticValueSlotProps) => VNodeChild;
}
export interface StatisticRef {
  nativeElement: HTMLDivElement | null;
}

export type TimerType = 'countdown' | 'countup';
export interface StatisticTimerProps extends Omit<StatisticProps, keyof StatisticFormatConfig> {
  type: TimerType;
  /** Time units Y/M/D/H/m/s/S, repeated zero padding and [literal] escapes. */
  format?: string;
  /** Once per completed countdown cycle, after change(0). */
  onFinish?: () => void;
  /** Current nonnegative milliseconds; never emitted by SSR or for invalid dates. */
  onChange?: (duration: number) => void;
}
export type CountdownProps = Omit<StatisticTimerProps, 'type'>;
export interface StatisticTimerValueSlotProps extends StatisticValueSlotProps {
  /** null before mounting or when the target is invalid. */
  duration: number | null;
  type: TimerType;
}
export interface StatisticTimerSlots extends Omit<StatisticSlots, 'value'> {
  value?: (scope: StatisticTimerValueSlotProps) => VNodeChild;
}
