import { compactAlgorithm, darkAlgorithm } from '@apollo-design/theme';
import {
  Button,
  ConfigProvider,
  Divider,
  Input,
  Select,
  Space,
  SpaceAddon,
  SpaceCompact,
} from '@apollo-design/ui';
import { defineComponent, Fragment, h, nextTick, onMounted, ref } from 'vue';

const frame = (name, children) =>
  h(
    'main',
    {
      'data-space-visual-case': name,
      style: {
        width: '100%',
        minHeight: '280px',
        padding: '16px',
        boxSizing: 'border-box',
        color: 'var(--apollo-color-text)',
        background: 'var(--apollo-color-bg-container)',
        fontFamily: 'var(--apollo-font-family)',
        fontSize: 'var(--apollo-font-size)',
      },
    },
    [
      h('h1', { style: { fontSize: '20px', margin: '0 0 12px' } }, 'Workspace controls'),
      h('p', { style: { margin: '0 0 16px' } }, name),
      ...children,
    ],
  );
const button = (text, props = {}) => h(Button, props, () => text);
const actions = () => [
  button('Save', { type: 'primary' }),
  button('Cancel'),
  button('More', { type: 'text' }),
];
const row = (props = {}, slots) =>
  h(Space, { id: 'space-main', ...props }, slots ?? (() => actions()));
const compact = (props = {}) =>
  h(SpaceCompact, { id: 'space-compact', block: true, ...props }, () => [
    h(SpaceAddon, null, () => '$'),
    h(Input, {
      'aria-label': 'Business amount',
      placeholder: 'Amount',
      style: { flex: 1, minWidth: 0 },
    }),
    button('Save', { type: 'primary' }),
  ]);
const themed = (name, algorithm) =>
  h(ConfigProvider, { theme: { algorithm } }, () =>
    frame(name, [row({ wrap: true }), h('div', { style: { marginTop: '16px' } }, [compact()])]),
  );
const CurrentProvider = defineComponent({
  setup() {
    const current = ref(false);
    onMounted(() => {
      window.spaceVisual = {
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
          components: {
            space: {
              size: current.value ? 20 : 8,
              className: current.value ? 'provider-current' : 'provider-initial',
              styles: {
                item: {
                  padding: current.value ? '8px' : '2px',
                  background: 'var(--apollo-color-fill-secondary)',
                },
              },
            },
          },
        },
        () =>
          frame('current-provider', [
            row({ wrap: true }, () => [
              h(Input, {
                id: 'space-draft',
                'aria-label': 'Persistent draft',
                defaultValue: 'Draft',
                style: { width: '150px' },
              }),
              button('Save'),
            ]),
          ]),
      );
  },
});
const KeyedFragments = defineComponent({
  setup() {
    const reverse = ref(false);
    const keys = [Symbol('a'), Symbol('b')];
    onMounted(() => {
      window.spaceVisual = {
        async update() {
          reverse.value = true;
          await nextTick();
        },
      };
    });
    return () =>
      frame('keyed-fragments', [
        row({ orientation: 'vertical', align: 'start' }, () => {
          const groups = keys.map((key, index) =>
            h(Fragment, { key }, [
              h(Input, {
                key: 'editor',
                id: `space-draft-${index}`,
                'aria-label': `Keyed draft ${index}`,
                defaultValue: `Group ${index}`,
              }),
            ]),
          );
          return reverse.value ? groups.reverse() : groups;
        }),
      ]);
  },
});

export default {
  default: () => frame('default', [row({ wrap: true })]),
  vertical: () =>
    frame('vertical', [row({ orientation: 'vertical', align: 'start', size: 'large' })]),
  'size-presets': () =>
    frame('size-presets', [
      h(Space, { orientation: 'vertical', size: 'large' }, () =>
        ['small', 'middle', 'large'].map((size) =>
          row({ size, wrap: true }, () => [button(size), button('Gap')]),
        ),
      ),
    ]),
  wrap: () =>
    frame('wrap', [
      row({ wrap: true, size: [8, 16], style: { maxWidth: '320px' } }, () =>
        Array.from({ length: 9 }, (_, index) => button(`Action ${index + 1}`)),
      ),
    ]),
  ...Object.fromEntries(
    ['start', 'end', 'center', 'baseline'].map((align) => [
      `align-${align}`,
      () =>
        frame(`align-${align}`, [
          row({ align, wrap: true }, () => [
            button('Action'),
            h(
              'div',
              { style: { padding: '24px 12px', background: 'var(--apollo-color-fill-secondary)' } },
              'Tall content',
            ),
            h('span', 'Label'),
          ]),
        ]),
    ]),
  ),
  'separator-data': () =>
    frame('separator-data', [
      row({ separator: [h('strong', '·'), 0] }, () => [
        button('First'),
        button('Second'),
        button('Third'),
      ]),
    ]),
  'separator-slot': () =>
    frame('separator-slot', [
      row(
        {},
        {
          default: () => [button('First'), button('Second')],
          separator: () => h(Divider, { orientation: 'vertical' }),
        },
      ),
    ]),
  'empty-slot': () =>
    frame('empty-slot', [
      row(
        { separator: 'hidden' },
        { default: () => [button('First'), button('Second')], separator: () => [] },
      ),
    ]),
  semantic: () =>
    frame('semantic', [
      row({
        separator: '|',
        wrap: true,
        classNames: { root: 'owned-root', item: 'owned-item', separator: 'owned-separator' },
        styles: {
          root: { padding: '12px', border: '1px dashed var(--apollo-color-border)' },
          item: { padding: '4px', background: 'var(--apollo-color-fill-secondary)' },
          separator: { fontWeight: 600, color: 'var(--apollo-color-primary-text)' },
        },
      }),
    ]),
  compact: () => frame('compact', [compact()]),
  'compact-vertical': () =>
    frame('compact-vertical', [
      h(SpaceCompact, { orientation: 'vertical', id: 'space-compact' }, () => [
        h(SpaceAddon, null, () => 'First'),
        h(SpaceAddon, null, () => 'Middle'),
        h(SpaceAddon, null, () => 'Last'),
      ]),
      h('div', { style: { marginTop: '16px' } }, [
        h(SpaceCompact, { orientation: 'vertical' }, () => [
          button('Save', { type: 'primary' }),
          button('Cancel'),
          button('Disabled', { disabled: true }),
        ]),
      ]),
    ]),
  'compact-nested': () =>
    frame('compact-nested', [
      h(SpaceCompact, { id: 'space-compact', block: true }, () => [
        h(SpaceCompact, { style: { flex: 1, minWidth: 0 } }, () => [
          h(SpaceAddon, null, () => 'https://'),
          h(Input, {
            'aria-label': 'Nested site',
            defaultValue: 'example',
            style: { minWidth: 0 },
          }),
        ]),
        h(Select, {
          'aria-label': 'Domain',
          options: [{ value: 'com', label: '.com' }],
          defaultValue: 'com',
          style: { width: '76px' },
        }),
        button('Go'),
      ]),
    ]),
  'addon-variants': () =>
    frame('addon-variants', [
      h(Space, { orientation: 'vertical' }, () =>
        ['outlined', 'filled', 'borderless', 'underlined'].map((variant) =>
          h(Space, { wrap: true }, () =>
            ['', 'error', 'warning'].map((status) =>
              h(
                SpaceAddon,
                { variant, status, style: { paddingBlock: '6px' } },
                () => `${variant} ${status || 'normal'}`,
              ),
            ),
          ),
        ),
      ),
    ]),
  'addon-single': () =>
    frame('addon-single', [
      h(SpaceCompact, { id: 'space-single' }, () =>
        h(SpaceAddon, { style: { paddingBlock: '8px' } }, () => 'All four outer corners'),
      ),
    ]),
  rtl: () =>
    h(ConfigProvider, { direction: 'rtl' }, () =>
      frame('rtl', [row({ wrap: true }), h('div', { style: { marginTop: '16px' } }, [compact()])]),
    ),
  'current-provider': () => h(CurrentProvider),
  'keyed-fragments': () => h(KeyedFragments),
  'theme-dark': () => themed('theme-dark', darkAlgorithm),
  'theme-compact': () => themed('theme-compact', compactAlgorithm),
  'theme-dark-compact': () => themed('theme-dark-compact', [darkAlgorithm, compactAlgorithm]),
  'theme-alias': () =>
    h(
      ConfigProvider,
      {
        theme: {
          token: {
            paddingXS: 19,
            colorText: '#224466',
            colorBgContainer: '#ffffff',
            colorBgContainerDisabled: '#e8f0f8',
          },
        },
      },
      () =>
        frame('theme-alias', [
          row({ wrap: true }),
          h('div', { style: { marginTop: '16px' } }, [compact()]),
        ]),
    ),
  'native-focus': () =>
    frame('native-focus', [
      button('Before input', { id: 'space-before' }),
      row({ style: { display: 'flex', marginTop: '16px' } }, () => [
        h(Input, { id: 'space-draft', 'aria-label': 'Focused draft' }),
        button('Save'),
      ]),
    ]),
};
