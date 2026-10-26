/** The existing fixed-countdown export shares Timer's native slots, events and ref. */
import { useDevWarning } from '@apollo-design/utils';
import { defineComponent, h, type SlotsType, shallowRef } from 'vue';
import type { StatisticRef, StatisticTimerSlots } from './interface';
import { statisticPresentationProps, statisticTimerEmits } from './props';
import Timer from './Timer';

export default defineComponent({
  name: 'ACountdown',
  inheritAttrs: false,
  props: { ...statisticPresentationProps, format: { type: String, default: 'HH:mm:ss' } },
  slots: Object as SlotsType<StatisticTimerSlots>,
  emits: statisticTimerEmits,
  setup(props, { attrs, slots, emit, expose }) {
    const root = shallowRef<StatisticRef | null>(null);
    expose({
      get nativeElement() {
        return root.value?.nativeElement ?? null;
      },
    });
    const warning = useDevWarning('Countdown');
    warning.deprecated(false, '<Statistic.Countdown />', '<Statistic.Timer type="countdown" />');
    return () =>
      h(
        Timer,
        {
          ...props,
          ...attrs,
          type: 'countdown',
          ref: root,
          onChange: (duration: number) => emit('change', duration),
          onFinish: () => emit('finish'),
        },
        slots,
      );
  },
});
