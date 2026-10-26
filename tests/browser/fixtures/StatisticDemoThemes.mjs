import { compactAlgorithm, darkAlgorithm } from '@apollo-design/theme';
import { ConfigProvider } from '@apollo-design/ui';
import { defineComponent, h, nextTick, onMounted, ref } from 'vue';
import Formatted from '../../../packages/ui/src/statistic/demo/animated.vue';
import Basic from '../../../packages/ui/src/statistic/demo/basic.vue';
import Card from '../../../packages/ui/src/statistic/demo/card.vue';
import Token from '../../../packages/ui/src/statistic/demo/component-token.vue';
import Semantic from '../../../packages/ui/src/statistic/demo/style-class.vue';
import Timer from '../../../packages/ui/src/statistic/demo/timer.vue';
import Unit from '../../../packages/ui/src/statistic/demo/unit.vue';

const demos = {
  basic: Basic,
  unit: Unit,
  card: Card,
  animated: Formatted,
  timer: Timer,
  'style-class': Semantic,
  'component-token': Token,
};
export default defineComponent({
  setup() {
    const name = ref('basic'),
      mode = ref('default');
    onMounted(() => {
      window.setStatisticDemo = async (next, theme) => {
        name.value = next;
        mode.value = theme;
        await nextTick();
      };
    });
    return () =>
      h(
        ConfigProvider,
        {
          theme:
            mode.value === 'default'
              ? undefined
              : {
                  algorithm:
                    mode.value === 'dark'
                      ? darkAlgorithm
                      : mode.value === 'compact'
                        ? compactAlgorithm
                        : [darkAlgorithm, compactAlgorithm],
                },
        },
        () =>
          h(
            'main',
            {
              'data-statistic-demos': name.value,
              style: {
                padding: '24px',
                minHeight: '300px',
                backgroundColor: 'var(--apollo-color-bg-container)',
                color: 'var(--apollo-color-text)',
                fontFamily: 'var(--apollo-font-family)',
              },
            },
            [h('h1', `${name.value} ${mode.value}`), h(demos[name.value], { key: name.value })],
          ),
      );
  },
});
