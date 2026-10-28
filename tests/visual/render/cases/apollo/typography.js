/** Apollo native contract states. Original mechanical fixtures remain in ../vue/typography.js. */
import { compactAlgorithm, darkAlgorithm } from '@apollo-design/theme';
import { ConfigProvider, Link, Paragraph, Text, Title, Typography } from '@apollo-design/ui';
import { defineComponent, Fragment, h, nextTick, onMounted, ref } from 'vue';
import reference from '../vue/typography.js';

const long = 'Native Vue content keeps its identity while measured text wraps and expands. '.repeat(
  8,
);
const frame = (name, children) =>
  h(
    'main',
    {
      'data-typography-visual': name,
      style: {
        width: '100%',
        boxSizing: 'border-box',
        minHeight: '300px',
        padding: '16px',
        background: 'var(--apollo-color-bg-container)',
        color: 'var(--apollo-color-text)',
        fontFamily: 'var(--apollo-font-family)',
      },
    },
    [
      h('h1', { style: { fontSize: '20px', margin: '0 0 16px' } }, `Typography ${name}`),
      ...children,
    ],
  );
const rich = () => [h('b', 'First'), h('i', ' tail'), 0];
const showcase = () => [
  h(Title, { level: 2 }, () => 'Current theme'),
  h(Paragraph, null, () => 'Title, paragraph and native actions use their current source.'),
  ...['secondary', 'success', 'warning', 'danger'].map((type) =>
    h(Paragraph, { type, style: { marginBottom: '8px' } }, () => [
      `Semantic ${type} · `,
      h(Link, { type, href: '#theme-destination' }, () => 'Native link'),
    ]),
  ),
  h(Paragraph, { copyable: true }, () => 'Copy current text'),
  h(
    Paragraph,
    {
      editable: {
        editing: true,
        text: 'Multiline editor\nCurrent theme',
        autoSize: { minRows: 2, maxRows: 3 },
      },
      'aria-label': 'Theme editor',
      style: { maxWidth: '280px' },
    },
    () => 'Editable text',
  ),
  h(
    Paragraph,
    {
      ellipsis: { rows: 2, expandable: 'collapsible' },
      style: { width: '260px', maxWidth: '100%' },
    },
    () => long,
  ),
  h('span', { id: 'theme-destination' }, 'Destination'),
];
const themed = (name) =>
  h(
    ConfigProvider,
    {
      theme: {
        algorithm:
          name === 'theme-dark'
            ? darkAlgorithm
            : name === 'theme-compact'
              ? compactAlgorithm
              : [darkAlgorithm, compactAlgorithm],
      },
    },
    () => frame(name, showcase()),
  );
const CurrentProvider = defineComponent({
  setup() {
    const stage = ref(0);
    onMounted(() => {
      window.typographyVisual = {
        async next() {
          stage.value++;
          await nextTick();
        },
      };
    });
    return () =>
      h(
        ConfigProvider,
        {
          components: {
            typography: {
              classNames: {
                root: stage.value ? 'visual-current-provider' : 'visual-first-provider',
              },
              styles: {
                root: {
                  padding: '8px',
                  borderInlineStart: '3px solid var(--apollo-color-primary)',
                },
              },
            },
          },
        },
        () =>
          frame('current-provider', [
            h(Title, { level: 2 }, () => `Provider stage ${stage.value}`),
            h(Text, { id: 'typography-provider-content' }, () => [
              h('label', { for: 'typography-provider-draft' }, 'Business draft '),
              h('input', { id: 'typography-provider-draft', style: { width: '130px' } }),
            ]),
            h(Paragraph, { copyable: true }, () => rich()),
          ]),
      );
  },
});
export default {
  ...Object.fromEntries(
    ['text', 'title', 'decorations', 'link', 'ellipsis'].map((name) => [
      name,
      () => frame(name, [reference[name]()]),
    ]),
  ),
  'complete-content': () =>
    frame('complete-content', [
      h(Typography, null, () => [
        h(Title, { level: 2 }, () => 'Full native content'),
        h(Paragraph, { copyable: true }, () => rich()),
      ]),
      h(Text, { copyable: true }, () =>
        h(Fragment, null, [
          ...rich(),
          h('label', { for: 'typography-content-draft' }, ' Draft '),
          h('input', {
            id: 'typography-content-draft',
            value: 'Retained',
            style: { width: '100px' },
          }),
        ]),
      ),
      h(
        Paragraph,
        { editable: { triggerType: ['text'] } },
        () => 'Text editing keeps a keyboard entry.',
      ),
    ]),
  'copy-feedback': () =>
    frame('copy-feedback', [
      h(
        Paragraph,
        {
          copyable: {
            text: 'Clipboard payload',
            tooltips: [h('b', 'Copy'), h('i', ' the '), h('span', 'payload')],
          },
        },
        () => 'Copy to show successful feedback',
      ),
      h(Text, { copyable: { icon: 0 } }, () => 'Numeric configuration icon '),
    ]),
  'native-editing': () =>
    frame('native-editing', [
      h(
        Title,
        {
          level: 2,
          'aria-label': 'Title editor',
          editable: { editing: true, text: 'Title draft' },
          style: { maxWidth: '280px' },
        },
        () => 'Title',
      ),
      h(
        Link,
        {
          href: '#unused-editor-target',
          'aria-label': 'Link editor',
          editable: { editing: true, text: 'Link draft' },
          style: { display: 'block', maxWidth: '280px' },
        },
        () => 'Link',
      ),
      h(
        Text,
        {
          'aria-label': 'Native editor',
          editable: {
            editing: true,
            text: 'A native multiline draft\nSecond line',
            autoSize: { minRows: 2, maxRows: 4 },
          },
          style: { display: 'block', maxWidth: '280px' },
        },
        () => 'Body',
      ),
      h(
        Paragraph,
        {
          'aria-label': 'Configured editor',
          editable: {
            editing: true,
            text: 'Configured rows\nWithout confirm icon',
            autoSize: { minRows: 3, maxRows: 3 },
            enterIcon: null,
          },
          styles: { textarea: { fontSize: '16px' } },
          style: { maxWidth: '280px' },
        },
        () => 'Body',
      ),
    ]),
  'native-focus': () =>
    frame('native-focus', [
      h('button', { id: 'typography-before', type: 'button' }, 'Start'),
      h(
        Text,
        { id: 'typography-focus', editable: { triggerType: ['text'] } },
        () => 'Keyboard editable text',
      ),
    ]),
  'semantic-tokens': () =>
    frame('semantic-tokens', [
      ...[false, true].map((zero) =>
        h(
          ConfigProvider,
          {
            theme: {
              components: {
                Typography: {
                  titleMarginTop: zero ? 0 : '1.8em',
                  titleMarginBottom: zero ? 0 : '0.8em',
                },
              },
            },
          },
          () =>
            h(Typography, { style: { marginBottom: '16px' } }, () => [
              h(Paragraph, null, () => (zero ? 'Zero title spacing' : 'Custom title spacing')),
              h(Title, { level: 2 }, () => (zero ? 'Zero margins' : 'Current margins')),
              h(
                Text,
                {
                  styles: {
                    root: {
                      paddingInlineStart: '8px',
                      borderInlineStart: '3px solid var(--apollo-color-primary)',
                    },
                  },
                },
                () => 'Semantic root style',
              ),
            ]),
        ),
      ),
    ]),
  'current-provider': () => h(CurrentProvider),
  'theme-dark': () => themed('theme-dark'),
  'theme-compact': () => themed('theme-compact'),
  'theme-dark-compact': () => themed('theme-dark-compact'),
};
