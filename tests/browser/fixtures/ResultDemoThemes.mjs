import { compactAlgorithm, darkAlgorithm } from '@apollo-design/theme';
import { ConfigProvider } from '@apollo-design/ui';
import { defineComponent, h, nextTick, onMounted, ref } from 'vue';
import Demo3 from '../../../packages/ui/src/result/demo/403.vue';
import Demo4 from '../../../packages/ui/src/result/demo/404.vue';
import Demo5 from '../../../packages/ui/src/result/demo/500.vue';
import Demo9 from '../../../packages/ui/src/result/demo/component-token.vue';
import Demo7 from '../../../packages/ui/src/result/demo/custom-icon.vue';
import Demo6 from '../../../packages/ui/src/result/demo/error.vue';
import Demo1 from '../../../packages/ui/src/result/demo/info.vue';
import Demo8 from '../../../packages/ui/src/result/demo/style-class.vue';
import Demo0 from '../../../packages/ui/src/result/demo/success.vue';
import Demo2 from '../../../packages/ui/src/result/demo/warning.vue';

const demos = {
  success: Demo0,
  info: Demo1,
  warning: Demo2,
  403: Demo3,
  404: Demo4,
  500: Demo5,
  error: Demo6,
  'custom-icon': Demo7,
  'style-class': Demo8,
  'component-token': Demo9,
};
export default defineComponent({
  setup() {
    const name = ref('success'),
      mode = ref('default');
    onMounted(() => {
      window.setResultDemo = async (next, theme) => {
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
              'data-result-demos': name.value,
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
