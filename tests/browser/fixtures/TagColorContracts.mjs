import { compactAlgorithm, darkAlgorithm } from '@apollo-design/theme';
import { CheckableTag, ConfigProvider, Tag } from '@apollo-design/ui';
import { defineComponent, h, nextTick, onMounted, ref } from 'vue';

const colors = [
  'default',
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
  'success',
  'processing',
  'error',
  'warning',
  '#f50',
  '#2db7f5',
  '#87d068',
  '#108ee9',
];
const variants = ['filled', 'solid', 'outlined'];
export default defineComponent({
  setup() {
    const mode = ref('default'),
      tokens = ref('none'),
      showVariable = ref(false);
    onMounted(() => {
      window.tagColors = {
        async set(options) {
          if ('mode' in options) mode.value = options.mode;
          if ('tokens' in options) tokens.value = options.tokens;
          if ('variable' in options) showVariable.value = options.variable;
          await nextTick();
        },
      };
    });
    return () =>
      h(
        ConfigProvider,
        {
          theme:
            mode.value === 'default' && tokens.value === 'none'
              ? undefined
              : {
                  algorithm:
                    mode.value === 'dark'
                      ? darkAlgorithm
                      : mode.value === 'compact'
                        ? compactAlgorithm
                        : mode.value === 'both'
                          ? [darkAlgorithm, compactAlgorithm]
                          : undefined,
                  components:
                    tokens.value === 'none'
                      ? undefined
                      : {
                          Tag:
                            tokens.value === 'first'
                              ? {
                                  defaultBg: '#d9f2ed',
                                  defaultColor: '#073b34',
                                  solidTextColor: '#081a28',
                                }
                              : {
                                  defaultBg: '#e5e9ff',
                                  defaultColor: '#1b2559',
                                  solidTextColor: '#162024',
                                },
                        },
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
                '--tag-audit-accent': '#ffcc00',
              },
            },
            [
              h('h1', 'Tag color and source contracts'),
              h('div', [
                h(Tag, { id: 'token-default' }, () => 'Default token'),
                h(Tag, { id: 'token-solid', variant: 'solid' }, () => 'Solid token'),
              ]),
              ...colors.flatMap((color, index) =>
                variants.map((variant) =>
                  h(
                    Tag,
                    {
                      id: `tag-color-${index}-${variant}`,
                      color,
                      variant,
                      style: { margin: '5px' },
                      'data-color': color,
                      'data-variant': variant,
                    },
                    () => color,
                  ),
                ),
              ),
              h(CheckableTag, { id: 'choice-unchecked', checked: false }, () => 'Unchecked choice'),
              h(CheckableTag, { id: 'choice-checked', checked: true }, () => 'Checked choice'),
              showVariable.value
                ? h(
                    Tag,
                    { id: 'variable-tag', color: 'var(--tag-audit-accent)' },
                    () => 'Native variable color',
                  )
                : null,
            ],
          ),
      );
  },
});
