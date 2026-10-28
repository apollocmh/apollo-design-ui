import { HomeOutlined, UserOutlined } from '@apollo-design/icons';
import { compactAlgorithm, darkAlgorithm, transformToken, useTheme } from '@apollo-design/theme';
import { Breadcrumb, BreadcrumbItem, BreadcrumbSeparator, ConfigProvider } from '@apollo-design/ui';
import { createTextVNode, defineComponent, Fragment, h, nextTick, onMounted, ref } from 'vue';

const Frame = defineComponent({
  props: { name: String },
  setup(props, { slots }) {
    const theme = useTheme();
    return () =>
      h(
        'main',
        {
          'data-breadcrumb-visual': props.name,
          style: {
            ...transformToken(theme.token.value).vars,
            position: 'relative',
            width: '100%',
            minHeight: '340px',
            boxSizing: 'border-box',
            padding: '16px',
            color: 'var(--apollo-color-text)',
            background: 'var(--apollo-color-bg-container)',
            fontFamily: 'var(--apollo-font-family)',
            fontSize: 'var(--apollo-font-size)',
          },
        },
        [
          h('h1', { style: { fontSize: '20px', margin: '0 0 20px' } }, `Breadcrumb ${props.name}`),
          slots.default?.(),
        ],
      );
  },
});
const frame = (name, children) => h(Frame, { name }, () => children);
const items = () => [
  { title: 'Home', href: '#home' },
  { title: 'Components', href: '#components' },
  { title: 'Breadcrumb' },
];
const crumb = (props = {}, slots = {}) =>
  h(Breadcrumb, { 'aria-label': 'Workspace path', items: items(), ...props }, slots);
const menu = () => ({
  items: [
    { key: 'relative', label: 'New product', path: '/new' },
    { key: 'explicit', label: 'Product archive', href: '#archive' },
    { key: 'disabled', label: 'Unavailable product', disabled: true },
  ],
});
const dropdownProps = {
  getPopupContainer: (trigger) => trigger.closest('[data-breadcrumb-visual]'),
};
const menuCrumb = (noTitle = false) =>
  crumb({
    items: [
      { title: 'Home', href: '#home' },
      { title: noTitle ? undefined : 'Products', href: '#products', menu: menu(), dropdownProps },
      { title: 'Current page' },
    ],
  });
const iconItems = () => [
  { title: h(HomeOutlined), href: '#home', 'aria-label': 'Home' },
  { title: [h(UserOutlined), h('span', 'Users')], href: '#users' },
  { title: 'Current user' },
];
const tokenValues = {
  itemColor: '#164c7e',
  lastItemColor: '#873800',
  linkColor: '#075621',
  linkHoverColor: '#61108c',
  separatorColor: '#754500',
  iconFontSize: 23,
  separatorMargin: 17,
};
const CurrentProvider = defineComponent({
  setup() {
    const updated = ref(false),
      root = ref(null);
    onMounted(() => {
      window.breadcrumbVisual = {
        async updateProvider() {
          updated.value = true;
          await nextTick();
        },
        snapshot: () => ({
          root: root.value?.nativeElement === document.getElementById('breadcrumb-current-root'),
        }),
      };
    });
    return () =>
      h(
        ConfigProvider,
        {
          direction: updated.value ? 'rtl' : 'ltr',
          theme: { components: { Breadcrumb: updated.value ? tokenValues : {} } },
          components: {
            breadcrumb: {
              separator: updated.value ? '›' : '/',
              dropdownIcon: h('b', { 'data-current-icon': '' }, updated.value ? '↓' : '⌄'),
              classNames: () => ({
                root: updated.value ? 'current-provider-after' : 'current-provider-before',
              }),
            },
          },
        },
        () =>
          frame('current-provider', [
            crumb({ id: 'breadcrumb-current-root', ref: root, items: iconItems() }),
            h(
              Breadcrumb,
              { 'aria-label': 'Native current path', style: { marginBlockStart: '24px' } },
              () => [
                h(BreadcrumbItem, null, () =>
                  h('input', {
                    id: 'breadcrumb-current-draft',
                    'aria-label': 'Current breadcrumb draft',
                    style: { width: '120px' },
                  }),
                ),
                h(BreadcrumbItem, { menu: menu(), dropdownProps }, () => 'Current menu'),
                h(BreadcrumbItem, { 'aria-current': 'page' }, () => 'Current page'),
              ],
            ),
          ]),
      );
  },
});
const ConditionalContent = defineComponent({
  setup() {
    const stage = ref(0);
    onMounted(() => {
      window.breadcrumbVisual = {
        async setStage(value) {
          stage.value = value;
          await nextTick();
        },
      };
    });
    return () =>
      frame('conditional-content', [
        h(
          Breadcrumb,
          { 'aria-label': 'Conditional native path' },
          {
            ...(stage.value < 2
              ? {
                  separator: () => (stage.value === 1 ? [] : h('b', '›')),
                  dropdownIcon: () => (stage.value === 1 ? [] : h('b', '↓')),
                }
              : {}),
            default: () => [
              h(BreadcrumbItem, { menu: menu(), dropdownProps }, () => [
                h('strong', 'Draft '),
                h('input', {
                  id: 'breadcrumb-conditional-draft',
                  'aria-label': 'Conditional breadcrumb draft',
                  style: { width: '120px' },
                }),
              ]),
              h(BreadcrumbItem, null, () => 'Current page'),
            ],
          },
        ),
      ]);
  },
});
const showcase = () => [
  crumb({ 'aria-label': 'User path', items: iconItems() }),
  h('div', { style: { marginBlockStart: '24px' } }, [menuCrumb()]),
];
const themed = (name, algorithm) =>
  h(ConfigProvider, { theme: { algorithm } }, () => frame(name, showcase()));
const rich = () => [h('strong', 'First'), h('em', ' tail'), 0];
const MultipleRoots = defineComponent(() => () => rich());

export default {
  basic: () => frame('basic', [crumb()]),
  'with-icon': () => frame('with-icon', [crumb({ items: iconItems() })]),
  separator: () => frame('separator', [crumb({ separator: '›' })]),
  'separator-item': () =>
    frame('separator-item', [
      crumb({
        separator: '',
        items: [
          { title: 'Location' },
          { type: 'separator', separator: ':' },
          { title: 'Components', href: '#components' },
          { type: 'separator' },
          { title: 'Breadcrumb' },
        ],
      }),
    ]),
  'with-params': () =>
    frame('with-params', [
      crumb({
        params: { id: 0, identifier: 42 },
        items: [
          { title: 'Users', path: 'users' },
          { title: 'User :id', path: ':id/:id' },
          { title: 'Record :identifier', path: ':identifier' },
        ],
      }),
    ]),
  overlay: () => frame('overlay', [menuCrumb()]),
  semantic: () =>
    frame('semantic', [
      crumb({
        classNames: {
          root: 'owned-breadcrumb-root',
          item: 'owned-breadcrumb-item',
          separator: 'owned-breadcrumb-separator',
        },
        style: [
          'padding: 12px',
          { border: '1px solid var(--apollo-color-border)', borderRadius: '8px' },
        ],
        styles: { item: { fontWeight: 600 }, separator: { fontWeight: 700 } },
      }),
    ]),
  rtl: () => h(ConfigProvider, { direction: 'rtl' }, () => frame('rtl', [menuCrumb()])),
  'complete-content': () =>
    frame('complete-content', [
      crumb({
        items: [
          { title: rich() },
          { title: h(Fragment, rich()) },
          { title: createTextVNode('Text node') },
          { title: h(MultipleRoots) },
        ],
      }),
      h(
        Breadcrumb,
        { 'aria-label': 'Native complete path', style: { marginBlockStart: '24px' } },
        () => [
          h(
            BreadcrumbItem,
            { id: 'breadcrumb-native-item', 'data-native-item': 'yes', style: 'padding: 2px' },
            () => rich(),
          ),
          h(
            BreadcrumbSeparator,
            { id: 'breadcrumb-native-separator', 'data-native-separator': 'yes' },
            () => h('b', '·'),
          ),
          h(BreadcrumbItem, { 'aria-current': 'page' }, () => 'Current page'),
        ],
      ),
    ]),
  'no-title-menu': () => frame('no-title-menu', [menuCrumb(true)]),
  'conditional-content': () => h(ConditionalContent),
  'current-provider': () => h(CurrentProvider),
  'keyboard-menu': () => frame('keyboard-menu', [menuCrumb()]),
  'native-focus': () =>
    frame('native-focus', [
      h(
        'button',
        { id: 'breadcrumb-before', type: 'button', style: { marginBlockEnd: '20px' } },
        'Before breadcrumb',
      ),
      menuCrumb(),
    ]),
  'theme-dark': () => themed('theme-dark', darkAlgorithm),
  'theme-compact': () => themed('theme-compact', compactAlgorithm),
  'theme-dark-compact': () => themed('theme-dark-compact', [darkAlgorithm, compactAlgorithm]),
};
