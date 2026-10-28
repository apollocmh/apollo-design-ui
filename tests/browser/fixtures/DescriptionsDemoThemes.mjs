import { compactAlgorithm, darkAlgorithm } from '@apollo-design/theme';
import { ConfigProvider } from '@apollo-design/ui';
import { defineComponent, h, nextTick, onMounted, ref } from 'vue';

const modules = import.meta.glob('../../../packages/ui/src/descriptions/demo/*.vue', {
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
    const generation = ref(0),
      name = ref('basic'),
      mode = ref('default');
    onMounted(() => {
      window.descriptionsDemo = {
        names: Object.keys(demos).sort(),
        async set(next, theme) {
          if (!demos[next]) throw new Error(`Unknown Descriptions demo: ${next}`);
          name.value = next;
          generation.value++;
          mode.value = theme;
          await nextTick();
        },
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
              'data-descriptions-demo': name.value,
              style: {
                boxSizing: 'border-box',
                padding: '24px',
                minHeight: '320px',
                background: 'var(--apollo-color-bg-container)',
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
