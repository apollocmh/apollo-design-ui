import { compactAlgorithm, darkAlgorithm, transformToken, useTheme } from '@apollo-design/theme';
import { Col, ConfigProvider, Row, useBreakpoint } from '@apollo-design/ui';
import { defineComponent, Fragment, h, nextTick, onMounted, ref } from 'vue';

const Frame = defineComponent({
  props: { name: String },
  setup(props, { slots }) {
    const theme = useTheme();
    return () =>
      h(
        'main',
        {
          'data-grid-visual': props.name,
          style: {
            ...transformToken(theme.token.value).vars,
            boxSizing: 'border-box',
            padding: '16px',
            minHeight: '300px',
            width: '100%',
            background: 'var(--apollo-color-bg-container)',
            color: 'var(--apollo-color-text)',
            fontFamily: 'var(--apollo-font-family)',
            fontSize: 'var(--apollo-font-size)',
          },
        },
        [
          h('h1', { style: { margin: '0 0 16px', fontSize: '20px' } }, `Grid ${props.name}`),
          slots.default?.(),
        ],
      );
  },
});
const frame = (name, children) => h(Frame, { name }, () => children);
const box = (text, style = {}) =>
  h(
    'div',
    {
      'data-grid-visual-business': '',
      style: {
        minHeight: '32px',
        padding: '6px',
        boxSizing: 'border-box',
        background: 'var(--apollo-color-primary-bg)',
        color: 'var(--apollo-color-text)',
        border: '1px solid var(--apollo-color-border)',
        overflowWrap: 'anywhere',
        ...style,
      },
    },
    text,
  );
const columns = (spans, props = {}) =>
  spans.map((span, index) => h(Col, { key: index, span, ...props }, () => box(`col-${span}`)));
const section = (title, content) =>
  h('section', { style: { marginBlockEnd: '20px' } }, [
    h('h2', { style: { margin: '0 0 8px', fontSize: '14px' } }, title),
    ...content,
  ]);
const overview = () => [
  section('24 equal columns', [h(Row, null, () => columns([8, 8, 8]))]),
  section('Independent two-axis gutters', [
    h(Row, { gutter: [10.5, 7.5] }, () => columns([12, 12, 12])),
  ]),
  section('Current viewport widths', [
    h(Row, { gutter: 8 }, () =>
      ['A', 'B', 'C', 'D'].map((name) =>
        h(Col, { key: name, xs: 24, sm: 12, md: 6 }, () => box(name)),
      ),
    ),
  ]),
];
const themed = (name, algorithm) =>
  h(ConfigProvider, { theme: { algorithm } }, () => frame(name, overview()));
const Probe = defineComponent(() => {
  const screens = useBreakpoint();
  return () =>
    h(
      'output',
      { style: { display: 'block', marginBlockStart: '12px' } },
      `Active: ${Object.entries(screens.value ?? {})
        .filter(([, value]) => value)
        .map(([name]) => name)
        .join(', ')}`,
    );
});
const CurrentProvider = defineComponent({
  setup() {
    const stage = ref(0),
      row = ref(null),
      col = ref(null);
    onMounted(() => {
      window.gridVisual = {
        async next() {
          stage.value++;
          await nextTick();
        },
        snapshot: () => ({
          row: row.value?.nativeElement === document.getElementById('grid-provider-row'),
          col: col.value?.nativeElement === document.getElementById('grid-provider-col'),
        }),
      };
    });
    return () =>
      h(
        ConfigProvider,
        {
          direction: stage.value ? 'rtl' : 'ltr',
          components: stage.value
            ? {
                row: { className: 'grid-provider-after', style: { paddingBlock: '8px' } },
                col: { className: 'grid-col-after', style: { paddingBlock: '4px' } },
              }
            : undefined,
        },
        () =>
          frame('current-provider', [
            section('Current config preserves the native editor', [
              h(
                Row,
                {
                  id: 'grid-provider-row',
                  ref: row,
                  gutter: stage.value ? [10.5, 7.5] : 0,
                  justify: stage.value ? 'space-between' : 'start',
                  style: stage.value
                    ? ['min-height: 140px', { borderBlock: '1px solid var(--apollo-color-border)' }]
                    : undefined,
                },
                () => [
                  h(Col, { id: 'grid-provider-col', ref: col, span: 12 }, () =>
                    box([
                      h('label', { for: 'grid-provider-draft' }, 'Grid draft'),
                      h('input', {
                        id: 'grid-provider-draft',
                        'aria-label': 'Grid draft',
                        defaultValue: 'Original',
                        style: { width: '100%', minWidth: '0', boxSizing: 'border-box' },
                      }),
                    ]),
                  ),
                  h(Col, { span: 12 }, () => box('Current direction and gutter')),
                ],
              ),
            ]),
          ]),
      );
  },
});

export default {
  basic: () =>
    frame(
      'basic',
      [24, 12, 8, 6].map((span) =>
        section(`Span ${span}`, [
          h(Row, null, () => columns(Array.from({ length: 24 / span }, () => span))),
        ]),
      ),
    ),
  gutter: () =>
    frame(
      'gutter',
      [
        0,
        [10.5, 7.5],
        ['1rem', '0.5rem'],
        [
          { xs: 8, md: 24 },
          { xs: 4, md: 12 },
        ],
      ].map((gutter) =>
        section(JSON.stringify(gutter), [h(Row, { gutter }, () => columns([12, 12, 12]))]),
      ),
    ),
  responsive: () =>
    frame('responsive', [
      h(Row, { gutter: 8 }, () =>
        ['A', 'B', 'C', 'D'].map((name) =>
          h(Col, { xs: 24, sm: 12, md: 8, lg: 6, xl: 4, xxl: 3, xxxl: 2, key: name }, () =>
            box(name),
          ),
        ),
      ),
      h(Probe),
    ]),
  'offset-sort': () =>
    frame('offset-sort', [
      section('Logical offset', [
        h(Row, null, () => [
          h(Col, { span: 6, offset: 6 }, () => box('offset 6')),
          h(Col, { span: 6, offset: 6 }, () => box('offset 6')),
        ]),
      ]),
      section('Push / pull', [
        h(Row, null, () => [
          h(Col, { span: 18, push: 6 }, () => box('push 6')),
          h(Col, { span: 6, pull: 18 }, () => box('pull 18')),
        ]),
      ]),
      section('Visual order', [
        h(Row, null, () =>
          [3, 2, 1].map((order) =>
            h(Col, { order, span: 8, key: order }, () => box(`order ${order}`)),
          ),
        ),
      ]),
    ]),
  flex: () =>
    frame('flex', [
      section('Fixed and growing', [
        h(Row, { gutter: 8, wrap: false }, () => [
          h(Col, { flex: '80px' }, () => box('80px')),
          h(Col, { flex: 1.5 }, () => box('1.5')),
          h(Col, { flex: 'auto' }, () => box('auto')),
        ]),
      ]),
      section('Responsive flex and nowrap', [
        h(Row, { gutter: 8, wrap: false }, () =>
          ['A', 'B'].map((name) =>
            h(Col, { key: name, xs: { flex: '50%' }, md: { flex: '25%' } }, () => box(name)),
          ),
        ),
      ]),
    ]),
  'justify-align': () =>
    frame('justify-align', [
      section(
        'Main axis',
        ['start', 'center', 'end', 'space-between', 'space-around', 'space-evenly'].map((justify) =>
          h(Row, { justify, key: justify, style: { marginBlockEnd: '8px' } }, () =>
            columns([4, 4, 4]),
          ),
        ),
      ),
      section(
        'Cross axis',
        ['top', 'middle', 'bottom', 'stretch'].map((align) =>
          h(
            Row,
            {
              align,
              key: align,
              style: {
                height: '80px',
                marginBlockEnd: '8px',
                background: 'var(--apollo-color-fill-alter)',
              },
            },
            () => [
              h(Col, { span: 8 }, () => box(align)),
              h(Col, { span: 8 }, () => box('Tall', { minHeight: '60px' })),
            ],
          ),
        ),
      ),
    ]),
  'responsive-fields': () =>
    frame('responsive-fields', [
      section('All object fields and zero reset', [
        h(Row, null, () => [
          h(
            Col,
            {
              xs: { span: 12, offset: 6, order: 2, push: 1, pull: 0 },
              md: { span: 8, offset: 0, order: 0, push: 0, pull: 0 },
            },
            () => box('Current object'),
          ),
          h(Col, { xs: { span: 6, order: 1 }, md: { span: 16, order: 1 } }, () => box('Sibling')),
        ]),
      ]),
    ]),
  'nested-rtl': () =>
    h(ConfigProvider, { direction: 'rtl' }, () =>
      frame('nested-rtl', [
        section('RTL with independent nested gutter', [
          h(Row, { gutter: 16 }, () => [
            h(Col, { span: 12 }, () => box([h(Row, { gutter: 4 }, () => columns([12, 12]))])),
            h(Col, { span: 12 }, () => box('RTL sibling')),
          ]),
        ]),
        h(ConfigProvider, { direction: 'ltr' }, () =>
          section('Nested LTR', [h(Row, { gutter: 8 }, () => columns([12, 12]))]),
        ),
      ]),
    ),
  'complete-content': () =>
    frame('complete-content', [
      h(Row, null, () =>
        h(Col, { span: 24 }, () => [
          h('strong', 'Native'),
          ' text ',
          0,
          h(Fragment, [h('em', ' fragment'), h('span', ' tail')]),
        ]),
      ),
    ]),
  'current-provider': () => h(CurrentProvider),
  'native-focus': () =>
    frame('native-focus', [
      h('button', { id: 'grid-focus-before', type: 'button' }, 'Before grid'),
      h(Row, { gutter: 10.5, style: { marginBlockStart: '16px' } }, () =>
        h(Col, { span: 24 }, () =>
          h('input', {
            id: 'grid-focus-input',
            'aria-label': 'Grid focus draft',
            style: { maxWidth: '100%', boxSizing: 'border-box' },
          }),
        ),
      ),
    ]),
  'theme-dark': () => themed('theme-dark', darkAlgorithm),
  'theme-compact': () => themed('theme-compact', compactAlgorithm),
  'theme-dark-compact': () => themed('theme-dark-compact', [darkAlgorithm, compactAlgorithm]),
};
