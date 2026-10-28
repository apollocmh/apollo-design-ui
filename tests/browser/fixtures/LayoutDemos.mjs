import { compactAlgorithm, darkAlgorithm } from '@apollo-design/theme';
import { ConfigProvider } from '@apollo-design/ui';
import { defineComponent, h, onMounted } from 'vue';

const demos = import.meta.glob('../../../packages/ui/src/layout/demo/*.vue', { eager: true });
export default defineComponent({
  setup() {
    const query = new URLSearchParams(location.search),
      name = query.get('demo'),
      mode = query.get('theme');
    const demo = Object.entries(demos).find(([file]) => file.endsWith('/' + name + '.vue'))?.[1]
      .default;
    if (!demo) throw new Error('Unknown real Layout demo: ' + name);
    const algorithm =
      mode === 'dark'
        ? darkAlgorithm
        : mode === 'compact'
          ? compactAlgorithm
          : mode === 'both'
            ? [darkAlgorithm, compactAlgorithm]
            : undefined;
    onMounted(() => {
      window.layoutDemoReady = true;
    });
    return () =>
      h(ConfigProvider, { theme: { algorithm } }, () =>
        h('div', { id: 'layout-demo', style: { minWidth: 0 } }, h(demo)),
      );
  },
});
