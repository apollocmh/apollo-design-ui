import { compactAlgorithm, darkAlgorithm, transformToken, useTheme } from '@apollo-design/theme';
import { ConfigProvider } from '@apollo-design/ui';
import { type Component, createApp, defineComponent, h, nextTick, ref } from 'vue';

const modules = import.meta.glob<Component>('../../../packages/ui/src/breadcrumb/demo/*.vue', {
  eager: true,
  import: 'default',
});
const demos = Object.fromEntries(
  Object.entries(modules).map(([file, component]) => [
    file.split('/').at(-1)?.replace('.vue', ''),
    component,
  ]),
);
type Mode = 'default' | 'dark' | 'compact' | 'both';
declare global {
  interface Window {
    setBreadcrumbDemo: (name: string, mode: Mode) => Promise<void>;
  }
}
const Frame = defineComponent({
  setup(_, { slots }) {
    const theme = useTheme();
    return () =>
      h(
        'main',
        {
          style: {
            ...transformToken(theme.token.value).vars,
            color: 'var(--apollo-color-text)',
            background: 'var(--apollo-color-bg-container)',
          },
        },
        slots.default?.(),
      );
  },
});
const App = defineComponent({
  setup() {
    const name = ref('basic'),
      mode = ref<Mode>('default'),
      revision = ref(0);
    window.setBreadcrumbDemo = async (nextName, nextMode) => {
      if (!demos[nextName]) throw new Error(`Unknown Breadcrumb demo: ${nextName}`);
      name.value = nextName;
      mode.value = nextMode;
      revision.value++;
      await nextTick();
    };
    return () =>
      h(
        ConfigProvider,
        {
          theme: {
            algorithm:
              mode.value === 'dark'
                ? darkAlgorithm
                : mode.value === 'compact'
                  ? compactAlgorithm
                  : mode.value === 'both'
                    ? [darkAlgorithm, compactAlgorithm]
                    : undefined,
          },
        },
        () =>
          h(Frame, null, () => [
            h('h1', { style: { fontSize: '20px' } }, `Breadcrumb: ${name.value}`),
            h(demos[name.value] ?? 'div', { key: revision.value }),
          ]),
      );
  },
});
createApp(App).mount('#app');
