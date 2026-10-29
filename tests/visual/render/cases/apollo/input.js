import { compactAlgorithm, darkAlgorithm } from '@apollo-design/theme';
import {
  ConfigProvider,
  Input,
  InputGroup,
  InputOTP,
  InputPassword,
  InputSearch,
  TextArea,
} from '@apollo-design/ui';
import { defineComponent, h, nextTick, onMounted, ref } from 'vue';

const frame = (name, children) =>
  h(
    'main',
    {
      'data-input-visual': name,
      style: {
        width: '100%',
        boxSizing: 'border-box',
        minHeight: '280px',
        padding: '20px',
        color: 'var(--apollo-color-text)',
        background: 'var(--apollo-color-bg-container)',
        fontFamily: 'var(--apollo-font-family)',
        fontSize: 'var(--apollo-font-size)',
      },
    },
    [
      h('h1', { style: { fontSize: '20px', margin: '0 0 16px' } }, `Project fields: ${name}`),
      ...children,
    ],
  );
const field = (name, component = Input, props = {}, slots) =>
  h('section', { style: { marginBlockEnd: '18px', minWidth: 0 } }, [
    h('h2', { style: { fontSize: '15px', fontWeight: 500, margin: '0 0 8px' } }, name),
    h(
      component,
      { 'aria-label': name, style: { width: '280px', maxWidth: '100%' }, ...props },
      slots,
    ),
  ]);
const samples = () => [
  field('Project name', Input, { defaultValue: 'Apollo workspace', allowClear: true }),
  field('Over-limit code', Input, { defaultValue: 'Over limit', count: { max: 3, show: true } }),
  field('Search projects', InputSearch, { defaultValue: 'Design', enterButton: 'Search' }),
  field('Project notes', TextArea, {
    defaultValue: 'Keep the current draft.\nReview the next section.',
    rows: 2,
    showCount: true,
  }),
  field('Access code', InputOTP, {
    defaultValue: '123456',
    length: 6,
    style: { maxWidth: '100%' },
  }),
];
const themed = (name, algorithm) =>
  h(ConfigProvider, { theme: { algorithm } }, () => frame(name, samples()));
const CurrentProvider = defineComponent({
  setup() {
    const current = ref(false);
    onMounted(() => {
      window.inputVisual = {
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
          variant: current.value ? 'filled' : 'outlined',
          theme: { token: { fontSize: current.value ? 18 : 14 } },
        },
        () =>
          frame('current-provider', [
            field('Current provider draft', Input, {
              id: 'input-provider-draft',
              defaultValue: 'Draft',
            }),
          ]),
      );
  },
});
const DynamicWrappers = defineComponent({
  setup() {
    const decorated = ref(false);
    onMounted(() => {
      window.inputVisual = {
        async update() {
          decorated.value = true;
          await nextTick();
        },
      };
    });
    return () =>
      frame('dynamic-wrappers', [
        field('Stable uncontrolled draft', Input, {
          id: 'input-dynamic-draft',
          defaultValue: 'Draft',
          allowClear: decorated.value,
          addonBefore: decorated.value ? h('span', 'https://') : undefined,
          suffix: decorated.value ? 0 : undefined,
        }),
      ]);
  },
});
const Rejected = defineComponent({
  setup() {
    const requests = ref(0);
    return () =>
      frame('controlled-rejected', [
        field('Controlled approval', Input, {
          id: 'input-controlled',
          value: 'Approved',
          'onUpdate:value': () => requests.value++,
        }),
        h('output', { id: 'input-requests' }, `Requests: ${requests.value}`),
      ]);
  },
});
const Resized = defineComponent({
  setup() {
    const reported = ref(null);
    onMounted(() => {
      window.inputVisual = { reported: () => reported.value };
    });
    return () =>
      frame('textarea-resize', [
        field('Resizable notes', TextArea, {
          id: 'input-resizable',
          defaultValue: 'A real native resize keeps this draft.',
          rows: 2,
          autoSize: false,
          onResize: (size) => {
            reported.value = size;
          },
        }),
      ]);
  },
});

export default {
  basic: () =>
    frame('basic', [
      field('Project name', Input, { defaultValue: 'Apollo workspace' }),
      field('Empty project name', Input, { placeholder: 'Enter a project name' }),
    ]),
  sizes: () =>
    frame(
      'sizes',
      ['small', 'middle', 'large'].map((size) =>
        field(`Size ${size}`, Input, { size, defaultValue: 'Project field', allowClear: true }),
      ),
    ),
  variants: () =>
    frame(
      'variants',
      ['outlined', 'filled', 'borderless', 'underlined'].map((variant) =>
        field(`Variant ${variant}`, Input, { variant, defaultValue: 'Visible field boundary' }),
      ),
    ),
  status: () =>
    frame(
      'status',
      ['error', 'warning'].map((status) =>
        field(`Status ${status}`, Input, {
          status,
          defaultValue: 'Review required',
          allowClear: true,
        }),
      ),
    ),
  affixes: () =>
    frame('affixes', [
      field(
        'Complete affixes',
        Input,
        { defaultValue: 'Business value' },
        { prefix: () => [h('strong', 'ID'), 0], suffix: () => h('span', 'units') },
      ),
      field(
        'Empty suffix slot',
        Input,
        { defaultValue: 'The empty slot wins', suffix: 'Fallback' },
        { suffix: () => [] },
      ),
    ]),
  addons: () =>
    frame('addons', [
      field('Site address', Input, {
        defaultValue: 'apollo.design',
        addonBefore: h('span', 'https://'),
        addonAfter: h('span', '.org'),
      }),
      field('Zero addon', Input, { defaultValue: 'A real zero', addonBefore: 0 }),
    ]),
  clear: () =>
    frame('clear', [
      field('Clear project', Input, { id: 'input-clear', defaultValue: 'Draft', allowClear: true }),
      field('Zero clear glyph', Input, {
        defaultValue: 'Keep zero content',
        allowClear: { clearIcon: 0 },
      }),
      field('Text clear glyph', Input, {
        defaultValue: 'Named native clear action',
        allowClear: { clearIcon: h('span', 'Clear') },
      }),
    ]),
  count: () =>
    frame('count', [
      field('Project code', Input, { defaultValue: 'Apollo', maxLength: 12, showCount: true }),
      field('Code point count', Input, {
        defaultValue: 'Hi😀',
        count: { max: 8, show: true, strategy: (value) => Array.from(value).length },
      }),
      field('Over-limit project code', Input, {
        defaultValue: 'Over limit',
        count: { max: 3, show: true },
      }),
      field('Over-limit project notes', TextArea, {
        defaultValue: 'Over limit',
        rows: 2,
        count: { max: 3, show: true },
      }),
    ]),
  'disabled-readonly': () =>
    frame('disabled-readonly', [
      field('Disabled project', Input, {
        defaultValue: 'Disabled',
        disabled: true,
        allowClear: true,
      }),
      field('Read only project', Input, {
        defaultValue: 'Read only',
        readOnly: true,
        allowClear: true,
      }),
    ]),
  password: () =>
    frame('password', [
      field('Password', InputPassword, { id: 'input-password', defaultValue: 'SecureDraft7' }),
      field('Read only password', InputPassword, { defaultValue: 'ReadOnly7', readOnly: true }),
    ]),
  'password-icon': () =>
    frame('password-icon', [
      field(
        'Custom visibility',
        InputPassword,
        { id: 'input-password-slot', defaultValue: 'NativeSlot7' },
        { icon: ({ visible }) => h('span', visible ? 'Hide' : 'Show') },
      ),
      field(
        'Zero visibility glyph',
        InputPassword,
        { defaultValue: 'ZeroSlot7' },
        { icon: () => 0 },
      ),
    ]),
  search: () =>
    frame('search', [
      field('Search projects', InputSearch, {
        id: 'input-search',
        defaultValue: 'Apollo',
        enterButton: 'Search',
      }),
      field('Email search', InputSearch, {
        type: 'email',
        defaultValue: 'team@example.test',
        enterButton: true,
      }),
    ]),
  'search-loading': () =>
    frame('search-loading', [
      field('Loading search', InputSearch, {
        defaultValue: 'In progress',
        enterButton: 'Search',
        loading: true,
      }),
      field('Disabled search', InputSearch, {
        defaultValue: 'Unavailable',
        enterButton: true,
        disabled: true,
      }),
    ]),
  textarea: () =>
    frame('textarea', [
      field('Project notes', TextArea, {
        defaultValue: 'Keep the first line.\nReview the second line.',
        rows: 3,
        allowClear: true,
        showCount: true,
      }),
    ]),
  'textarea-autosize': () =>
    frame('textarea-autosize', [
      field('Growing notes', TextArea, {
        id: 'input-autosize',
        defaultValue: 'One line',
        autoSize: { minRows: 2, maxRows: 5 },
      }),
    ]),
  'textarea-resize': () => h(Resized),
  otp: () =>
    frame('otp', [
      field('Verification code', InputOTP, {
        id: 'input-otp',
        length: 6,
        defaultValue: '12',
        style: { maxWidth: '100%' },
      }),
    ]),
  'otp-mask': () =>
    frame('otp-mask', [
      field('Masked verification', InputOTP, {
        length: 4,
        defaultValue: '1234',
        mask: true,
        style: { maxWidth: '100%' },
      }),
    ]),
  'otp-separator': () =>
    frame('otp-separator', [
      field(
        'Grouped code',
        InputOTP,
        { length: 4, defaultValue: '1357', style: { maxWidth: '100%' } },
        { separator: ({ index }) => (index === 1 ? h('span', '—') : null) },
      ),
    ]),
  'compact-group': () =>
    frame('compact-group', [
      h(InputGroup, { compact: true, style: { width: '100%', maxWidth: '480px' } }, () => [
        h(Input, { 'aria-label': 'City code', defaultValue: '0571', style: { width: '30%' } }),
        h(Input, {
          'aria-label': 'Phone number',
          defaultValue: '12345678',
          style: { width: '70%' },
        }),
      ]),
    ]),
  'current-provider': () => h(CurrentProvider),
  'controlled-rejected': () => h(Rejected),
  'dynamic-wrappers': () => h(DynamicWrappers),
  'native-focus': () =>
    frame('native-focus', [
      h('button', { id: 'input-before', type: 'button' }, 'Before field'),
      field('Keyboard draft', Input, {
        id: 'input-focus',
        defaultValue: 'Focus remains visible',
        allowClear: true,
      }),
    ]),
  rtl: () =>
    h(ConfigProvider, { direction: 'rtl' }, () =>
      frame('rtl', [
        field('RTL amount', Input, {
          defaultValue: '128',
          prefix: '¥',
          suffix: '元',
          allowClear: true,
        }),
        field('RTL search', InputSearch, { defaultValue: 'Project', enterButton: 'Search' }),
      ]),
    ),
  'theme-dark': () => themed('theme-dark', darkAlgorithm),
  'theme-compact': () => themed('theme-compact', compactAlgorithm),
  'theme-dark-compact': () => themed('theme-dark-compact', [darkAlgorithm, compactAlgorithm]),
};
