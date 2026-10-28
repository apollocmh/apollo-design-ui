import { compactAlgorithm, darkAlgorithm, transformToken, useTheme } from '@apollo-design/theme';
import {
  ConfigProvider,
  Layout,
  LayoutContent,
  LayoutFooter,
  LayoutHeader,
  LayoutSider,
  Menu,
} from '@apollo-design/ui';
import { defineComponent, h, nextTick, onMounted, ref } from 'vue';

const menuStyle = {
  '--apollo-menu-item-selected-color': 'var(--apollo-color-text)',
  '--apollo-menu-item-selected-bg': 'var(--apollo-color-primary-bg)',
  '--apollo-menu-dark-item-selected-color': 'var(--apollo-color-text)',
  '--apollo-menu-dark-item-selected-bg': 'var(--apollo-color-primary-bg)',
};
const Scenario = defineComponent({
  props: { name: { type: String, required: true } },
  setup(props) {
    const theme = useTheme(),
      stage = ref(0),
      root = ref(null),
      sider = ref(null),
      collapsed = ref(false);
    const events = [];
    onMounted(() => {
      window.layoutVisual = {
        async next() {
          stage.value++;
          await nextTick();
          await nextTick();
        },
        snapshot: () => ({
          root: root.value?.nativeElement === document.getElementById('layout-visual-root'),
          sider: sider.value?.nativeElement === document.getElementById('layout-visual-sider'),
          events: [...events],
        }),
      };
    });
    const input = () =>
      h('label', { style: { display: 'block', marginTop: '12px' } }, [
        'Layout draft',
        h('input', {
          id: 'layout-visual-draft',
          'aria-label': 'Layout draft',
          defaultValue: 'Original draft',
          style: {
            display: 'block',
            width: '100%',
            minWidth: 0,
            boxSizing: 'border-box',
            padding: '4px',
            background: 'var(--apollo-color-bg-container)',
            color: 'var(--apollo-color-text)',
            border: '1px solid var(--apollo-color-border)',
          },
        }),
      ]);
    const content = () => [
      h('h2', { style: { fontSize: '16px', margin: 0 } }, 'Content'),
      h('p', 'Current layout content'),
      input(),
    ];
    const nav = () =>
      h(Menu, {
        mode: 'inline',
        theme: props.name === 'side-light' ? 'light' : 'dark',
        items: [
          { key: 'home', label: 'Home' },
          { key: 'files', label: 'Files' },
          { key: 'team', label: 'Team' },
        ],
        defaultSelectedKeys: ['files'],
        style: menuStyle,
      });
    return () => {
      const name = props.name,
        current = name === 'current-provider',
        conditional = name === 'conditional-trigger',
        responsive = name === 'responsive';
      const toggle = [
        'collapsible',
        'collapsed',
        'zero-width',
        'keyboard-trigger',
        'native-focus',
        'conditional-trigger',
        'current-provider',
        'rtl',
      ].includes(name);
      const fullHeight = toggle || responsive;
      const side = () =>
        h(
          LayoutSider,
          {
            id: 'layout-visual-sider',
            ref: sider,
            width: current && stage.value ? 144 : 128,
            theme: name === 'side-light' ? 'light' : 'dark',
            collapsible: toggle,
            collapsed: responsive
              ? collapsed.value
              : name === 'collapsed' || name === 'zero-width'
                ? true
                : undefined,
            collapsedWidth: name === 'zero-width' || name === 'rtl' || responsive ? 0 : 72,
            breakpoint: responsive ? 'lg' : undefined,
            trigger: conditional ? [h('strong', 'Data'), 0] : undefined,
            'onUpdate:collapsed': (value) => {
              if (responsive) collapsed.value = value;
            },
            onCollapse: (value, type) => events.push([value, type]),
          },
          {
            default: nav,
            ...(conditional && stage.value % 3 !== 0
              ? { trigger: () => (stage.value % 3 === 1 ? [] : [h('strong', 'Slot'), 0]) }
              : {}),
          },
        );
      const header = () => h(LayoutHeader, null, () => 'Workspace');
      const footer = () => h(LayoutFooter, null, () => 'Apollo Design');
      const children = () =>
        name === 'basic'
          ? [header(), h(LayoutContent, { style: { padding: '12px' } }, content), footer()]
          : [
              side(),
              h(Layout, null, () => [
                header(),
                h(LayoutContent, { style: { padding: '12px' } }, content),
                footer(),
              ]),
            ];
      const structural = () =>
        name === 'standalone'
          ? [
              header(),
              h('div', { style: { display: 'flex', minHeight: '220px' } }, [
                side(),
                h(LayoutContent, { style: { padding: '12px', minWidth: 0 } }, content),
              ]),
              footer(),
            ]
          : h(
              Layout,
              {
                id: 'layout-visual-root',
                ref: root,
                style:
                  name === 'native-styles'
                    ? [
                        'height:calc(100% - 40px)',
                        { border: '2px solid var(--apollo-color-primary)', padding: '8px' },
                      ]
                    : { height: 'calc(100% - 40px)' },
              },
              children,
            );
      return h(
        ConfigProvider,
        {
          direction: name === 'rtl' || (current && stage.value) ? 'rtl' : 'ltr',
          components:
            current && stage.value
              ? { layout: { className: 'layout-provider-after', style: { padding: '4px' } } }
              : {},
          theme: current
            ? {
                components: {
                  Layout: stage.value ? { headerHeight: 70, headerBg: 'rgb(22, 76, 126)' } : {},
                },
              }
            : undefined,
        },
        () =>
          h(
            'div',
            {
              'data-layout-visual': name,
              style: {
                ...transformToken(theme.token.value).vars,
                width: '100%',
                height: fullHeight ? 'calc(100vh - 32px)' : '420px',
                boxSizing: 'border-box',
                background: 'var(--apollo-color-bg-container)',
                color: 'var(--apollo-color-text)',
                fontFamily: 'var(--apollo-font-family)',
                fontSize: 'var(--apollo-font-size)',
                lineHeight: 'var(--apollo-line-height)',
              },
            },
            [
              h(
                'h1',
                { style: { fontSize: '18px', lineHeight: '24px', margin: '0 0 16px' } },
                'Layout ' + name,
              ),
              structural(),
            ],
          ),
      );
    };
  },
});
const render = (name, algorithm) =>
  h(ConfigProvider, { theme: { algorithm } }, () => h(Scenario, { name }));
export default {
  basic: () => render('basic'),
  side: () => render('side'),
  'side-light': () => render('side-light'),
  collapsible: () => render('collapsible'),
  collapsed: () => render('collapsed'),
  'zero-width': () => render('zero-width'),
  standalone: () => render('standalone'),
  responsive: () => render('responsive'),
  rtl: () => render('rtl'),
  'current-provider': () => render('current-provider'),
  'conditional-trigger': () => render('conditional-trigger'),
  'keyboard-trigger': () => render('keyboard-trigger'),
  'native-focus': () => render('native-focus'),
  'native-styles': () => render('native-styles'),
  'theme-dark': () => render('theme-dark', darkAlgorithm),
  'theme-compact': () => render('theme-compact', compactAlgorithm),
  'theme-dark-compact': () => render('theme-dark-compact', [darkAlgorithm, compactAlgorithm]),
};
