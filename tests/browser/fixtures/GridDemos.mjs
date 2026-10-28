import { compactAlgorithm, darkAlgorithm } from '@apollo-design/theme';
import { ConfigProvider } from '@apollo-design/ui';
import { computed, defineComponent, h, nextTick, onMounted, ref } from 'vue';

const modules = import.meta.glob('../../../packages/ui/src/grid/demo/*.vue', { eager: true });
export default defineComponent({
  setup() {
    const mode = ref('light');
    const theme = computed(() => ({
      algorithm:
        mode.value === 'dark'
          ? darkAlgorithm
          : mode.value === 'compact'
            ? compactAlgorithm
            : mode.value === 'both'
              ? [darkAlgorithm, compactAlgorithm]
              : undefined,
    }));
    onMounted(() => {
      window.gridDemoAudit = {
        async theme(value) {
          mode.value = value;
          await nextTick();
        },
      };
    });
    return () =>
      h(ConfigProvider, { theme: theme.value }, () =>
        h(
          'main',
          {
            style: {
              padding: '24px',
              background: 'var(--apollo-color-bg-container)',
              color: 'var(--apollo-color-text)',
              fontFamily: 'var(--apollo-font-family)',
              fontSize: 'var(--apollo-font-size)',
            },
          },
          [
            h('h1', 'All 13 Grid demos'),
            ...Object.entries(modules).map(([file, module]) => {
              const name = file.split('/').at(-1).replace('.vue', '');
              return h(
                'section',
                {
                  'data-grid-demo': name,
                  key: name,
                  style: {
                    padding: '24px',
                    marginBlockEnd: '24px',
                    border: '1px solid var(--apollo-color-border)',
                  },
                },
                [h('h2', name), h(module.default)],
              );
            }),
          ],
        ),
      );
  },
});
