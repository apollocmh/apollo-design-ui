import { compactAlgorithm, darkAlgorithm } from '@apollo-design/theme';
import { ConfigProvider } from '@apollo-design/ui';
import { defineComponent, h, nextTick, onMounted, ref } from 'vue';

const modules = import.meta.glob('../../../packages/ui/src/badge/demo/*.vue', {
  eager: true,
  import: 'default',
});
const demos = Object.fromEntries(
  Object.entries(modules).map(([file, component]) => [
    file.split('/').pop().replace('.vue', ''),
    component,
  ]),
);
export default defineComponent({
  setup() {
    const generation = ref(0);
    const name = ref('basic'),
      mode = ref('default');
    onMounted(() => {
      window.setBadgeDemo = async (next, theme) => {
        name.value = next;
        generation.value++;
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
              'data-badge-demo': name.value,
              style: {
                padding: '24px',
                minHeight: '300px',
                backgroundColor: 'var(--apollo-color-bg-container)',
                color: 'var(--apollo-color-text)',
                fontFamily: 'var(--apollo-font-family)',
              },
            },
            [
              h('h1', `${name.value} ${mode.value}`),
              h(demos[name.value], { key: generation.value }),
            ],
          ),
      );
  },
});
