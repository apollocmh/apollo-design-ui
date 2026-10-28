import { compactAlgorithm, darkAlgorithm, transformToken, useTheme } from '@apollo-design/theme';
import { ConfigProvider, Descriptions, DescriptionsItem } from '@apollo-design/ui';
import { createCommentVNode, defineComponent, Fragment, h, nextTick, onMounted, ref } from 'vue';

const Frame = defineComponent({
  props: { name: String },
  setup(props, { slots }) {
    const theme = useTheme();
    return () =>
      h(
        'main',
        {
          'data-descriptions-visual': props.name,
          style: {
            ...transformToken(theme.token.value).vars,
            boxSizing: 'border-box',
            width: '100%',
            minHeight: '320px',
            padding: '16px',
            color: 'var(--apollo-color-text)',
            background: 'var(--apollo-color-bg-container)',
            fontFamily: 'var(--apollo-font-family)',
            fontSize: 'var(--apollo-font-size)',
          },
        },
        [
          h(
            'h1',
            { style: { fontSize: '20px', margin: '0 0 16px' } },
            `Descriptions ${props.name}`,
          ),
          slots.default?.(),
        ],
      );
  },
});
const frame = (name, children) => h(Frame, { name }, () => children);
const items = [
  { key: 'product', label: 'Product', children: 'Cloud Database' },
  { key: 'billing', label: 'Billing', children: 'Prepaid' },
  { key: 'status', label: 'Status', children: 'Running' },
  { key: 'time', label: 'Expires', children: '2026-12-31' },
  { key: 'amount', label: 'Amount', children: '$80.00' },
  { key: 'region', label: 'Region', children: 'East 1' },
];
const description = (props = {}, slots) =>
  h(
    Descriptions,
    {
      title: 'Order details',
      items,
      ...props,
    },
    slots,
  );
const NativeEditor = defineComponent({
  setup: () => () =>
    h('input', {
      id: 'descriptions-editor',
      'aria-label': 'Description draft',
      value: 'Initial draft',
      style: { width: '100%', maxWidth: '220px', minWidth: 0, boxSizing: 'border-box' },
    }),
});
const editorItem = (span = 1) =>
  h(
    DescriptionsItem,
    { key: 'editor', span, label: 'Draft' },
    {
      label: () => [createCommentVNode('complete label'), h('strong', 'Draft'), ' label'],
      default: () => h(NativeEditor),
    },
  );
const completeSlots = () => ({
  title: () => [createCommentVNode('complete title'), h('strong', 'Native'), ' title', 0],
  extra: () => [h('button', { type: 'button' }, 'Refresh'), h('span', ' Extra tail')],
  default: () => [
    h(Fragment, [
      editorItem(),
      h(DescriptionsItem, { key: 'body', label: 'Value' }, () => [
        h('strong', 'Complete'),
        ' content',
        0,
      ]),
    ]),
    h(
      DescriptionsItem,
      { key: 'filled', label: 'Filled', span: 'filled' },
      () => 'Remaining columns',
    ),
  ],
});
const tokens = {
  labelBg: '#e5f0ff',
  labelColor: '#123456',
  titleColor: '#234567',
  titleMarginBottom: 31,
  itemPaddingBottom: 7,
  itemPaddingEnd: 9,
  colonMarginRight: 3,
  colonMarginLeft: 2,
  contentColor: '#345678',
  extraColor: '#456789',
};
const Geometry = defineComponent({
  setup() {
    const phase = ref(0),
      root = ref(null);
    onMounted(() => {
      window.descriptionsVisual = {
        async next() {
          phase.value++;
          await nextTick();
        },
        snapshot: () => ({
          root: root.value?.nativeElement === document.getElementById('descriptions-current'),
        }),
      };
    });
    return () =>
      frame('current-geometry', [
        h(
          Descriptions,
          {
            id: 'descriptions-current',
            ref: root,
            title: 'Preserved business draft',
            column: phase.value === 1 ? 1 : 2,
            bordered: phase.value > 1,
            layout: phase.value > 0 ? 'vertical' : 'horizontal',
          },
          {
            extra: () => h('span', 'Current geometry'),
            default: () => {
              const list = [
                h(DescriptionsItem, { key: 'account', label: 'Account' }, () => 'Apollo'),
                editorItem(phase.value > 1 ? 'filled' : 1),
                h(DescriptionsItem, { key: 'status', label: 'Status' }, () => 'Running'),
              ];
              return phase.value > 2 ? [list[2], list[1], list[0]] : list;
            },
          },
        ),
      ]);
  },
});
const CurrentProvider = defineComponent({
  setup() {
    const changed = ref(false),
      root = ref(null);
    onMounted(() => {
      window.descriptionsVisual = {
        async next() {
          changed.value = true;
          await nextTick();
        },
        snapshot: () => ({
          root: root.value?.nativeElement === document.getElementById('descriptions-current'),
        }),
      };
    });
    return () =>
      h(
        ConfigProvider,
        {
          direction: changed.value ? 'rtl' : 'ltr',
          componentSize: changed.value ? 'small' : 'large',
          components: {
            descriptions: {
              className: changed.value
                ? 'descriptions-provider-current'
                : 'descriptions-provider-before',
              classNames: ({ props }) => ({ label: `descriptions-label-${props.size}` }),
              style: { padding: '8px', border: '1px dashed var(--apollo-color-primary)' },
              styles: { label: { letterSpacing: changed.value ? '1px' : '0px' } },
            },
          },
          theme: { components: { Descriptions: changed.value ? tokens : {} } },
        },
        () =>
          frame('current-provider', [
            h(
              Descriptions,
              {
                id: 'descriptions-current',
                ref: root,
                column: 1,
                bordered: true,
                colon: !changed.value,
              },
              completeSlots(),
            ),
          ]),
      );
  },
});
const themed = (name, algorithm) =>
  h(ConfigProvider, { theme: { algorithm } }, () =>
    frame(name, [
      description({ bordered: true, column: { xs: 1, sm: 2, md: 3 } }),
      description({
        title: 'Plain current palette',
        column: { xs: 1, sm: 2, md: 3 },
        style: { marginTop: '24px' },
      }),
    ]),
  );

export default {
  basic: () => frame('basic', [description()]),
  bordered: () => frame('bordered', [description({ bordered: true })]),
  vertical: () => frame('vertical', [description({ layout: 'vertical' })]),
  'vertical-bordered': () =>
    frame('vertical-bordered', [description({ layout: 'vertical', bordered: true })]),
  sizes: () =>
    frame(
      'sizes',
      ['small', 'middle', 'large'].map((size) =>
        description({
          title: `${size} description fields`,
          size,
          column: 2,
          bordered: true,
          items: items.slice(0, 3),
          style: { marginBottom: '20px' },
        }),
      ),
    ),
  filled: () =>
    frame('filled', [
      description({
        title: 'Responsive spans and filled remainder',
        bordered: true,
        column: { xs: 1, sm: 2, md: 3 },
        items: [
          items[0],
          { ...items[1], span: 'filled' },
          { ...items[2], span: { xs: 1, sm: 2, md: 2 } },
          items[3],
        ],
      }),
    ]),
  'complete-content': () =>
    frame('complete-content', [h(Descriptions, { column: 2, bordered: true }, completeSlots())]),
  'empty-slots': () =>
    frame('empty-slots', [
      h(
        Descriptions,
        { title: 'Suppressed fallback', column: 1 },
        {
          title: () => [],
          extra: () => [],
          default: () => [
            h(
              DescriptionsItem,
              { key: 'empty', label: 'Suppressed label' },
              {
                label: () => [],
                default: () => [h('strong', 'Unlabelled value'), 0],
              },
            ),
            h(DescriptionsItem, { key: 'zero', label: 'Zero' }, () => 0),
          ],
        },
      ),
    ]),
  'current-geometry': () => h(Geometry),
  'current-provider': () => h(CurrentProvider),
  'semantic-tokens': () =>
    h(ConfigProvider, { theme: { components: { Descriptions: tokens } } }, () =>
      frame('semantic-tokens', [
        description(
          { title: 'All ten current tokens', column: 2, bordered: true },
          { extra: () => 'Current extra' },
        ),
        description({
          title: 'Colon and native root style',
          column: 2,
          items: items.slice(0, 3),
          style: [
            'padding: 8px',
            { border: '1px solid var(--apollo-color-border)', marginTop: '20px' },
          ],
          classNames: { content: 'descriptions-owned-content' },
          styles: { content: { fontWeight: 600 } },
        }),
      ]),
    ),
  nested: () =>
    frame('nested', [
      h(Descriptions, { title: 'Nested description owners', column: 1 }, () =>
        h(
          DescriptionsItem,
          {
            label: 'Outer label',
            styles: { label: { color: 'var(--apollo-color-text)', fontWeight: 600 } },
          },
          () =>
            description({
              title: 'Independent inner fields',
              bordered: true,
              column: 1,
              items: items.slice(0, 2),
            }),
        ),
      ),
    ]),
  'native-focus': () =>
    frame('native-focus', [
      h(
        'button',
        { type: 'button', id: 'descriptions-before', style: { marginBottom: '16px' } },
        'Before fields',
      ),
      h(Descriptions, { title: 'Native field keyboard focus', column: 1 }, () => editorItem()),
    ]),
  rtl: () =>
    h(ConfigProvider, { direction: 'rtl' }, () =>
      frame('rtl', [
        description({
          title: 'تفاصيل الطلب',
          column: 2,
          bordered: true,
          items: [
            { key: 'account', label: 'الحساب', children: 'Apollo' },
            { key: 'status', label: 'الحالة', children: 'نشط' },
          ],
        }),
      ]),
    ),
  'theme-dark': () => themed('theme-dark', darkAlgorithm),
  'theme-compact': () => themed('theme-compact', compactAlgorithm),
  'theme-dark-compact': () => themed('theme-dark-compact', [darkAlgorithm, compactAlgorithm]),
};
