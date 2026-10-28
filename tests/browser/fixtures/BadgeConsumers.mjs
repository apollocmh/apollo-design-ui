import { compactAlgorithm, darkAlgorithm } from '@apollo-design/theme';
import { ConfigProvider } from '@apollo-design/ui';
import { defineComponent, h, nextTick, onMounted, ref } from 'vue';

const modules = import.meta.glob(
  [
    '../../../packages/ui/src/avatar/demo/badge.vue',
    '../../../packages/ui/src/calendar/demo/notice-calendar.vue',
    '../../../packages/ui/src/radio/demo/badge.vue',
    '../../../packages/ui/src/float-button/demo/badge.vue',
  ],
  { eager: true, import: 'default' },
);
const names = Object.keys(modules);
export default defineComponent({
  setup() {
    const current = ref(0),
      mode = ref('default'),
      generation = ref(0);
    onMounted(() => {
      window.badgeConsumerNames = names;
      window.setBadgeConsumer = async (index, theme) => {
        current.value = index;
        mode.value = theme;
        generation.value++;
        await nextTick();
        await new Promise(requestAnimationFrame);
        await new Promise(requestAnimationFrame);
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
              style: {
                padding: '24px',
                minHeight: '300px',
                color: 'var(--apollo-color-text)',
                background: 'var(--apollo-color-bg-container)',
              },
            },
            [
              h('h1', 'Actual Badge consumers'),
              h(modules[names[current.value]], { key: generation.value }),
            ],
          ),
      );
  },
});
