import type { CSSProperties, PropType } from 'vue';
import type { StatisticProps, ValueType } from './interface';

/** Presentation fields shared by all three public components. */
export const statisticPresentationProps = {
  prefixCls: { type: String, default: undefined },
  value: { type: [Number, String] as PropType<ValueType>, default: 0 },
  valueStyle: { type: Object as PropType<CSSProperties>, default: undefined },
  title: { type: String, default: undefined },
  prefix: { type: String, default: undefined },
  suffix: { type: String, default: undefined },
  loading: { type: Boolean, default: false },
  onMouseenter: { type: Function as PropType<(event: MouseEvent) => void>, default: undefined },
  onMouseleave: { type: Function as PropType<(event: MouseEvent) => void>, default: undefined },
  classNames: {
    type: [Object, Function] as PropType<StatisticProps['classNames']>,
    default: undefined,
  },
  styles: { type: [Object, Function] as PropType<StatisticProps['styles']>, default: undefined },
};
export const statisticTimerEmits = {
  change: (duration: number) => Number.isFinite(duration) && duration >= 0,
  finish: () => true,
};
