import { darkAlgorithm } from '@apollo-design/theme';
import { ConfigProvider } from '@apollo-design/ui';
import { defineComponent, h, nextTick, onMounted, ref } from 'vue';

const modules = import.meta.glob(
  [
    '../../../packages/ui/src/auto-complete/demo/custom.vue',
    '../../../packages/ui/src/auto-complete/demo/customize-clear.vue',
    '../../../packages/ui/src/auto-complete/demo/disabled-in-form.vue',
    '../../../packages/ui/src/auto-complete/demo/render-panel.vue',
    '../../../packages/ui/src/carousel/demo/dot-duration.vue',
    '../../../packages/ui/src/carousel/demo/placement.vue',
    '../../../packages/ui/src/float-button/demo/back-top.vue',
    '../../../packages/ui/src/list/demo/empty.vue',
    '../../../packages/ui/src/list/demo/item-extra.vue',
    '../../../packages/ui/src/list/demo/pagination-simple.vue',
    '../../../packages/ui/src/list/demo/simple.vue',
    '../../../packages/ui/src/listy/demo/group-header.vue',
    '../../../packages/ui/src/listy/demo/item-render.vue',
    '../../../packages/ui/src/listy/demo/rich.vue',
    '../../../packages/ui/src/listy/demo/style-class.vue',
    '../../../packages/ui/src/time-picker/demo/12hours.vue',
    '../../../packages/ui/src/time-picker/demo/interval-options.vue',
    '../../../packages/ui/src/timeline/demo/title-span.vue',
    '../../../packages/ui/src/tour/demo/gap.vue',
    '../../../packages/ui/src/transfer/demo/actions.vue',
    '../../../packages/ui/src/transfer/demo/large-data.vue',
    '../../../packages/ui/src/tree/demo/block-node.vue',
    '../../../packages/ui/src/watermark/demo/custom.vue',
  ],
  { eager: true, import: 'default' },
);
const names = Object.keys(modules);
export default defineComponent({
  setup() {
    const current = ref(0),
      dark = ref(false),
      generation = ref(0);
    onMounted(() => {
      window.setTypographyConsumer = async (index, mode) => {
        current.value = index;
        dark.value = mode;
        generation.value++;
        await nextTick();
        await new Promise(requestAnimationFrame);
        await new Promise(requestAnimationFrame);
      };
      window.typographyConsumerNames = names;
    });
    return () =>
      h(ConfigProvider, { theme: dark.value ? { algorithm: darkAlgorithm } : undefined }, () =>
        h(
          'main',
          {
            style: {
              padding: '24px',
              background: 'var(--apollo-color-bg-container)',
              color: 'var(--apollo-color-text)',
              minHeight: '300px',
            },
          },
          [
            h('h1', 'Typography consumer'),
            h(modules[names[current.value]], { key: generation.value }),
          ],
        ),
      );
  },
});
