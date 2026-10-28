/** INPUT-SIZING-20261029: current theme data, size ownership and explicit styles. */
import {
  compactAlgorithm,
  createThemeContext,
  getDesignToken,
  type ThemeConfig,
  ThemeContextKey,
  ThemeProvider,
} from '@apollo-design/theme';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { computed, createSSRApp, defineComponent, h, nextTick, provide, ref } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { Button } from '../../button';
import { ConfigProvider } from '../../config-provider';
import { Select } from '../../select';
import { NoCompactStyle, SpaceCompact } from '../../space';
import { Input, InputGroup, InputOTP, InputPassword, InputSearch, TextArea } from '../index';

const control = (name: string) => {
  switch (name) {
    case 'affix':
      return h(Input, { prefix: '@' });
    case 'password':
      return h(InputPassword);
    case 'search':
      return h(InputSearch, { enterButton: 'Search' });
    case 'textarea':
      return h(TextArea, { rows: 1 });
    case 'textarea-affix':
      return h(TextArea, { rows: 1, showCount: true });
    case 'legacy-addons':
      return h(Input, { addonBefore: 'https://' });
    case 'otp':
      return h(InputOTP, { length: 3 });
    default:
      return h(Input);
  }
};
const outer = (wrapper: ReturnType<typeof mount>) => {
  const input = wrapper.get('input,textarea').element;
  const root = input.closest('.apollo-input-group-wrapper,.apollo-input-affix-wrapper') ?? input;
  if (!(root instanceof HTMLElement)) throw new Error('Expected a native Input root');
  return root;
};

const EmptyFactorySource = defineComponent({
  setup() {
    provide(ThemeContextKey, createThemeContext({}));
    return () => h(Input);
  },
});
const LegacyEmptySource = defineComponent({
  setup() {
    provide(ThemeContextKey, {
      config: ref<ThemeConfig>({}),
      token: computed(() => getDesignToken()),
    });
    return () => h(Input);
  },
});

describe('Input sizing · current theme and component fields', () => {
  it.each(['provider', 'factory', 'legacy'])(
    'consumes the explicit empty %s source as default theme data',
    (name) => {
      const wrapper = mount(
        defineComponent({
          setup: () => () =>
            h('div', { style: { '--apollo-font-size': '12px' } }, [
              name === 'provider'
                ? h(ThemeProvider, { theme: {} }, { default: () => h(Input) })
                : h(name === 'factory' ? EmptyFactorySource : LegacyEmptySource),
            ]),
        }),
      );
      expect(outer(wrapper).style.getPropertyValue('--apollo-font-size')).toBe('14px');
      expect(outer(wrapper).style.getPropertyValue('--apollo-control-height')).toBe('32px');
    },
  );

  it('keeps a CSS-only scope without a source while forwarding the nearest active empty source through ConfigProvider', () => {
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h('div', { style: { '--apollo-font-size': '12px' } }, [
            h(ConfigProvider, null, { default: () => h(Input, { 'data-css-only': '' }) }),
            h(
              ThemeProvider,
              { theme: {} },
              {
                default: () =>
                  h(ConfigProvider, null, { default: () => h(Input, { 'data-active-empty': '' }) }),
              },
            ),
          ]),
      }),
      { global: { stubs: { teleport: false } } },
    );
    const css = wrapper.get('[data-css-only]').element;
    const active = wrapper.get('[data-active-empty]').element;
    if (!(css instanceof HTMLElement) || !(active instanceof HTMLElement))
      throw new Error('Expected Input roots');
    expect(css.style.getPropertyValue('--apollo-font-size')).toBe('');
    expect(active.style.getPropertyValue('--apollo-font-size')).toBe('14px');
  });
  it.each([
    'plain',
    'affix',
    'password',
    'search',
    'textarea',
    'textarea-affix',
    'legacy-addons',
    'otp',
  ])('%s consumes compact aliases without requiring DOM theme injection', (name) => {
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(ThemeProvider, { theme: { algorithm: compactAlgorithm } }, () => control(name)),
      }),
    );
    expect(outer(wrapper).style.getPropertyValue('--apollo-font-size')).toBe('12px');
    expect(outer(wrapper).style.getPropertyValue('--apollo-control-height')).toBe('28px');
  });

  it('consumes all nineteen existing Input fields, including zero and CSS lengths', async () => {
    const tokens = ref<Record<string, string | number>>({
      lineWidthFocus: 0,
      paddingBlock: 7,
      paddingBlockSM: '0.2rem',
      paddingBlockLG: 9,
      paddingInline: 17,
      paddingInlineSM: 13,
      paddingInlineLG: 19,
      inputFontSize: '1.125rem',
      inputFontSizeSM: 16,
      inputFontSizeLG: 22,
      inputAffixPadding: 11,
      activeBorderColor: '#722ed1',
      hoverBorderColor: '#531dab',
      hoverBg: '#f9f0ff',
      activeBg: '#eee5ff',
      addonBg: '#f5eaff',
      activeShadow: '0 0 0 3px #abcdef',
      errorActiveShadow: '0 0 0 4px #fedcba',
      warningActiveShadow: '0 0 0 5px #abcefa',
    });
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            ConfigProvider,
            { theme: { components: { Input: tokens.value } } },
            { default: () => h(Input) },
          ),
      }),
      { global: { stubs: { teleport: false } } },
    );
    const style = outer(wrapper).style;
    expect(style.getPropertyValue('--apollo-input-line-width-focus')).toBe('0px');
    expect(style.getPropertyValue('--apollo-input-padding-block')).toBe('7px');
    expect(style.getPropertyValue('--apollo-input-padding-block-sm')).toBe('0.2rem');
    expect(style.getPropertyValue('--apollo-input-input-font-size')).toBe('1.125rem');
    expect(style.getPropertyValue('--apollo-input-input-affix-padding')).toBe('11px');
    for (const [field, value] of Object.entries(tokens.value)) {
      const key = field.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
      expect(style.getPropertyValue(`--apollo-input-${key}`)).toBe(
        typeof value === 'number' ? `${value}px` : value,
      );
    }
    tokens.value = { paddingBlock: 0, inputFontSize: 20 };
    await nextTick();
    expect(style.getPropertyValue('--apollo-input-padding-block')).toBe('0px');
    expect(style.getPropertyValue('--apollo-input-input-font-size')).toBe('20px');
    expect(style.getPropertyValue('--apollo-input-active-shadow')).toBe('');
    tokens.value = {};
    await nextTick();
    expect(style.getPropertyValue('--apollo-input-padding-block')).toBe('');
  });

  it('keeps semantic and native overrides above component theme data', () => {
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            ConfigProvider,
            { theme: { components: { Input: { paddingBlock: 7, inputFontSize: 18 } } } },
            {
              default: () =>
                h(Input, {
                  styles: { input: { '--apollo-input-padding-block': '9px' } },
                  style: { '--apollo-input-input-font-size': '20px' },
                }),
            },
          ),
      }),
      { global: { stubs: { teleport: false } } },
    );
    expect(outer(wrapper).style.getPropertyValue('--apollo-input-padding-block')).toBe('9px');
    expect(outer(wrapper).style.getPropertyValue('--apollo-input-input-font-size')).toBe('20px');
  });

  it.each(['plain', 'affix', 'password', 'textarea'])('%s consumes provider root style', (name) => {
    const style = { '--apollo-input-padding-block': '10px' };
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            ConfigProvider,
            { components: { input: { style }, inputPassword: { style }, textArea: { style } } },
            { default: () => control(name) },
          ),
      }),
      { global: { stubs: { teleport: false } } },
    );
    expect(outer(wrapper).style.getPropertyValue('--apollo-input-padding-block')).toBe('10px');
  });
});

describe('Input sizing · Group and OTP size propagation', () => {
  it('Group provides Select size without overriding its explicit child size', () => {
    const wrapper = mount(InputGroup, {
      props: { size: 'large', compact: true },
      slots: { default: () => [h(Select), h(Select, { size: 'small' })] },
    });
    const selects = wrapper.findAll('.apollo-select');
    expect(selects).toHaveLength(2);
    expect(selects[0]?.classes()).toContain('apollo-select-lg');
    expect(selects[1]?.classes()).toContain('apollo-select-sm');
    expect(selects[1]?.classes()).not.toContain('apollo-select-lg');
  });
  it('Group forwards current size to real compact consumers and keeps a local child override', async () => {
    const size = ref<'small' | 'large'>('large');
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            InputGroup,
            { size: size.value, compact: true },
            { default: () => [h(Input, { size: 'small' }), h(Button, null, () => 'Go')] },
          ),
      }),
    );
    expect(wrapper.get('input').classes()).toContain('apollo-input-sm');
    expect(wrapper.get('button').classes()).toContain('apollo-btn-lg');
    size.value = 'small';
    await nextTick();
    expect(wrapper.get('button').classes()).toContain('apollo-btn-sm');
  });

  it('OTP reads Compact before global size for both its root and its cells', () => {
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            ConfigProvider,
            { componentSize: 'large' },
            {
              default: () =>
                h(SpaceCompact, { size: 'small' }, { default: () => h(InputOTP, { length: 3 }) }),
            },
          ),
      }),
      { global: { stubs: { teleport: false } } },
    );
    expect(wrapper.get('.apollo-otp').classes()).toContain('apollo-otp-sm');
    for (const input of wrapper.findAll('input'))
      expect(input.classes()).toContain('apollo-input-sm');
  });

  it('OTP keeps its explicit size and observes NoCompactStyle isolation', () => {
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            ConfigProvider,
            { componentSize: 'large' },
            {
              default: () =>
                h(
                  SpaceCompact,
                  { size: 'small' },
                  {
                    default: () => [
                      h(InputOTP, { length: 2, size: 'middle', 'data-local': '' }),
                      h(NoCompactStyle, null, {
                        default: () => h(InputOTP, { length: 2, 'data-isolated': '' }),
                      }),
                    ],
                  },
                ),
            },
          ),
      }),
      { global: { stubs: { teleport: false } } },
    );
    expect(wrapper.get('[data-local]').classes()).not.toContain('apollo-otp-sm');
    expect(wrapper.get('[data-local]').classes()).not.toContain('apollo-otp-lg');
    expect(wrapper.get('[data-isolated]').classes()).toContain('apollo-otp-lg');
    for (const input of wrapper.findAll('[data-isolated] input')) {
      expect(input.classes()).toContain('apollo-input-lg');
    }
  });
});

describe('Input sizing · dynamic isolation and hydration', () => {
  it('updates nested and sibling theme data without changing native node, focus or draft', async () => {
    const theme = ref<ThemeConfig>({
      algorithm: compactAlgorithm,
      components: { Input: { inputAffixPadding: 9 } },
    });
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h('div', [
            h(
              ThemeProvider,
              { theme: theme.value },
              {
                default: () => [
                  h(Input, { 'data-current': '', defaultValue: 'Draft' }),
                  h(
                    ThemeProvider,
                    { theme: { token: { fontSize: 18 } } },
                    { default: () => h(Input, { 'data-nested': '' }) },
                  ),
                ],
              },
            ),
            h(
              ThemeProvider,
              { theme: { token: { fontSize: 16 } } },
              { default: () => h(Input, { 'data-sibling': '' }) },
            ),
          ]),
      }),
      { attachTo: document.body },
    );
    try {
      const current = wrapper.get('[data-current]').element;
      const nested = wrapper.get('[data-nested]').element;
      const sibling = wrapper.get('[data-sibling]').element;
      if (
        !(current instanceof HTMLInputElement) ||
        !(nested instanceof HTMLInputElement) ||
        !(sibling instanceof HTMLInputElement)
      ) {
        throw new Error('Expected native Input nodes');
      }
      current.focus();
      current.setSelectionRange(1, 4);
      expect(current.style.getPropertyValue('--apollo-font-size')).toBe('12px');
      theme.value = { token: { fontSize: 20 }, components: { Input: { paddingBlock: 0 } } };
      await nextTick();
      expect(wrapper.get('[data-current]').element).toBe(current);
      expect(current.style.getPropertyValue('--apollo-font-size')).toBe('20px');
      expect(current.style.getPropertyValue('--apollo-input-input-affix-padding')).toBe('');
      expect(nested.style.getPropertyValue('--apollo-font-size')).toBe('18px');
      expect(sibling.style.getPropertyValue('--apollo-font-size')).toBe('16px');
      expect(document.activeElement).toBe(current);
      expect([current.value, current.selectionStart, current.selectionEnd]).toEqual([
        'Draft',
        1,
        4,
      ]);
      theme.value = {};
      await nextTick();
      expect(current.style.getPropertyValue('--apollo-font-size')).toBe('14px');
      expect(current.style.getPropertyValue('--apollo-input-padding-block')).toBe('');
    } finally {
      wrapper.unmount();
    }
  });

  it('renders current theme data on the server and hydrates the same logical roots', async () => {
    const theme: ThemeConfig = {
      algorithm: compactAlgorithm,
      components: { Input: { paddingBlock: 0, inputAffixPadding: '0.5rem' } },
    };
    const tree = () =>
      h(
        ThemeProvider,
        { theme },
        {
          default: () =>
            h('div', [
              h(Input, { prefix: '@', defaultValue: 'Server draft' }),
              h(TextArea, { rows: 2, defaultValue: 'Server text' }),
            ]),
        },
      );
    const markup = await renderToString(createSSRApp({ render: tree }));
    expect(markup).toContain('--apollo-font-size:12px');
    expect(markup).toContain('--apollo-input-input-affix-padding:0.5rem');
    const container = document.createElement('div');
    container.innerHTML = markup;
    document.body.append(container);
    const input = container.querySelector('input');
    const app = createSSRApp({ render: tree });
    try {
      app.mount(container);
      await nextTick();
      expect(container.querySelector('input')).toBe(input);
      expect(input?.value).toBe('Server draft');
      expect(container.querySelector('textarea')?.value).toBe('Server text');
    } finally {
      app.unmount();
      container.remove();
    }
  });
});
