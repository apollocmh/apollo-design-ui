import { compactAlgorithm, darkAlgorithm } from '@apollo-design/theme';
import { ConfigProvider } from '@apollo-design/ui';
import { createApp, h } from 'vue';

if (__ALERT_SOURCE__) await import('./AlertContractsSourceStyles.mjs');
else {
  await import('@apollo-design/theme/tokens.css');
  await import('@apollo-design/ui/style.css');
}
const demos = import.meta.glob('../../../packages/ui/src/alert/demo/*.vue', {
  eager: true,
  import: 'default',
});
const params = new URLSearchParams(location.search);
const name = params.get('demo'),
  theme = params.get('theme');
const component = demos[`../../../packages/ui/src/alert/demo/${name}.vue`];
if (!component) throw new Error(`Missing real Alert demo ${name}`);
const algorithms = {
  default: undefined,
  dark: darkAlgorithm,
  compact: compactAlgorithm,
  both: [darkAlgorithm, compactAlgorithm],
};
createApp({
  render: () =>
    h(ConfigProvider, { theme: { algorithm: algorithms[theme] } }, () =>
      h(
        'main',
        {
          id: 'alert-demo',
          style: {
            padding: '16px',
            color: 'var(--apollo-color-text)',
            background: 'var(--apollo-color-bg-container)',
            minHeight: '240px',
          },
        },
        [h('h1', { style: { fontSize: '20px' } }, `Alert ${name}`), h(component)],
      ),
    ),
}).mount('#app');
requestAnimationFrame(() =>
  requestAnimationFrame(() => {
    window.alertDemoReady = true;
  }),
);
