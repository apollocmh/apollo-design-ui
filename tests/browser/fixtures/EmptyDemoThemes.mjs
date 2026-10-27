import { compactAlgorithm, darkAlgorithm } from '@apollo-design/theme';
import { ConfigProvider } from '@apollo-design/ui';
import { defineComponent, h, nextTick, onMounted, ref } from 'vue';
import Basic from '../../../packages/ui/src/empty/demo/basic.vue';
import Config from '../../../packages/ui/src/empty/demo/config-provider.vue';
import Customize from '../../../packages/ui/src/empty/demo/customize.vue';
import Description from '../../../packages/ui/src/empty/demo/description.vue';
import Simple from '../../../packages/ui/src/empty/demo/simple.vue';
import Style from '../../../packages/ui/src/empty/demo/style-class.vue';

const demos = {
  basic: Basic,
  simple: Simple,
  customize: Customize,
  'config-provider': Config,
  description: Description,
  'style-class': Style,
};
export default defineComponent({
  setup() {
    const name = ref('basic'),
      mode = ref('default');
    onMounted(() => {
      window.setEmptyDemo = async (next, theme) => {
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
              'data-empty-demo': name.value,
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
