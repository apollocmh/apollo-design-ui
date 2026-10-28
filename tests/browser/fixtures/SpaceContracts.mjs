import 'virtual:space-styles';
import { compactAlgorithm, darkAlgorithm, ThemeProvider } from '@apollo-design/theme';
import {
  Button,
  ConfigProvider,
  Input,
  Select,
  Space,
  SpaceAddon,
  SpaceCompact,
} from '@apollo-design/ui';
import {
  createApp,
  createSSRApp,
  defineComponent,
  Fragment,
  h,
  nextTick,
  onMounted,
  reactive,
} from 'vue';

export const Audit = defineComponent({
  name: 'SpaceContracts',
  props: { mode: { type: String, default: 'default' }, custom: { type: Boolean, default: false } },
  setup(props) {
    const state = reactive({
      theme: props.mode,
      custom: props.custom,
      vertical: false,
      rtl: false,
      disabled: false,
      demo: '',
      reversed: false,
      customPrefix: false,
      nativeSelector: false,
      addonVariant: 'outlined',
      addonStatus: '',
      addonDisabled: false,
      addonSize: 'middle',
      addonAlias: false,
    });
    const editorKeys = [Symbol('group-a'), Symbol('group-b')];
    const addonProps = (props = {}) => ({
      variant: state.addonVariant,
      status: state.addonStatus,
      disabled: state.addonDisabled,
      ...props,
    });
    const editors = (layout) => {
      const groups = editorKeys.map((key, index) =>
        h(Fragment, { key }, [
          h('input', { key: 'editor', 'aria-label': `${layout} scoped ${index}` }),
        ]),
      );
      return state.reversed ? groups.reverse() : groups;
    };
    const demos = import.meta.glob('../../../packages/ui/src/space/demo/*.vue', {
      eager: true,
      import: 'default',
    });
    const theme = () => ({
      algorithm:
        state.theme === 'dark'
          ? darkAlgorithm
          : state.theme === 'compact'
            ? compactAlgorithm
            : state.theme === 'both'
              ? [darkAlgorithm, compactAlgorithm]
              : undefined,
      ...(state.custom
        ? {
            token: {
              paddingXS: 19,
              padding: 23,
              paddingLG: 29,
              colorBorder: '#345678',
              colorText: '#203040',
              colorBgContainerDisabled: '#dee8f2',
            },
          }
        : {}),
    });
    onMounted(() => {
      window.spaceAudit = {
        async set(patch) {
          Object.assign(state, patch);
          await nextTick();
        },
        demos: Object.keys(demos).map((key) => key.split('/').pop().replace('.vue', '')),
      };
    });
    return () =>
      h(ConfigProvider, { direction: state.rtl ? 'rtl' : 'ltr' }, () => [
        h('main', { style: { padding: '16px' } }, [
          h('h1', 'Space contract audit'),
          // ThemeProvider without DOM injection is also the SSR theme path.
          h(ThemeProvider, { theme: theme() }, () => [
            h(Space, { id: 'gap-small', size: 'small' }, () => [h('span', 'A'), h('span', 'B')]),
            h(Space, { id: 'gap-middle', size: 'middle' }, () => ['A', 'B']),
            h(Space, { id: 'gap-large', size: 'large' }, () => ['A', 'B']),
            h('section', { id: 'addon-matrix', 'aria-label': 'Addon variant matrix' }, [
              ...['outlined', 'filled', 'borderless', 'underlined'].flatMap((variant) =>
                ['', 'error', 'warning', 'success', 'validating'].flatMap((status) =>
                  [false, true].map((disabled) =>
                    h(
                      SpaceAddon,
                      {
                        id: `addon-${variant}-${status || 'none'}-${disabled}`,
                        variant,
                        status,
                        disabled,
                        style: { paddingBlock: '4px', margin: '4px' },
                      },
                      () => `${variant} ${status} ${disabled}`,
                    ),
                  ),
                ),
              ),
            ]),
            h(
              SpaceCompact,
              {
                id: 'addon-chain',
                size: state.addonSize,
                orientation: state.vertical ? 'vertical' : 'horizontal',
              },
              () => [
                h(
                  SpaceAddon,
                  addonProps({ id: 'addon-first', style: { paddingBlock: '5px' } }),
                  () => 'First',
                ),
                h(
                  SpaceAddon,
                  addonProps({ id: 'addon-middle', style: { paddingBlock: '5px' } }),
                  () => 'Middle',
                ),
                h(
                  SpaceAddon,
                  addonProps({ id: 'addon-last', style: { paddingBlock: '5px' } }),
                  () => 'Last',
                ),
              ],
            ),
            h(
              SpaceCompact,
              {
                id: 'addon-single',
                size: state.addonSize,
                orientation: state.vertical ? 'vertical' : 'horizontal',
              },
              () => h(SpaceAddon, addonProps(), () => 'Single'),
            ),
            h(
              SpaceCompact,
              { size: state.addonSize, orientation: state.vertical ? 'vertical' : 'horizontal' },
              () =>
                h(
                  SpaceAddon,
                  addonProps({
                    id: 'addon-editor',
                    style: state.addonAlias
                      ? { '--apollo-line-width': '3px', '--apollo-color-border': '#123456' }
                      : undefined,
                  }),
                  () =>
                    h('input', { id: 'addon-native-draft', 'aria-label': 'Addon business draft' }),
                ),
            ),
            h(
              SpaceCompact,
              {
                id: 'real-controls',
                size: 'small',
                orientation: state.vertical ? 'vertical' : 'horizontal',
              },
              () => [
                h(SpaceAddon, null, () => 'https://'),
                h(Input, { 'aria-label': 'Business address' }),
                h(Select, {
                  'aria-label': 'Domain',
                  options: [{ value: 'com', label: '.com' }],
                  defaultValue: 'com',
                  style: state.nativeSelector
                    ? { '--apollo-select-selector-bg': '#264d73' }
                    : undefined,
                }),
                h(Button, null, () => 'Save'),
              ],
            ),
            h(
              Space,
              {
                id: 'native-space',
                prefixCls: state.customPrefix ? 'custom-space' : undefined,
                classNames: { item: state.rtl ? 'rtl-items' : 'ltr-items' },
              },
              () => editors('Space'),
            ),
            h(
              SpaceCompact,
              {
                id: 'native-compact',
                prefixCls: state.customPrefix ? 'custom-compact' : undefined,
              },
              () => editors('Compact'),
            ),
          ]),
          state.demo
            ? h(ConfigProvider, { theme: theme() }, () => {
                const key = Object.keys(demos).find((path) => path.endsWith(`/${state.demo}.vue`));
                return key
                  ? h(
                      'section',
                      {
                        id: 'demo',
                        'aria-label': `Space ${state.demo} demo`,
                        style: {
                          padding: '16px',
                          color: 'var(--apollo-color-text)',
                          background: 'var(--apollo-color-bg-container)',
                        },
                      },
                      [h(demos[key])],
                    )
                  : null;
              })
            : null,
        ]),
      ]);
  },
});

if (typeof document !== 'undefined') {
  const query = new URLSearchParams(location.search);
  const hydrate = query.has('hydrate');
  const before = document.querySelector('#real-controls input');
  (hydrate
    ? createSSRApp(Audit, { mode: query.get('mode') || 'default', custom: true })
    : createApp(Audit)
  ).mount('#app');
  if (hydrate)
    window.spaceHydrated = { retained: before === document.querySelector('#real-controls input') };
}
