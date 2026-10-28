import {
  compactAlgorithm,
  createThemeContext,
  darkAlgorithm,
  getDesignToken,
  ThemeContextKey,
  ThemeProvider,
  transformToken,
} from '@apollo-design/theme';
import {
  Button,
  ConfigProvider,
  Input,
  InputGroup,
  InputOTP,
  InputPassword,
  InputSearch,
  SpaceCompact,
  TextArea,
} from '@apollo-design/ui';
import axe from 'axe-core';
import { computed, createApp, defineComponent, h, nextTick, provide, reactive, ref } from 'vue';
import ComponentTokenDemo from '../../../packages/ui/src/input/demo/component-token.vue';

const state = reactive({
  theme: 'default',
  size: 'middle',
  source: 'local',
  providerSize: undefined,
  compactSize: undefined,
  tokens: {},
  native: 'none',
  semantic: false,
  css: false,
  providerStyle: false,
  overrideChild: false,
  visible: true,
  buttonHeight: undefined,
  buttonMinHeight: undefined,
  customButton: false,
  autoLimits: true,
  autoMain: true,
  autoPeer: false,
  rootWidth: 520,
  lineHeight: undefined,
  status: undefined,
  variant: 'outlined',
  demo: false,
  sourceContracts: false,
  sourceCPTheme: undefined,
});
const style = document.createElement('style');
style.textContent =
  '*,*::before,*::after{transition:none!important;animation:none!important;}.probe-css.apollo-input,.probe-css.apollo-input-affix-wrapper,.probe-css .apollo-input{--apollo-input-padding-inline:21px;}';
document.head.append(style);
const events = [];
const peerEvents = [];
const theme = () => ({
  ...(state.theme === 'default'
    ? {}
    : {
        algorithm:
          state.theme === 'dark'
            ? darkAlgorithm
            : state.theme === 'compact'
              ? compactAlgorithm
              : [darkAlgorithm, compactAlgorithm],
      }),
  ...(Object.keys(state.tokens).length ? { components: { Input: state.tokens } } : {}),
});
const native = () =>
  state.native === 'object'
    ? { '--apollo-input-padding-block': '8px', '--apollo-input-input-font-size': '18px' }
    : state.native === 'string'
      ? '--apollo-input-padding-block:8px;--apollo-input-input-font-size:18px'
      : state.native === 'array'
        ? [{ '--apollo-input-padding-block': '8px' }, { '--apollo-input-input-font-size': '18px' }]
        : {};
const props = (family) => ({
  status: state.status,
  variant: state.variant,
  size: state.source === 'local' ? state.size : undefined,
  'aria-label': family,
  class: state.css ? 'probe-css' : undefined,
  style: native(),
  ...(state.semantic
    ? {
        styles:
          family === 'textarea' || family === 'textarea-affix' || family === 'autosize'
            ? { root: { paddingBlock: '7px' }, textarea: { fontSize: '19px' } }
            : family === 'otp' || family === 'search'
              ? { input: { fontSize: '19px', paddingBlock: '7px' } }
              : { root: { paddingBlock: '7px' }, input: { fontSize: '19px' } },
      }
    : {}),
});
const makers = {
  plain: () => h(Input, { ...props('plain'), id: 'plain-control', defaultValue: 'Business draft' }),
  affix: () =>
    h(Input, { ...props('affix'), prefix: '@', suffix: 'kg', defaultValue: 'Alias field' }),
  password: () => h(InputPassword, { ...props('password'), defaultValue: 'secret' }),
  search: () =>
    h(InputSearch, {
      ...props('search'),
      enterButton: state.customButton
        ? h(
            Button,
            { style: { height: state.buttonHeight, minHeight: state.buttonMinHeight } },
            () => 'Custom search',
          )
        : 'Search',
      styles: {
        input: state.semantic
          ? { fontSize: '19px', paddingBlock: '7px' }
          : state.lineHeight
            ? { lineHeight: state.lineHeight }
            : {},
        button: { root: { height: state.buttonHeight, minHeight: state.buttonMinHeight } },
      },
      defaultValue: 'query',
    }),
  textarea: () => h(TextArea, { ...props('textarea'), rows: 1, defaultValue: 'Single line' }),
  'textarea-affix': () =>
    h(TextArea, {
      ...props('textarea-affix'),
      rows: 1,
      showCount: true,
      defaultValue: 'Counted line',
    }),
  autosize: () => [
    state.autoMain
      ? h(TextArea, {
          ...props('autosize'),
          key: 'sizing-main',
          autoSize: state.autoLimits,
          defaultValue: 'First line\nSecond line',
          onResize: (value) => events.push(value),
        })
      : null,
    state.autoPeer
      ? h(TextArea, {
          key: 'sizing-peer',
          autoSize: true,
          'data-auto-peer': '',
          'aria-label': 'Independent autoSize',
          defaultValue: 'Independent\nDraft',
          style: { width: '200px' },
          onResize: (value) => peerEvents.push(value),
        })
      : null,
  ],
  'legacy-addons': () =>
    h(Input, {
      ...props('legacy-addons'),
      addonBefore: 'https://',
      addonAfter: '.com',
      defaultValue: 'example',
    }),
  group: () =>
    h(InputGroup, { ...props('group'), compact: true }, () => [
      h(Input, {
        'aria-label': 'Group child',
        size: state.overrideChild ? 'small' : undefined,
        style: { width: '120px' },
      }),
      h(Button, { 'data-group-button': '', type: 'primary' }, () => 'Go'),
    ]),
  otp: () => h(InputOTP, { ...props('otp'), length: 3, defaultValue: '123' }),
};
const providerComponents = () =>
  state.providerStyle
    ? Object.fromEntries(
        ['input', 'textArea', 'inputPassword', 'inputSearch', 'otp'].map((name) => [
          name,
          {
            style: {
              '--apollo-input-padding-block': '10px',
              '--apollo-input-input-font-size': '20px',
            },
          },
        ]),
      )
    : {};
const sourceFields = (name) =>
  ['input', 'textarea'].map((kind) =>
    h(kind === 'input' ? Input : TextArea, {
      key: `${name}-${kind}`,
      'data-source-consumer': `${name}-${kind}`,
      'aria-label': `${name} ${kind}`,
      defaultValue: name === 'css' ? 'CSS-only draft' : 'Source draft',
      ...(kind === 'textarea' ? { rows: 1 } : {}),
    }),
  );
const EmptyFactorySource = defineComponent({
  setup() {
    provide(ThemeContextKey, createThemeContext({}));
    return () => h('div', sourceFields('factory'));
  },
});
const LegacyEmptySource = defineComponent({
  setup() {
    provide(ThemeContextKey, { config: ref({}), token: computed(() => getDesignToken()) });
    return () => h('div', sourceFields('legacy'));
  },
});
const sourceScope = () =>
  h(
    'div',
    {
      id: 'source-contracts',
      style: {
        ...transformToken(getDesignToken({ algorithm: compactAlgorithm })).vars,
        width: '500px',
      },
    },
    [
      h(ConfigProvider, { theme: state.sourceCPTheme }, { default: () => sourceFields('css') }),
      h(ThemeProvider, { theme: {} }, { default: () => sourceFields('empty') }),
      h(
        ThemeProvider,
        { theme: {} },
        { default: () => h(ConfigProvider, null, { default: () => sourceFields('through-cp') }) },
      ),
      h(
        ThemeProvider,
        { theme: { algorithm: compactAlgorithm } },
        {
          default: () =>
            h(ThemeProvider, { theme: {} }, { default: () => sourceFields('nearest') }),
        },
      ),
      h(EmptyFactorySource),
      h(LegacyEmptySource),
      h(
        ConfigProvider,
        { theme: { algorithm: compactAlgorithm } },
        {
          default: () =>
            h(
              ThemeProvider,
              { theme: {} },
              {
                default: () =>
                  h(ConfigProvider, null, { default: () => sourceFields('config-priority') }),
              },
            ),
        },
      ),
    ],
  );
const app = createApp({
  render: () =>
    state.sourceContracts
      ? sourceScope()
      : h(
          ConfigProvider,
          { theme: theme(), componentSize: state.providerSize, components: providerComponents() },
          {
            default: () =>
              h(
                'main',
                {
                  style: {
                    padding: '16px',
                    fontFamily: 'var(--apollo-font-family)',
                    fontSize: 'var(--apollo-font-size)',
                    background: 'var(--apollo-color-bg-container)',
                    color: 'var(--apollo-color-text)',
                  },
                },
                state.demo
                  ? [h(ComponentTokenDemo)]
                  : state.visible
                    ? Object.entries(makers).map(([family, make]) =>
                        h(
                          'section',
                          {
                            'data-family': family,
                            key: family,
                            style: {
                              padding: '8px',
                              marginBottom: '10px',
                              border: '1px solid #ddd',
                            },
                          },
                          [
                            h('h2', { style: { fontSize: '14px', margin: '0 0 8px' } }, family),
                            h(
                              SpaceCompact,
                              {
                                size: state.source === 'compact' ? state.compactSize : undefined,
                                style: { width: '100%', maxWidth: `${state.rootWidth}px` },
                              },
                              () => [
                                make(),
                                h(
                                  Button,
                                  {
                                    'data-reference': '',
                                    size: state.source === 'local' ? state.size : undefined,
                                    type: 'primary',
                                  },
                                  () => 'Save',
                                ),
                              ],
                            ),
                          ],
                        ),
                      )
                    : [],
              ),
          },
        ),
});
app.mount('#app');
window.inputSizing = {
  async set(patch) {
    Object.assign(state, patch);
    await nextTick();
    await new Promise(requestAnimationFrame);
  },
  events,
  peerEvents,
  async contrast() {
    const result = await axe.run(document.querySelector('.demo-input-token'), {
      runOnly: { type: 'rule', values: ['color-contrast'] },
    });
    return result.violations.map((violation) => ({
      id: violation.id,
      nodes: violation.nodes.map((node) => node.target),
    }));
  },
  unmount() {
    app.unmount();
  },
};
window.inputSizingReady = true;
