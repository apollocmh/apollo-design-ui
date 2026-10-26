import { computed, createCommentVNode, defineComponent, h, onMounted, ref } from 'vue';
import {
  ConfigProvider,
  Statistic,
  StatisticCountdown,
  StatisticTimer,
} from '../../../packages/ui/dist/index.mjs';
export default defineComponent({
  setup() {
    const phase = ref(0),
      type = ref('countup'),
      target = ref(0),
      value = ref(1234.5),
      finished = ref(0),
      changed = ref(0);
    const theme = computed(() =>
      phase.value === 1
        ? undefined
        : {
            components: {
              Statistic: {
                titleFontSize: phase.value === 2 ? 20 : 18,
                contentFontSize: phase.value === 2 ? 46 : 42,
              },
            },
          },
    );
    const child = (name, scope) => [
      createCommentVNode('first child'),
      h('input', { id: `hydrated-${name}-draft`, 'aria-label': `Hydrated ${name} draft` }),
      h('output', { 'data-hydrated-text': name }, scope.text),
    ];
    onMounted(() => {
      window.statisticHydration = {
        cycleTheme() {
          phase.value = (phase.value + 1) % 3;
        },
        setValue(next) {
          value.value = next;
        },
        clock(nextType, delta) {
          type.value = nextType;
          target.value = Date.now() + delta;
        },
        snapshot: () => ({ finished: finished.value, changed: changed.value }),
      };
    });
    return () =>
      h('main', [
        h('h1', 'Hydrated statistic workspace'),
        h(ConfigProvider, { theme: theme.value }, () => [
          h(
            Statistic,
            { id: 'hydrated-number', value: value.value, precision: 2, title: 'Balance' },
            { value: (scope) => child('number', scope) },
          ),
          h(
            StatisticTimer,
            {
              id: 'hydrated-clock',
              type: type.value,
              value: target.value,
              format: 'ss',
              title: 'Clock',
              onChange: () => {
                changed.value++;
              },
              onFinish: () => {
                finished.value++;
              },
            },
            { value: (scope) => child('clock', scope) },
          ),
          h(
            StatisticCountdown,
            {
              id: 'hydrated-countdown',
              value: 4102444800000,
              format: 'D[ days]',
              title: 'Future clock',
            },
            { value: (scope) => child('countdown', scope) },
          ),
        ]),
      ]);
  },
});
