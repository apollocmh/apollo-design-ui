import { compactAlgorithm, darkAlgorithm, ThemeProvider } from '@apollo-design/theme';
import { Collapse, CollapsePanel, ColorPicker, ConfigProvider } from '@apollo-design/ui';
import { computed, defineComponent, h, onMounted, onUnmounted, reactive, ref } from 'vue';

const algorithms = {
  default: undefined,
  dark: darkAlgorithm,
  compact: compactAlgorithm,
  both: [darkAlgorithm, compactAlgorithm],
};
export function createFixture(theme = 'default') {
  const state = reactive({
    active: ['keep', 'destroy', 'force'],
    controlled: ['a'],
    accept: false,
    changes: 0,
    updates: 0,
    itemClicks: 0,
    actions: 0,
    mounted: 0,
    unmounted: 0,
    prefix: 'apollo',
    size: 'middle',
    direction: 'ltr',
    motion: true,
    heading: 3,
    emptyIcon: false,
    show: true,
    tokenOverride: false,
    customPrefix: false,
    disabled: false,
    selectedColor: '#1677ff',
  });
  const native = ref(null);
  const Editor = defineComponent({
    props: { name: String },
    setup(props) {
      onMounted(() => state.mounted++);
      onUnmounted(() => state.unmounted++);
      return () =>
        h('label', [props.name, h('input', { 'data-editor': props.name, value: 'Initial' })]);
    },
  });
  const component = defineComponent({
    name: 'CollapseBrowserFixture',
    setup() {
      const client = ref(false);
      onMounted(() => {
        client.value = true;
      });
      const themeConfig = computed(() => ({
        algorithm: algorithms[theme],
        token: {
          motion: state.motion,
          ...(state.tokenOverride ? { padding: 22, paddingSM: 14, borderRadiusLG: 17 } : {}),
        },
        components: state.tokenOverride
          ? {
              Collapse: {
                headerPadding: '21px 22px',
                headerPaddingSM: '11px 12px',
                headerPaddingLG: '31px 32px',
                headerBg: 'rgb(1, 2, 3)',
                contentPadding: '25px 26px',
                contentPaddingSM: '15px',
                contentPaddingLG: '35px',
                contentBg: 'rgb(4, 5, 6)',
                borderlessContentPadding: '5px 6px 7px',
                borderlessContentBg: 'rgb(7, 8, 9)',
              },
            }
          : undefined,
      }));
      return () =>
        h(
          ConfigProvider,
          {
            prefixCls: state.prefix,
            componentSize: state.size,
            direction: state.direction,
            theme: themeConfig.value,
          },
          () =>
            h(
              'main',
              {
                style: {
                  color: 'var(--apollo-color-text)',
                  background: 'var(--apollo-color-bg-container)',
                  padding: '16px',
                  fontFamily: 'var(--apollo-font-family)',
                },
              },
              [
                h('h1', 'Collapse browser contracts'),
                h('button', { id: 'outside', type: 'button' }, 'Outside'),
                state.show
                  ? h(
                      Collapse,
                      {
                        id: 'lifetime',
                        collapsible: state.disabled ? 'disabled' : undefined,
                        ref: native,
                        activeKey: state.active,
                        'onUpdate:activeKey': (keys) => (state.active = keys),
                        destroyOnHidden: true,
                        headingLevel: state.heading,
                      },
                      () => [
                        h(
                          CollapsePanel,
                          {
                            key: 'keep',
                            header: 'Keep draft',
                            destroyOnHidden: false,
                            onItemClick: () => state.itemClicks++,
                          },
                          () => h(Editor, { name: 'keep' }),
                        ),
                        h(CollapsePanel, { key: 'destroy', header: 'Destroy draft' }, () =>
                          h(Editor, { name: 'destroy' }),
                        ),
                        h(
                          CollapsePanel,
                          { key: 'force', header: 'Forced draft', forceRender: true },
                          () => h(Editor, { name: 'force' }),
                        ),
                      ],
                    )
                  : null,
                h(Collapse, {
                  id: 'controlled',
                  activeKey: state.controlled,
                  items: [
                    { key: 'a', label: 'Controlled A', children: 'A' },
                    { key: 'b', label: 'Controlled B', children: 'B' },
                  ],
                  onChange: () => state.changes++,
                  'onUpdate:activeKey': (keys) => {
                    state.updates++;
                    if (state.accept) state.controlled = keys;
                  },
                }),
                h(
                  Collapse,
                  { id: 'custom', collapsible: 'icon' },
                  {
                    expandIcon: () => (state.emptyIcon ? null : [h('span', '+'), h('span', '0')]),
                    default: () =>
                      h(
                        CollapsePanel,
                        {
                          key: 'custom',
                          header: 'Custom icon',
                          prefixCls: state.customPrefix ? 'audit-collapse' : undefined,
                        },
                        {
                          extra: () =>
                            h(
                              'button',
                              {
                                class: 'extra-action',
                                type: 'button',
                                onClick: () => state.actions++,
                              },
                              'Save',
                            ),
                          default: () => h('input', { 'data-editor': 'custom', value: 'Custom' }),
                        },
                      ),
                  },
                ),
                h(Collapse, {
                  id: 'borderless',
                  bordered: false,
                  items: [{ key: 'a', label: 'Borderless', children: 'Background' }],
                  defaultActiveKey: 'a',
                }),
                h(ThemeProvider, {}, () =>
                  h(Collapse, {
                    id: 'reset',
                    size: 'middle',
                    items: [{ key: 'a', label: 'Explicit reset' }],
                  }),
                ),
                h('section', { id: 'picker' }, [
                  h('h2', 'Real ColorPicker presets'),
                  client.value
                    ? h(ColorPicker, {
                        open: true,
                        presets: [{ label: 'Brand colors', colors: ['#1677ff', '#52c41a'] }],
                        defaultValue: '#1677ff',
                        onChange: (color) => {
                          state.selectedColor = color.toHexString();
                        },
                      })
                    : null,
                ]),
              ],
            ),
        );
    },
  });
  return { component, state, native };
}
