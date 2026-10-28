import { compactAlgorithm, darkAlgorithm, transformToken, useTheme } from '@apollo-design/theme';
import { Badge, ConfigProvider, FloatButton, Ribbon } from '@apollo-design/ui';
import { createTextVNode, defineComponent, Fragment, h, nextTick, onMounted, ref } from 'vue';

const Frame = defineComponent({
  props: { name: String },
  setup(props, { slots }) {
    const theme = useTheme();
    return () =>
      h(
        'main',
        {
          'data-badge-visual': props.name,
          style: {
            ...transformToken(theme.token.value).vars,
            width: '100%',
            boxSizing: 'border-box',
            minHeight: '300px',
            padding: '16px',
            color: 'var(--apollo-color-text)',
            background: 'var(--apollo-color-bg-container)',
            fontFamily: 'var(--apollo-font-family)',
            fontSize: 'var(--apollo-font-size)',
          },
        },
        [
          h('h1', { style: { fontSize: '20px', margin: '0 0 16px' } }, `Badge ${props.name}`),
          slots.default?.(),
        ],
      );
  },
});
const frame = (name, children) => h(Frame, { name }, () => children);
const row = (children) =>
  h(
    'div',
    {
      style: {
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '32px',
        padding: '20px',
      },
    },
    children,
  );
const section = (title, children) =>
  h('section', null, [
    h('h2', { style: { fontSize: '14px', margin: '12px 0 0' } }, title),
    row(children),
  ]);
const anchor = (text = 'A') =>
  h(
    'span',
    {
      style: {
        display: 'inline-flex',
        width: '40px',
        height: '40px',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--apollo-color-fill-alter)',
        borderRadius: '4px',
      },
    },
    text,
  );
const count = (value, props = {}) => h(Badge, { count: value, ...props });
const wrapped = (props = {}) => h(Badge, props, () => anchor());
const statuses = ['success', 'processing', 'error', 'default', 'warning'];
const colors = [
  'pink',
  'red',
  'yellow',
  'orange',
  'cyan',
  'green',
  'blue',
  'purple',
  'geekblue',
  'magenta',
  'volcano',
  'gold',
  'lime',
];
const card = () =>
  h(
    'div',
    {
      style: {
        width: '160px',
        height: '64px',
        padding: '16px',
        boxSizing: 'border-box',
        background: 'var(--apollo-color-fill-alter)',
      },
    },
    'Business content',
  );
const ribbons = () => [
  h(Ribbon, { text: 'Hippopotamus' }, card),
  h(Ribbon, { text: 'Pink', color: 'pink' }, card),
  h(Ribbon, { text: 'Start', placement: 'start', color: 'blue' }, card),
  h(Ribbon, { text: 'Custom', color: '#2db7f5' }, card),
];
const showcase = () => [
  section('Numeric and zero', [
    wrapped({ count: 5 }),
    wrapped({ count: 120 }),
    wrapped({ count: 0, showZero: true }),
    count(-12),
    count(15, { size: 'small' }),
  ]),
  section('Status and dot', [
    wrapped({ status: 'success' }),
    wrapped({ dot: true }),
    h(Badge, { dot: true }),
    ...statuses.map((status) => h(Badge, { status, text: status })),
  ]),
  section('Ribbon', ribbons().slice(0, 2)),
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
const tokenValues = {
  indicatorZIndex: 13,
  indicatorHeight: 30,
  indicatorHeightSM: 18,
  dotSize: 10,
  textFontSize: 15,
  textFontSizeSM: 11,
  textFontWeight: 700,
  statusSize: 9,
  paddingInline: 13,
};
const CurrentProvider = defineComponent({
  setup() {
    const stage = ref(0),
      badge = ref(null),
      ribbon = ref(null);
    onMounted(() => {
      window.badgeVisual = {
        async next() {
          stage.value++;
          await nextTick();
        },
        snapshot: () => ({
          roots: [
            badge.value?.nativeElement === document.getElementById('badge-provider-root'),
            ribbon.value?.nativeElement === document.getElementById('ribbon-provider-root'),
          ],
        }),
      };
    });
    return () =>
      h(
        ConfigProvider,
        {
          direction: stage.value ? 'rtl' : 'ltr',
          theme: { components: { Badge: stage.value ? tokenValues : {} } },
          components: {
            badge: {
              classNames: () => ({
                root: stage.value ? 'visual-badge-after' : 'visual-badge-before',
              }),
              styles: () => ({
                root: {
                  padding: '8px',
                  borderInlineStart: '3px solid var(--apollo-color-primary)',
                },
              }),
            },
            ribbon: {
              classNames: () => ({
                content: stage.value ? 'visual-ribbon-after' : 'visual-ribbon-before',
              }),
            },
          },
        },
        () =>
          frame('current-provider', [
            section('Current config, native refs and preserved draft', [
              h(Badge, { id: 'badge-provider-root', ref: badge, count: 15 }, () =>
                h('input', {
                  id: 'badge-provider-draft',
                  'aria-label': 'Badge provider draft',
                  style: { width: '120px' },
                }),
              ),
              h(
                Ribbon,
                {
                  id: 'ribbon-provider-root',
                  ref: ribbon,
                  text: 'Current ribbon',
                  style: 'padding: 12px',
                },
                card,
              ),
            ]),
            section('Shared current source', [
              count(25),
              count(25, { size: 'small' }),
              wrapped({ status: 'success' }),
              h(Badge, { dot: true }),
            ]),
          ]),
      );
  },
});
const rich = () => [h('strong', 'First'), h('em', ' tail'), 0];
const MultipleRoots = defineComponent(() => () => rich());

export default {
  basic: () =>
    frame('basic', [
      section('Wrapped counters', [
        wrapped({ count: 5 }),
        wrapped({ count: 120 }),
        wrapped({ count: 0, showZero: true }),
      ]),
      section('Signed and standalone', [count(-12), count(25), count(99), count('New')]),
    ]),
  status: () =>
    frame('status', [
      section(
        'Standalone status',
        statuses.map((status) => h(Badge, { status, text: status })),
      ),
      section(
        'Wrapped status',
        statuses.map((status) => wrapped({ status })),
      ),
    ]),
  colorful: () =>
    frame('colorful', [
      section(
        'Preset descriptors',
        colors.map((color) => h(Badge, { color, text: color })),
      ),
      section(
        'Preset counts',
        colors.map((color) => count(25, { color })),
      ),
    ]),
  dot: () =>
    frame('dot', [
      section('Wrapped dot overrides zero and numbers', [
        wrapped({ dot: true }),
        wrapped({ dot: true, count: 0 }),
        wrapped({ dot: true, count: 5 }),
      ]),
      section('Standalone dot roots', [
        h(Badge, { dot: true }),
        h(Badge, { dot: true, color: 'blue' }),
        h(Badge, { status: 'success', text: 'Ready' }),
      ]),
    ]),
  ribbon: () => frame('ribbon', [section('Native ribbons', ribbons())]),
  'offset-size': () =>
    frame('offset-size', [
      section('Sizes and CSS lengths', [
        wrapped({ count: 5, size: 'small' }),
        wrapped({ count: 5, offset: [1.5, 2.5] }),
        wrapped({ count: 5, offset: ['1em', '0.5rem'] }),
        count(25),
      ]),
    ]),
  'complete-content': () =>
    frame('complete-content', [
      section('Complete count data', [
        count(h('strong', 'Native')),
        count(rich()),
        count(h(Fragment, rich())),
        count(createTextVNode('Text node')),
        count(h(MultipleRoots)),
        h(Badge, { text: 'Caption stays', count: null }),
      ]),
      section('Native slots', [
        h(Badge, { count: 120 }, { count: rich }),
        h(Badge, { status: 'success', text: 'Fallback' }, { text: rich }),
        h(Ribbon, { text: 'Fallback' }, { text: rich, default: card }),
      ]),
    ]),
  'status-placement': () =>
    frame('status-placement', [
      section('Root corners and floating callers', [
        wrapped({ status: 'processing' }),
        wrapped({ status: 'success' }),
        h(Badge, { dot: true }),
        ...['circle', 'square'].map((shape) =>
          h(FloatButton, {
            shape,
            badge: { dot: true },
            'aria-label': `${shape} floating action`,
            style: { position: 'relative', inset: 'auto' },
          }),
        ),
      ]),
      h(ConfigProvider, { direction: 'rtl' }, () =>
        section('RTL and native LTR override', [
          wrapped({ status: 'success' }),
          h(Badge, { count: 5, dir: 'ltr' }, () => anchor('LTR')),
          h(Badge, { count: 5, dir: 'auto' }, () => h('span', 'עברית')),
        ]),
      ),
    ]),
  'semantic-tokens': () =>
    frame('semantic-tokens', [
      h(ConfigProvider, { theme: { components: { Badge: tokenValues } } }, () =>
        section('All nine current tokens', [
          count(25),
          count(25, { size: 'small' }),
          h(Badge, { dot: true }),
          wrapped({ status: 'success' }),
          h(Badge, null, { count: rich }),
          count(15, { style: { '--apollo-badge-indicator-height': '23px' } }),
        ]),
      ),
      section('Native root and explicit inner paint', [
        count(5, {
          style: ['padding: 8px', { border: '1px solid var(--apollo-color-primary)' }],
          styles: {
            indicator: {
              backgroundColor: '#fff',
              color: '#595959',
              borderColor: 'red',
              boxShadow: 'none',
            },
          },
        }),
      ]),
    ]),
  'current-provider': () => h(CurrentProvider),
  'native-focus': () =>
    frame('native-focus', [
      row([
        h('button', { id: 'badge-before', type: 'button' }, 'Before'),
        h(Badge, { count: 5 }, () =>
          h('button', { id: 'badge-focus', type: 'button' }, 'Open inbox'),
        ),
        h('button', { type: 'button' }, 'After'),
      ]),
    ]),
  'theme-dark': () => themed('theme-dark'),
  'theme-compact': () => themed('theme-compact'),
  'theme-dark-compact': () => themed('theme-dark-compact'),
};
