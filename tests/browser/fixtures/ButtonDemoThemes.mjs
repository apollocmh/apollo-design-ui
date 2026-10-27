import { compactAlgorithm, darkAlgorithm } from '@apollo-design/theme';
import { ConfigProvider } from '@apollo-design/ui';
import { defineComponent, h, nextTick, onMounted, ref } from 'vue';
import Demo0 from '../../../packages/ui/src/button/demo/basic.vue';
import Demo1 from '../../../packages/ui/src/button/demo/block.vue';
import Demo2 from '../../../packages/ui/src/button/demo/chinese-chars-loading.vue';
import Demo3 from '../../../packages/ui/src/button/demo/chinese-space.vue';
import Demo4 from '../../../packages/ui/src/button/demo/color-variant.vue';
import Demo5 from '../../../packages/ui/src/button/demo/component-token.vue';
import Demo6 from '../../../packages/ui/src/button/demo/custom-disabled-bg.vue';
import Demo7 from '../../../packages/ui/src/button/demo/danger.vue';
import Demo8 from '../../../packages/ui/src/button/demo/disabled.vue';
import Demo9 from '../../../packages/ui/src/button/demo/ghost.vue';
import Demo10 from '../../../packages/ui/src/button/demo/href.vue';
import Demo11 from '../../../packages/ui/src/button/demo/icon.vue';
import Demo12 from '../../../packages/ui/src/button/demo/icon-placement.vue';
import Demo13 from '../../../packages/ui/src/button/demo/linear-gradient.vue';
import Demo14 from '../../../packages/ui/src/button/demo/loading.vue';
import Demo15 from '../../../packages/ui/src/button/demo/multiple.vue';
import Demo16 from '../../../packages/ui/src/button/demo/semantic.vue';
import Demo17 from '../../../packages/ui/src/button/demo/shape.vue';
import Demo18 from '../../../packages/ui/src/button/demo/size.vue';
import Demo19 from '../../../packages/ui/src/button/demo/style-class.vue';

const demos = {
  basic: Demo0,
  block: Demo1,
  'chinese-chars-loading': Demo2,
  'chinese-space': Demo3,
  'color-variant': Demo4,
  'component-token': Demo5,
  'custom-disabled-bg': Demo6,
  danger: Demo7,
  disabled: Demo8,
  ghost: Demo9,
  href: Demo10,
  icon: Demo11,
  'icon-placement': Demo12,
  'linear-gradient': Demo13,
  loading: Demo14,
  multiple: Demo15,
  semantic: Demo16,
  shape: Demo17,
  size: Demo18,
  'style-class': Demo19,
};
export default defineComponent({
  setup() {
    const name = ref('basic'),
      mode = ref('default');
    onMounted(() => {
      window.setButtonDemo = async (next, theme) => {
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
              'data-button-demos': name.value,
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
