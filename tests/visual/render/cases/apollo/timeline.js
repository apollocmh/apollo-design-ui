import { compactAlgorithm, darkAlgorithm, transformToken, useTheme } from '@apollo-design/theme';
import { ConfigProvider, Timeline } from '@apollo-design/ui';
import { defineComponent, Fragment, h, nextTick, onMounted, ref } from 'vue';

const Frame = defineComponent({
  props: { name: String },
  setup(props, { slots }) {
    const theme = useTheme();
    return () =>
      h(
        'main',
        {
          'data-timeline-visual': props.name,
          style: {
            ...transformToken(theme.token.value).vars,
            width: '100%',
            boxSizing: 'border-box',
            minHeight: '280px',
            padding: '16px',
            color: 'var(--apollo-color-text)',
            background: 'var(--apollo-color-bg-container)',
            fontFamily: 'var(--apollo-font-family)',
            fontSize: 'var(--apollo-font-size)',
          },
        },
        [
          h('h1', { style: { fontSize: '20px', margin: '0 0 16px' } }, `Timeline ${props.name}`),
          slots.default?.(),
        ],
      );
  },
});
const frame = (name, children) => h(Frame, { name }, () => children);
const records = () => [
  { key: 0, title: '09:10', content: 'Create a service record' },
  { key: 'review', title: '10:05', content: 'Review the network settings', color: 'green' },
  { key: 'complete', title: '11:30', content: 'Complete technical testing' },
];
const titleless = () => records().map(({ title: _title, ...item }) => item);
// Data is passed separately to keep every invocation fresh and every row keyed.
const list = (items = records(), props = {}, slots) => h(Timeline, { items, ...props }, slots);
const rich = (text) => [h('strong', text), ' ', h('em', 'tail'), 0];
const block = (label, child) =>
  h('section', { style: { marginBlockEnd: '20px' } }, [
    h('h2', { style: { fontSize: '14px', margin: '0 0 8px' } }, label),
    child,
  ]);
const tokenValues = {
  tailColor: '#5267a8',
  tailWidth: 5,
  dotSize: 18,
  dotBorderWidth: 3,
  dotBg: '#e5eaff',
  itemPaddingBottom: 30,
};
const themed = (name, algorithm) =>
  h(ConfigProvider, { theme: { algorithm } }, () =>
    frame(name, [
      block('Content only · natural spacing', list(titleless())),
      block('Dated records', list()),
      block('Horizontal', list(records(), { orientation: 'horizontal', mode: 'alternate' })),
    ]),
  );
const NativeState = defineComponent({
  props: { mode: String },
  setup(props) {
    const stage = ref(0),
      api = ref(null);
    const events = [];
    onMounted(() => {
      window.timelineVisual = {
        async update() {
          stage.value += 1;
          await nextTick();
        },
        snapshot: () => ({
          stage: stage.value,
          nativeRoot: api.value?.nativeElement === document.getElementById('timeline-main'),
          events: [...events],
        }),
      };
    });
    return () => {
      const current = stage.value > 0;
      const mode = props.mode;
      const rows = records().map((item) => ({
        ...item,
        content: `${item.content}${current ? '!' : ''}`,
      }));
      const slots =
        mode === 'conditional-slots' && current
          ? { itemTitle: () => [], itemContent: () => [], itemIcon: () => [] }
          : {
              itemTitle: ({ item }) => [h('time', String(item.title)), h('span', ' · record')],
              itemContent: ({ item, index }) => [
                h(Fragment, rich(`${item.content} · ${index}`)),
                item.key === 0
                  ? h('input', {
                      id: 'timeline-draft',
                      'aria-label': 'Record draft',
                      style: { width: '100%', maxWidth: '160px', boxSizing: 'border-box' },
                    })
                  : null,
              ],
              itemIcon: ({ index }) => [h('span', { 'aria-hidden': 'true' }, index + 1)],
            };
      const body = frame(mode, [
        mode === 'native-focus'
          ? h('button', { id: 'timeline-before', type: 'button' }, 'Before history')
          : null,
        list(
          rows,
          {
            ref: api,
            id: 'timeline-main',
            'aria-label': 'Record history',
            reverse: mode === 'reverse-edit' && current,
            pending: mode === 'pending-zero' && current ? 0 : undefined,
            onChange: (event) =>
              events.push({ domEvent: event instanceof Event, type: event.type }),
          },
          slots,
        ),
      ]);
      return mode === 'current-provider'
        ? h(
            ConfigProvider,
            {
              direction: current ? 'rtl' : 'ltr',
              theme: { components: { Timeline: current ? tokenValues : {} } },
              components: {
                timeline: {
                  className: current ? 'timeline-config-current' : 'timeline-config-first',
                  classNames: { itemContent: 'timeline-config-content' },
                  styles: {
                    root: { padding: '8px', border: '1px solid var(--apollo-color-border)' },
                  },
                },
              },
            },
            () => body,
          )
        : body;
    };
  },
});

export default {
  basic: () => frame('basic', [list()]),
  verticalSingle: () => frame('verticalSingle', [list(titleless())]),
  alternate: () => frame('alternate', [list(records(), { mode: 'alternate' })]),
  horizontal: () => frame('horizontal', [list(titleless(), { orientation: 'horizontal' })]),
  'horizontal-end': () =>
    frame('horizontal-end', [list(titleless(), { orientation: 'horizontal', mode: 'end' })]),
  titleSpanNumber: () => frame('titleSpanNumber', [list(records(), { titleSpan: 8 })]),
  titleSpanString: () => frame('titleSpanString', [list(records(), { titleSpan: '40%' })]),
  colors: () =>
    frame('colors', [
      list(
        ['blue', 'red', 'green', 'gray', '#5267a8'].map((color) => ({
          key: color,
          title: color,
          content: 'Current record',
          color,
        })),
      ),
    ]),
  loading: () =>
    frame('loading', [
      list([
        { key: 'a', content: 'Create a service record' },
        { key: 'b', content: 'Recording a new result…', loading: true },
      ]),
    ]),
  pending: () => frame('pending', [list(titleless(), { pending: 'Recording…' })]),
  reverse: () => frame('reverse', [list(records(), { reverse: true })]),
  variantFilled: () => frame('variantFilled', [list(titleless(), { variant: 'filled' })]),
  rtl: () => h(ConfigProvider, { direction: 'rtl' }, () => frame('rtl', [list()])),
  'complete-content': () =>
    frame('complete-content', [
      list([
        {
          key: 'rich',
          title: h(Fragment, rich('Title')),
          content: rich('Record'),
          icon: [h('span', 'I'), 0],
          styles: { icon: { color: 'var(--apollo-color-text)' } },
        },
        {
          key: 'component',
          title: 'Complete',
          content: [h('span', 'First'), h('strong', ' and last')],
        },
      ]),
    ]),
  'scalar-content': () =>
    frame('scalar-content', [
      list([
        { key: 'zero', title: 0, content: 0, icon: 0, loading: true },
        {
          key: 'false',
          title: 'Explicit false icon',
          content: 'No spinner',
          icon: false,
          loading: true,
        },
        {
          key: 'empty',
          title: 'Explicit empty icon',
          content: 'No fallback',
          icon: '',
          loading: true,
        },
      ]),
    ]),
  'long-horizontal': () =>
    frame('long-horizontal', [
      list(
        [
          {
            key: 'a',
            title: 'Long Text '.repeat(5),
            content: 'Complete record details '.repeat(3),
          },
          { key: 'b', content: 'A shorter note', placement: 'end' },
          {
            key: 'c',
            title: 'Long Text '.repeat(5),
            content: 'UnbrokenRecordIdentifierWithoutSpaces',
          },
        ],
        { orientation: 'horizontal', mode: 'alternate' },
      ),
    ]),
  'token-overrides': () =>
    h(ConfigProvider, { theme: { components: { Timeline: tokenValues } } }, () =>
      frame('token-overrides', [
        block('Titleless, including active last dot', list(titleless())),
        block('Dated records', list()),
      ]),
    ),
  semantic: () =>
    frame('semantic', [
      list(
        records().map((item) => ({
          ...item,
          classNames: {
            root: 'timeline-owned-item',
            title: 'timeline-owned-title',
            content: 'timeline-owned-content',
          },
          styles: {
            rail: { borderStyle: 'dashed' },
            title: { fontWeight: 600 },
            content: { paddingBlock: '4px' },
          },
        })),
        { style: 'padding:8px;border:1px solid var(--apollo-color-border)' },
      ),
    ]),
  'conditional-slots': () => h(NativeState, { mode: 'conditional-slots' }),
  'current-provider': () => h(NativeState, { mode: 'current-provider' }),
  'reverse-edit': () => h(NativeState, { mode: 'reverse-edit' }),
  'pending-zero': () => h(NativeState, { mode: 'pending-zero' }),
  'native-focus': () => h(NativeState, { mode: 'native-focus' }),
  'theme-dark': () => themed('theme-dark', darkAlgorithm),
  'theme-compact': () => themed('theme-compact', compactAlgorithm),
  'theme-dark-compact': () => themed('theme-dark-compact', [darkAlgorithm, compactAlgorithm]),
};
