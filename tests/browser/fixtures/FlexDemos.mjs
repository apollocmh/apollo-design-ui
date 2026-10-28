import { compactAlgorithm, darkAlgorithm } from '@apollo-design/theme';
import { ConfigProvider } from '@apollo-design/ui';
import { computed, defineComponent, h, nextTick, onMounted, ref } from 'vue';

const demos = import.meta.glob('../../../packages/ui/src/flex/demo/*.vue', { eager: true });
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
      window.flexDemoAudit = {
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
              color: 'var(--apollo-color-text)',
              background: 'var(--apollo-color-bg-container)',
              fontFamily: 'var(--apollo-font-family)',
              fontSize: 'var(--apollo-font-size)',
            },
          },
          [
            h('h1', 'All six Flex demos'),
            ...Object.entries(demos).map(([file, m]) =>
              h(
                'section',
                {
                  'data-flex-demo': file.split('/').at(-1).replace('.vue', ''),
                  key: file,
                  style: {
                    padding: '16px',
                    border: '1px solid var(--apollo-color-border)',
                    marginBlockEnd: '24px',
                    minWidth: 0,
                  },
                },
                [h('h2', file.split('/').at(-1).replace('.vue', '')), h(m.default)],
              ),
            ),
          ],
        ),
      );
  },
});
