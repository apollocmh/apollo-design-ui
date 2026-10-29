import { en_US as enUS, zh_CN as zhCN } from '@apollo-design/locale';
import { compactAlgorithm, darkAlgorithm, ThemeProvider } from '@apollo-design/theme';
import { ConfigProvider, Empty, Input } from '@apollo-design/ui';
import { defineComponent, h, nextTick, onMounted, ref } from 'vue';

const frame = (name, children) =>
  h(
    'main',
    {
      'data-config-visual': name,
      style: {
        width: '100%',
        minHeight: '300px',
        boxSizing: 'border-box',
        padding: '20px',
        color: 'var(--apollo-color-text)',
        background: 'var(--apollo-color-bg-container)',
        fontFamily: 'var(--apollo-font-family)',
        fontSize: 'var(--apollo-font-size)',
      },
    },
    [
      h('h1', { style: { fontSize: '20px', margin: '0 0 16px' } }, `Application defaults: ${name}`),
      ...children,
    ],
  );
const section = (title, children, props = {}) =>
  h('section', { style: { marginBlockEnd: '20px' }, ...props }, [
    h('h2', { style: { fontSize: '15px', margin: '0 0 8px' } }, title),
    ...children,
  ]);
const input = (label, props = {}) =>
  h(Input, {
    'aria-label': label,
    defaultValue: 'Business draft',
    style: { width: '280px', maxWidth: '100%' },
    ...props,
  });
const empty = () => h(Empty, { image: Empty.PRESENTED_IMAGE_SIMPLE });
const samples = () => [
  section('Current form defaults', [input('Project draft', { allowClear: true })]),
  section('Localized empty state', [empty()]),
];
const themed = (name, algorithm) =>
  h(ConfigProvider, { theme: { algorithm } }, () => frame(name, samples()));
const CurrentProvider = defineComponent({
  setup() {
    const current = ref(false);
    onMounted(() => {
      window.configVisual = {
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
          componentSize: current.value ? 'large' : 'small',
          direction: current.value ? 'rtl' : 'ltr',
          locale: current.value ? zhCN : enUS,
          variant: current.value ? 'filled' : 'outlined',
          components: { input: { className: current.value ? 'config-current' : 'config-initial' } },
        },
        () =>
          frame('current-provider', [
            section('Persistent provider draft', [
              input('Persistent provider draft', { id: 'config-draft' }),
            ]),
            section('Current language', [empty()]),
          ]),
      );
  },
});

export default {
  locale: () =>
    frame('locale', [
      h(ConfigProvider, { locale: enUS }, () =>
        section('English locale', [empty()], { id: 'config-english' }),
      ),
      h(ConfigProvider, { locale: zhCN }, () =>
        section('中文语言', [empty()], { id: 'config-chinese' }),
      ),
    ]),
  'size-disabled': () =>
    frame('size-disabled', [
      h(ConfigProvider, { componentSize: 'small', componentDisabled: true }, () =>
        section('Inherited disabled and small', [
          input('Inherited disabled', { id: 'config-disabled' }),
          input('Local enabled override', {
            id: 'config-enabled',
            disabled: false,
            style: { width: '280px', maxWidth: '100%', marginBlockStart: '12px' },
          }),
        ]),
      ),
      h(ConfigProvider, { componentSize: 'large' }, () =>
        section('Large defaults', [input('Inherited large', { id: 'config-large' })]),
      ),
    ]),
  'component-defaults': () =>
    h(
      ConfigProvider,
      {
        components: {
          input: {
            className: 'configured-input',
            styles: { input: { paddingInline: '20px', color: '#003eb3' } },
          },
        },
      },
      () =>
        frame('component-defaults', [
          section('Actual consumed component styles', [
            input('Configured input', { id: 'config-component' }),
          ]),
        ]),
    ),
  'current-provider': () => h(CurrentProvider),
  'scope-tag': () =>
    frame('scope-tag', [
      h(
        ConfigProvider,
        {
          scopeTag: 'section',
          id: 'config-scope',
          style: { padding: '16px', border: '2px solid #003eb3' },
          theme: { token: { fontSize: 18 } },
        },
        () => [
          h('h2', { style: { margin: '0 0 12px', fontSize: '18px' } }, 'Explicit native scope'),
          input('Explicit scope draft'),
        ],
      ),
    ]),
  'native-parents': () =>
    frame('native-parents', [
      h('table', { style: { width: '100%', borderCollapse: 'collapse', marginBlockEnd: '16px' } }, [
        h('thead', [
          h('tr', [
            h('th', { scope: 'col', style: { textAlign: 'start' } }, 'Project'),
            h('th', { scope: 'col', style: { textAlign: 'start' } }, 'Stage'),
          ]),
        ]),
        h('tbody', [
          h(ConfigProvider, { theme: { token: { fontSize: 16 } } }, () =>
            h('tr', { id: 'config-table-row' }, [h('td', 'Native table row'), h('td', 'Review')]),
          ),
        ]),
      ]),
      h('ul', [
        h(ConfigProvider, { theme: { token: { colorText: '#003eb3' } } }, () =>
          h('li', 'Native list item'),
        ),
      ]),
      h(
        'svg',
        {
          role: 'img',
          'aria-label': 'Native SVG scope',
          viewBox: '0 0 280 50',
          style: { width: '280px', maxWidth: '100%', height: '50px' },
        },
        [
          h(
            ConfigProvider,
            { scopeTag: 'g', theme: { token: { colorText: '#003eb3', fontSize: 18 } } },
            () =>
              h(
                'text',
                {
                  x: 4,
                  y: 30,
                  fill: 'var(--apollo-color-text)',
                  style: { fontSize: 'var(--apollo-font-size)' },
                },
                'Native SVG text',
              ),
          ),
        ],
      ),
    ]),
  'css-only': () =>
    h('div', { style: { '--apollo-font-size': '18px', '--apollo-control-height': '40px' } }, [
      h(ConfigProvider, null, () =>
        frame('css-only', [
          section('Inherited CSS-only variables', [
            input('CSS-only draft', { id: 'config-css-only' }),
          ]),
        ]),
      ),
    ]),
  'empty-reset': () =>
    h(ConfigProvider, { theme: { algorithm: darkAlgorithm } }, () =>
      frame('empty-reset', [
        section('Inherited dark theme', [input('Dark provider draft')]),
        h(ThemeProvider, { theme: {} }, () =>
          h(ConfigProvider, null, () =>
            section(
              'Explicit empty ThemeProvider resets defaults',
              [input('Reset provider draft'), empty()],
              {
                id: 'config-reset',
                style: {
                  padding: '16px',
                  background: 'var(--apollo-color-bg-container)',
                  color: 'var(--apollo-color-text)',
                },
              },
            ),
          ),
        ),
      ]),
    ),
  'native-focus': () =>
    h(ConfigProvider, { componentSize: 'large' }, () =>
      frame('native-focus', [
        h('button', { id: 'config-before', type: 'button' }, 'Before provider field'),
        section('Native keyboard field', [
          input('Provider keyboard draft', { id: 'config-focus' }),
        ]),
      ]),
    ),
  rtl: () =>
    h(ConfigProvider, { direction: 'rtl' }, () =>
      frame('rtl', [
        section('RTL field layout', [
          input('RTL provider draft', { prefix: '¥', suffix: '元', allowClear: true }),
        ]),
        empty(),
      ]),
    ),
  'theme-token': () =>
    h(
      ConfigProvider,
      { theme: { token: { fontSize: 18, controlHeight: 40, borderRadius: 10 } } },
      () => frame('theme-token', samples()),
    ),
  'theme-dark': () => themed('theme-dark', darkAlgorithm),
  'theme-compact': () => themed('theme-compact', compactAlgorithm),
  'theme-dark-compact': () => themed('theme-dark-compact', [darkAlgorithm, compactAlgorithm]),
};
