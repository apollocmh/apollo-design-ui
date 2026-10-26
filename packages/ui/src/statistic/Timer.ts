/** Native clock effects begin after mounting and stop at each completed countdown. */
import {
  computed,
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  type PropType,
  ref,
  type SlotsType,
  shallowRef,
  watch,
} from 'vue';
import type { StatisticRef, StatisticTimerSlots, TimerType } from './interface';
import { statisticPresentationProps, statisticTimerEmits } from './props';
import Statistic from './Statistic';
import { formatTimeStr } from './utils';

export default defineComponent({
  name: 'AStatisticTimer',
  inheritAttrs: false,
  props: {
    ...statisticPresentationProps,
    type: { type: String as PropType<TimerType>, required: true },
    format: { type: String, default: 'HH:mm:ss' },
  },
  slots: Object as SlotsType<StatisticTimerSlots>,
  emits: statisticTimerEmits,
  setup(props, { attrs, slots, emit, expose }) {
    const root = shallowRef<StatisticRef | null>(null);
    expose({
      get nativeElement() {
        return root.value?.nativeElement ?? null;
      },
    });
    const now = ref<number | null>(null);
    const target = computed(() => new Date(props.value).getTime());
    const duration = computed(() =>
      now.value === null || !Number.isFinite(target.value)
        ? null
        : Math.max(
            props.type === 'countdown' ? target.value - now.value : now.value - target.value,
            0,
          ),
    );
    const text = computed(() =>
      duration.value === null ? '-' : formatTimeStr(duration.value, props.format),
    );
    let mounted = false,
      timer: number | undefined,
      owner: Window | null | undefined;
    const stop = () => {
      if (timer !== undefined) owner?.clearInterval(timer);
      timer = undefined;
    };
    const tick = () => {
      now.value = Date.now();
      const current = duration.value;
      if (current === null) {
        stop();
        return false;
      }
      const finished = props.type === 'countdown' && current === 0;
      if (finished) stop();
      emit('change', current);
      if (finished) emit('finish');
      return !finished;
    };
    const restart = () => {
      stop();
      if (!mounted) return;
      if (tick()) timer = owner?.setInterval(tick, 1000 / 60);
    };
    watch(() => [props.value, props.type], restart, { flush: 'post' });
    onMounted(() => {
      owner = root.value?.nativeElement?.ownerDocument.defaultView;
      mounted = true;
      restart();
    });
    onBeforeUnmount(() => {
      mounted = false;
      stop();
    });
    return () => {
      const { type: _type, format: _format, ...presentation } = props;
      return h(
        Statistic,
        { ...presentation, ...attrs, ref: root },
        {
          ...slots,
          value: () =>
            slots.value
              ? slots.value({
                  value: props.value,
                  text: text.value,
                  duration: duration.value,
                  type: props.type,
                })
              : text.value,
        },
      );
    };
  },
});
