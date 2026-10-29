import { compactAlgorithm, darkAlgorithm } from '@apollo-design/theme';
import { ConfigProvider, Divider } from '@apollo-design/ui';
import { defineComponent, Fragment, h, nextTick, onMounted, ref } from 'vue';

const frame = (name, children) =>
  h(
    'main',
    {
      'data-divider-visual': name,
      style: {
        width: '100%',
        boxSizing: 'border-box',
        minHeight: '240px',
        padding: '20px',
        color: 'var(--apollo-color-text)',
        background: 'var(--apollo-color-bg-container)',
        fontFamily: 'var(--apollo-font-family)',
        fontSize: 'var(--apollo-font-size)',
      },
    },
    [
      h('h1', { style: { fontSize: '20px', margin: '0 0 16px' } }, `Project sections: ${name}`),
      ...children,
    ],
  );
const text = () =>
  h(
    'p',
    { style: { margin: '8px 0' } },
    'Keep related project information together, with a clear boundary before the next section.',
  );
const line = (props = {}, title) =>
  h(
    Divider,
    props,
    title === undefined
      ? undefined
      : { default: typeof title === 'function' ? title : () => title },
  );
const link = (label) =>
  h('a', { href: '#project', style: { color: 'inherit', textDecoration: 'underline' } }, label);
const editor = (id) =>
  h('input', {
    id,
    'aria-label': 'Section draft',
    defaultValue: 'Project draft',
    style: {
      width: '130px',
      maxWidth: '100%',
      boxSizing: 'border-box',
      padding: '4px',
      color: 'var(--apollo-color-text)',
      background: 'var(--apollo-color-bg-container)',
      border: '1px solid var(--apollo-color-border)',
    },
  });
const contents = () => [
  text(),
  line({}, 'Project details'),
  text(),
  line({ titlePlacement: 'start' }, 'Next steps'),
  text(),
];
const themed = (name, algorithm) =>
  h(ConfigProvider, { theme: { algorithm } }, () => frame(name, contents()));
const CurrentProvider = defineComponent({
  setup() {
    const current = ref(false);
    onMounted(() => {
      window.dividerVisual = {
        async update() {
          current.value = true;
          await nextTick();
        },
      };
    });
    return () =>
      h(
        ConfigProvider,
        {
          direction: current.value ? 'rtl' : 'ltr',
          componentSize: current.value ? 'small' : 'large',
          components: {
            divider: {
              className: current.value ? 'provider-current' : 'provider-initial',
              styles: { content: { paddingInline: current.value ? '20px' : '4px' } },
            },
          },
        },
        () =>
          frame('current-provider', [
            line({ id: 'divider-current', titlePlacement: 'left' }, () => [
              h('span', 'Current section '),
              editor('divider-draft'),
            ]),
            text(),
          ]),
      );
  },
});

export default {
  horizontal: () => frame('horizontal', [text(), line(), text(), line({ dashed: true }), text()]),
  'with-text': () =>
    frame(
      'with-text',
      ['center', 'start', 'end'].flatMap((titlePlacement) => [
        line({ titlePlacement }, `Section ${titlePlacement}`),
        text(),
      ]),
    ),
  vertical: () =>
    frame('vertical', [
      h('p', [
        link('Overview'),
        line({ orientation: 'vertical' }),
        link('Members'),
        line({ vertical: true }),
        link('Settings'),
      ]),
    ]),
  variant: () =>
    frame(
      'variant',
      ['solid', 'dotted', 'dashed'].map((variant) => line({ variant }, variant)),
    ),
  size: () =>
    frame(
      'size',
      ['small', 'medium', 'large'].flatMap((size) => [h('p', size), line({ size })]),
    ),
  plain: () =>
    frame(
      'plain',
      ['center', 'start', 'end'].map((titlePlacement) =>
        line({ titlePlacement, plain: true }, `Plain ${titlePlacement}`),
      ),
    ),
  'customize-style': () =>
    frame('customize-style', [
      line({ style: { borderWidth: '3px', borderColor: '#1668dc' } }),
      text(),
      line({ variant: 'dashed', style: { borderColor: '#1668dc' } }, 'Review boundary'),
    ]),
  semantic: () =>
    frame('semantic', [
      line(
        {
          classNames: {
            root: 'divider-owned',
            content: 'divider-owned-title',
            rail: 'divider-owned-line',
          },
          styles: {
            root: { paddingBlock: '4px' },
            content: { paddingInline: '20px', background: '#e6f4ff', color: '#003eb3' },
            rail: { borderColor: '#1668dc' },
          },
        },
        'Semantic section',
      ),
    ]),
  'complete-content': () =>
    frame('complete-content', [
      line({}, () =>
        h(Fragment, null, [h('strong', 'Section '), 0, ' ', editor('divider-complete-draft')]),
      ),
      text(),
      line({}, () => 0),
      text(),
      line({}, () => []),
    ]),
  'current-provider': () => h(CurrentProvider),
  'semantic-tokens': () =>
    h(
      ConfigProvider,
      {
        theme: {
          components: {
            Divider: { textPaddingInline: 24, orientationMargin: 0.2, verticalMarginInline: 20 },
          },
        },
      },
      () =>
        frame('semantic-tokens', [
          line({ id: 'divider-token', titlePlacement: 'start' }, 'Token spacing'),
          h('p', [
            'First',
            line({ id: 'divider-token-vertical', orientation: 'vertical' }),
            'Second',
          ]),
          line({ dashed: true, variant: 'dotted' }, 'Dotted takes precedence'),
        ]),
    ),
  rtl: () =>
    h(ConfigProvider, { direction: 'rtl' }, () =>
      frame('rtl', [
        line({ titlePlacement: 'left' }, 'Physical left'),
        line({ titlePlacement: 'start' }, 'Logical start'),
        text(),
      ]),
    ),
  'native-focus': () =>
    frame('native-focus', [
      h('button', { id: 'divider-before', type: 'button' }, 'Before section'),
      line({}, () => editor('divider-focus')),
      text(),
    ]),
  'theme-dark': () => themed('theme-dark', darkAlgorithm),
  'theme-compact': () => themed('theme-compact', compactAlgorithm),
  'theme-dark-compact': () => themed('theme-dark-compact', [darkAlgorithm, compactAlgorithm]),
};
