import { compactAlgorithm, darkAlgorithm } from '@apollo-design/theme';
import { Button, ConfigProvider } from '@apollo-design/ui';
import { defineComponent, h, nextTick, onMounted, ref } from 'vue';
export default defineComponent({
  setup() {
    const mode = ref('default');
    const colors = [
      'default',
      'primary',
      'danger',
      'blue',
      'purple',
      'cyan',
      'green',
      'magenta',
      'pink',
      'red',
      'orange',
      'yellow',
      'volcano',
      'geekblue',
      'lime',
      'gold',
    ];
    const variants = ['outlined', 'dashed', 'solid', 'filled', 'text', 'link'];
    onMounted(() => {
      window.setButtonColorTheme = async (next) => {
        mode.value = next;
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
              style: {
                padding: '24px',
                background: 'var(--apollo-color-bg-container)',
                color: 'var(--apollo-color-text)',
                fontFamily: 'var(--apollo-font-family)',
              },
            },
            [
              h('h1', 'Button color contracts'),
              ...colors.flatMap((color) =>
                variants.map((variant) =>
                  h(
                    Button,
                    { color, variant, id: `${color}-${variant}`, style: { margin: '5px' } },
                    () => `${color} ${variant}`,
                  ),
                ),
              ),
              h(Button, { type: 'link', id: 'type-link' }, () => 'Type link'),
            ],
          ),
      );
  },
});
