import { compactAlgorithm, darkAlgorithm } from '@apollo-design/theme';
import { CheckableTag, CheckableTagGroup, ConfigProvider, Tag } from '@apollo-design/ui';
import { createCommentVNode, defineComponent, h, nextTick, onMounted, ref } from 'vue';

const captions = {
  basic: 'Labels, links and three variants',
  colors: 'Presets, status and custom colours',
  'complete-content': 'Complete owned Vue content',
  'close-action': 'Native close retains hidden DOM',
  'close-canceled': 'Cancelable native close and caller glyphs',
  checkable: 'Independent checked state',
  'group-models': 'Single and multiple models',
  disabled: 'Disabled links and selection',
  semantic: 'Four independent semantic regions',
  'current-provider': 'Current configuration preserves drafts',
  rtl: 'Right to left labels',
  'theme-dark': 'Dark labels',
  'theme-compact': 'Compact labels',
  'theme-dark-compact': 'Dark compact labels',
  'native-focus': 'Native keyboard focus',
};
const row = (children) =>
  h(
    'div',
    {
      style: {
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '8px',
        marginBlock: '12px',
      },
    },
    children,
  );
const frame = (name, children) =>
  h(
    'main',
    {
      'data-tag-visual-case': name,
      style: {
        boxSizing: 'border-box',
        width: '100%',
        minHeight: '260px',
        padding: '16px',
        color: 'var(--apollo-color-text)',
        background: 'var(--apollo-color-bg-container)',
        fontFamily: 'var(--apollo-font-family)',
        fontSize: 'var(--apollo-font-size)',
      },
    },
    [
      h('h1', { style: { margin: '0 0 12px', fontSize: '20px' } }, 'Tag workspace'),
      h('h2', { style: { margin: '0 0 16px', fontSize: '14px' } }, captions[name]),
      ...children,
    ],
  );
const tag = (label, props = {}, slots = {}) => h(Tag, props, { default: () => label, ...slots });
const glyph = () => [
  h(
    'svg',
    {
      width: 12,
      height: 12,
      viewBox: '0 0 12 12',
      role: 'img',
      'aria-label': 'Business glyph',
      'data-tag-glyph': 'yes',
    },
    [h('path', { d: 'M2 2l8 8M10 2l-8 8', stroke: 'currentColor' })],
  ),
  h('span', 'x'),
];
const complete = (props = {}) =>
  tag(
    [
      h('label', { for: 'tag-draft' }, 'Draft '),
      h('input', { id: 'tag-draft', style: { width: '65px' } }),
      h('strong', ' Tail'),
      0,
    ],
    { id: 'tag-main', closable: true, ...props },
    { icon: () => [createCommentVNode('first'), h('b', 'I'), h('i', 'tail')], closeIcon: glyph },
  );
const labels = () =>
  row([
    tag('Default'),
    tag('Linked', { href: '#labels', closable: true }),
    tag('Filled', { color: 'blue' }),
    tag('Solid', { color: 'blue', variant: 'solid' }),
    tag('Outlined', { color: 'success', variant: 'outlined' }),
    tag('Custom', { color: '#2db7f5' }),
  ]);
const choices = () =>
  row([
    h(CheckableTag, { checked: true }, () => 'Checked'),
    h(CheckableTag, { checked: false }, () => 'Unchecked'),
  ]);
const theming = (name, algorithm) =>
  h(ConfigProvider, { theme: { algorithm } }, () =>
    frame(name, [labels(), choices(), tag('Closable', { closable: true, color: 'magenta' })]),
  );
const NativeState = defineComponent({
  props: { mode: String },
  setup(props) {
    const checked = ref(false),
      single = ref('Books'),
      multiple = ref(['Movies']),
      updated = ref(false),
      closes = ref(0);
    onMounted(() => {
      window.tagVisual = {
        async update() {
          updated.value = true;
          await nextTick();
        },
        snapshot: () => ({
          checked: checked.value,
          single: single.value,
          multiple: multiple.value,
          closes: closes.value,
        }),
      };
    });
    return () => {
      const mode = props.mode;
      const close = (event) => {
        closes.value++;
        if (mode === 'close-canceled') event.preventDefault();
      };
      const content =
        mode === 'checkable'
          ? [
              row([
                h(
                  CheckableTag,
                  {
                    id: 'tag-choice',
                    checked: checked.value,
                    'onUpdate:checked': (value) => (checked.value = value),
                  },
                  () => 'Toggle choice',
                ),
                h(CheckableTag, { checked: true }, () => 'Initially selected'),
              ]),
            ]
          : mode === 'group-models'
            ? [
                h('p', 'Single'),
                h(CheckableTagGroup, {
                  'aria-label': 'Single interest',
                  options: ['Movies', 'Books', 'Music'],
                  value: single.value,
                  'onUpdate:value': (value) => (single.value = value),
                }),
                h('p', 'Multiple'),
                h(CheckableTagGroup, {
                  'aria-label': 'Multiple interests',
                  options: ['Movies', 'Books', 'Music'],
                  multiple: true,
                  value: multiple.value,
                  'onUpdate:value': (value) => (multiple.value = value),
                }),
              ]
            : mode === 'current-provider'
              ? [complete()]
              : [
                  row([
                    tag(
                      'Close label',
                      { id: 'tag-main', href: '#labels', closable: true, onClose: close },
                      { closeIcon: glyph },
                    ),
                    tag('Still visible'),
                  ]),
                ];
      return mode === 'current-provider'
        ? h(
            ConfigProvider,
            {
              components: {
                tag: {
                  className: updated.value ? 'provider-current' : 'provider-first',
                  variant: updated.value ? 'outlined' : 'filled',
                  styles: { content: { fontWeight: updated.value ? 600 : 400 } },
                },
              },
              theme: updated.value
                ? { components: { Tag: { defaultBg: '#e5e9ff', defaultColor: '#1b2559' } } }
                : undefined,
            },
            () => frame(mode, content),
          )
        : frame(mode, content);
    };
  },
});
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
export default {
  basic: () => frame('basic', [labels()]),
  colors: () =>
    frame(
      'colors',
      ['filled', 'solid', 'outlined'].map((variant) =>
        h('section', [
          h('h3', { style: { fontSize: '13px' } }, variant),
          row(colors.map((color) => tag(color, { color, variant }))),
        ]),
      ),
    ),
  'complete-content': () => frame('complete-content', [complete()]),
  'close-action': () => h(NativeState, { mode: 'close-action' }),
  'close-canceled': () => h(NativeState, { mode: 'close-canceled' }),
  checkable: () => h(NativeState, { mode: 'checkable' }),
  'group-models': () => h(NativeState, { mode: 'group-models' }),
  disabled: () =>
    frame('disabled', [
      row([
        tag('Disabled link', { href: '#labels', closable: true, disabled: true }),
        h(CheckableTag, { disabled: true, checked: true }, () => 'Disabled selected'),
        h(CheckableTag, { disabled: true }, () => 'Disabled unchecked'),
      ]),
    ]),
  semantic: () =>
    frame('semantic', [
      complete({
        classNames: {
          root: 'tag-owned-root',
          icon: 'tag-owned-icon',
          content: 'tag-owned-content',
          close: 'tag-owned-close',
        },
        styles: {
          root: { padding: '4px 8px', border: '1px dashed var(--apollo-color-border)' },
          icon: { fontWeight: 600 },
          content: { fontWeight: 600 },
          close: { marginInlineStart: '8px' },
        },
      }),
    ]),
  'current-provider': () => h(NativeState, { mode: 'current-provider' }),
  rtl: () => h(ConfigProvider, { direction: 'rtl' }, () => frame('rtl', [complete(), labels()])),
  'theme-dark': () => theming('theme-dark', darkAlgorithm),
  'theme-compact': () => theming('theme-compact', compactAlgorithm),
  'theme-dark-compact': () => theming('theme-dark-compact', [darkAlgorithm, compactAlgorithm]),
  'native-focus': () =>
    frame('native-focus', [
      h('button', { type: 'button', id: 'tag-before' }, 'Before link'),
      row([tag('Focus link', { id: 'tag-main', href: '#labels', closable: true })]),
    ]),
};
