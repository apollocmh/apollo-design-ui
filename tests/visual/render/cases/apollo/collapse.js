import { compactAlgorithm, darkAlgorithm } from '@apollo-design/theme';
import { Collapse, CollapsePanel, ConfigProvider } from '@apollo-design/ui';
import { defineComponent, Fragment, h, nextTick, onMounted, ref } from 'vue';

const frame = (name, children) =>
  h(
    'main',
    {
      'data-collapse-visual': name,
      style: {
        width: '100%',
        boxSizing: 'border-box',
        minHeight: '260px',
        padding: '20px',
        color: 'var(--apollo-color-text)',
        background: 'var(--apollo-color-bg-container)',
        fontFamily: 'var(--apollo-font-family)',
        fontSize: 'var(--apollo-font-size)',
      },
    },
    [
      h('h1', { style: { fontSize: '20px', margin: '0 0 16px' } }, `Project panels: ${name}`),
      ...children,
    ],
  );
const editor = (id) =>
  h('input', {
    id,
    'aria-label': 'Panel draft',
    defaultValue: 'Initial draft',
    style: {
      width: '160px',
      maxWidth: '100%',
      boxSizing: 'border-box',
      padding: '5px',
      color: 'var(--apollo-color-text)',
      background: 'var(--apollo-color-bg-container)',
      border: '1px solid var(--apollo-color-border)',
    },
  });
const data = () => [
  {
    key: 'a',
    label: 'Project details',
    children: 'The project overview remains available while related sections are explored.',
  },
  {
    key: 'b',
    label: 'Review checklist',
    children: 'Review the content and keep the current draft.',
  },
  {
    key: 'c',
    label: 'Archived section',
    children: 'This section cannot be opened.',
    collapsible: 'disabled',
  },
];
const list = (props = {}, slots) =>
  h(Collapse, { headingLevel: 2, items: data(), defaultActiveKey: ['a'], ...props }, slots);
const themed = (name, algorithm) =>
  h(ConfigProvider, { theme: { algorithm } }, () => frame(name, [list()]));
const Retained = defineComponent({
  setup() {
    const keys = ref(['a']);
    onMounted(() => {
      window.collapseVisual = {
        async close() {
          keys.value = [];
          await nextTick();
        },
        async open() {
          keys.value = ['a'];
          await nextTick();
        },
      };
    });
    return () =>
      frame('retained-content', [
        list({
          id: 'collapse-retained',
          activeKey: keys.value,
          items: [
            { key: 'a', label: 'Retained editor', children: editor('collapse-retained-draft') },
          ],
        }),
      ]);
  },
});
const CurrentProvider = defineComponent({
  setup() {
    const current = ref(false);
    onMounted(() => {
      window.collapseVisual = {
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
            collapse: {
              className: current.value ? 'collapse-current' : 'collapse-initial',
              styles: { header: { padding: current.value ? '18px' : '8px' } },
            },
          },
        },
        () =>
          frame('current-provider', [
            list({
              id: 'collapse-current',
              items: [
                {
                  key: 'a',
                  label: 'Current configuration',
                  children: editor('collapse-provider-draft'),
                },
              ],
            }),
          ]),
      );
  },
});
const ControlledRejected = defineComponent({
  setup() {
    const requests = ref(0);
    return () =>
      frame('controlled-rejected', [
        list({
          id: 'collapse-controlled',
          activeKey: ['a'],
          'onUpdate:activeKey': () => requests.value++,
        }),
        h('output', { id: 'collapse-requests' }, `Requests: ${requests.value}`),
      ]);
  },
});

export default {
  basic: () => frame('basic', [list()]),
  accordion: () => frame('accordion', [list({ accordion: true, defaultActiveKey: ['a', 'b'] })]),
  borderless: () => frame('borderless', [list({ bordered: false, defaultActiveKey: ['a', 'b'] })]),
  ghost: () => frame('ghost', [list({ ghost: true, defaultActiveKey: ['a', 'b'] })]),
  sizes: () =>
    frame(
      'sizes',
      ['small', 'middle', 'large'].map((size) =>
        h('section', { style: { marginBlockEnd: '16px' } }, [
          list({
            size,
            items: [{ key: 'a', label: `Size: ${size}`, children: 'Current size spacing' }],
          }),
        ]),
      ),
    ),
  'declared-panels': () =>
    frame('declared-panels', [
      h(
        Collapse,
        { headingLevel: 2, defaultActiveKey: ['declared'] },
        {
          default: () => [
            h(
              CollapsePanel,
              { key: 'declared', header: 'Fallback title', 'data-owned-panel': '' },
              {
                header: () => h('span', ['Declared ', h('strong', 'Panel')]),
                extra: () => h('button', { type: 'button' }, 'Independent action'),
                default: () => editor('collapse-declared-draft'),
              },
            ),
            h(
              CollapsePanel,
              { key: 'second', header: 'Second declared Panel' },
              () => 'Native composition',
            ),
          ],
        },
      ),
    ]),
  'complete-content': () =>
    frame('complete-content', [
      list({
        defaultActiveKey: ['a', 'b'],
        items: [
          {
            key: 'a',
            label: 0,
            children: h(Fragment, null, ['Complete ', h('strong', 'body'), ' ', 0]),
          },
          {
            key: 'b',
            label: 'Independent extra region',
            extra: h('button', { type: 'button' }, 'More'),
            children: editor('collapse-content-draft'),
          },
        ],
      }),
    ]),
  'retained-content': () => h(Retained),
  'controlled-rejected': () => h(ControlledRejected),
  'current-provider': () => h(CurrentProvider),
  'icon-slot': () =>
    frame('icon-slot', [
      list(
        { collapsible: 'icon', expandIconPlacement: 'end' },
        { expandIcon: ({ isActive }) => h('span', isActive ? '−' : '+') },
      ),
    ]),
  nested: () =>
    frame('nested', [
      list({
        items: [
          {
            key: 'a',
            label: 'Parent section',
            children: h(Collapse, {
              defaultActiveKey: ['child'],
              items: [
                {
                  key: 'child',
                  label: 'Nested section',
                  children: 'The heading belongs to its owning parent.',
                },
              ],
            }),
          },
        ],
      }),
    ]),
  'semantic-tokens': () =>
    h(
      ConfigProvider,
      {
        theme: {
          components: {
            Collapse: {
              headerPadding: '20px',
              headerBg: '#e6f4ff',
              contentPadding: '24px',
              contentBg: '#f0f5ff',
            },
          },
        },
      },
      () => frame('semantic-tokens', [list({ id: 'collapse-token' })]),
    ),
  rtl: () =>
    h(ConfigProvider, { direction: 'rtl' }, () =>
      frame('rtl', [list({ expandIconPlacement: 'end' })]),
    ),
  'native-focus': () =>
    frame('native-focus', [
      h('button', { id: 'collapse-before', type: 'button' }, 'Before panels'),
      h('div', { style: { marginBlockStart: '16px' } }, [list({ id: 'collapse-focus' })]),
    ]),
  'theme-dark': () => themed('theme-dark', darkAlgorithm),
  'theme-compact': () => themed('theme-compact', compactAlgorithm),
  'theme-dark-compact': () => themed('theme-dark-compact', [darkAlgorithm, compactAlgorithm]),
};
