import { formContextKey } from '@apollo-design/form-core';
import { HomeOutlined, IconProvider } from '@apollo-design/icons';
import { en_US, type Locale, useLocale, zh_CN } from '@apollo-design/locale';
import {
  getDesignToken,
  type ThemeConfig,
  type ThemeContext,
  ThemeProvider,
  useTheme,
} from '@apollo-design/theme';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createSSRApp,
  defineComponent,
  h,
  inject,
  nextTick,
  ref,
  shallowRef,
  type VNode,
} from 'vue';
import { renderToString } from 'vue/server-renderer';
import { Form, FormItem, useForm } from '../../form';
import { Input } from '../../input';
import { Pagination } from '../../pagination';
import { ConfigProvider } from '../ConfigProvider';
import { useComponentConfig, useConfigContext, useThemeConfig } from '../context';
import { useTheme as mergeProviderTheme } from '../hooks/use-theme';

const wrappers: Array<{ unmount(): void }> = [];
afterEach(() => {
  for (const wrapper of wrappers.splice(0)) wrapper.unmount();
  document.body.replaceChildren();
});
function render(content: () => VNode) {
  const wrapper = mount(defineComponent({ setup: () => content }), {
    attachTo: document.body,
    global: { stubs: { teleport: false } },
  });
  wrappers.push(wrapper);
  return wrapper;
}
async function settle() {
  await nextTick();
  await nextTick();
}
function themeProbe() {
  const captured: { context?: ThemeContext } = {};
  const Probe = defineComponent({
    setup() {
      const context = useTheme();
      captured.context = context;
      return () => h('output', String(context.token.value.fontSize));
    },
  });
  return {
    Probe,
    get context() {
      if (!captured.context) throw new Error('Expected the mounted theme consumer');
      return captured.context;
    },
  };
}
const FormMessage = defineComponent({
  setup() {
    const context = inject(formContextKey, undefined);
    return () => h('output', String(context?.validateMessages?.required));
  },
});

describe('ConfigProvider current sources and stable content', () => {
  it.each([false, true])(
    'keeps drafts and focus through locale/theme changes (initial theme=%s)',
    async (initial) => {
      const locale = shallowRef<Locale>();
      const theme = shallowRef(initial ? { token: { fontSize: 18 } } : undefined);
      const mounted = vi.fn();
      const Editor = defineComponent({
        setup() {
          mounted();
          const count = ref(0);
          return () =>
            h('section', [
              h('button', { type: 'button', onClick: () => count.value++ }, `Count ${count.value}`),
              h('input', { 'aria-label': 'Business draft', value: 'seed' }),
            ]);
        },
      });
      const wrapper = render(() =>
        h(ConfigProvider, { locale: locale.value, theme: theme.value }, () => h(Editor)),
      );
      const editor = wrapper.get('input').element;
      const section = wrapper.get('section').element;
      await wrapper.get('button').trigger('click');
      editor.value = 'Kept draft';
      editor.focus();
      editor.setSelectionRange(2, 5);
      for (const current of [zh_CN, en_US, undefined, zh_CN, undefined]) {
        locale.value = current;
        theme.value = theme.value ? undefined : { token: { fontSize: 21 } };
        await settle();
        expect(wrapper.get('section').element).toBe(section);
        expect(wrapper.get('input').element).toBe(editor);
        expect(editor.value).toBe('Kept draft');
        expect([editor.selectionStart, editor.selectionEnd]).toEqual([2, 5]);
        expect(document.activeElement).toBe(editor);
        expect(wrapper.get('button').text()).toBe('Count 1');
        expect(mounted).toHaveBeenCalledTimes(1);
      }
    },
  );

  it('updates actual Pagination text while retaining adjacent editor identity', async () => {
    const locale = shallowRef(en_US);
    const wrapper = render(() =>
      h(ConfigProvider, { locale: locale.value }, () => [
        h('input', { 'aria-label': 'Draft' }),
        h(Pagination, { total: 100, showSizeChanger: true }),
      ]),
    );
    const editor = wrapper.get('input').element;
    expect(wrapper.text()).toContain(en_US.Pagination?.items_per_page);
    locale.value = zh_CN;
    await settle();
    expect(wrapper.get('input').element).toBe(editor);
    expect(wrapper.text()).toContain(zh_CN.Pagination?.items_per_page);
  });

  it('inherits and withdraws locale sources without adding an exist flag to an absent source', async () => {
    const own = shallowRef<Locale>();
    const parent = shallowRef(zh_CN);
    const Probe = defineComponent({
      setup() {
        const [locale, code] = useLocale('Empty');
        return () => h('output', { 'data-code': code.value }, locale.value.description);
      },
    });
    const wrapper = render(() =>
      h(ConfigProvider, { locale: parent.value }, () =>
        h(ConfigProvider, { locale: own.value }, () => h(Probe)),
      ),
    );
    expect(wrapper.get('output').text()).toBe(zh_CN.Empty?.description);
    own.value = en_US;
    await settle();
    expect(wrapper.get('output').text()).toBe(en_US.Empty?.description);
    own.value = undefined;
    await settle();
    expect(wrapper.get('output').text()).toBe(zh_CN.Empty?.description);
    const plain = render(() => h(ConfigProvider, null, () => h(Probe)));
    expect(plain.get('output').attributes('data-code')).toBeUndefined();
  });

  it('preserves complete and conditional default-slot content and ignores provider attrs', async () => {
    const show = ref(true);
    const click = vi.fn();
    const ownClick = vi.fn();
    const wrapper = render(() =>
      h(
        ConfigProvider,
        {
          id: 'unused-provider-id',
          class: 'unused-provider-class',
          style: { color: 'red' },
          onClick: click,
        },
        () => [
          0,
          'Text',
          show.value ? h('button', { type: 'button', onClick: ownClick }, 'Action') : null,
        ],
      ),
    );
    expect(wrapper.text()).toBe('0TextAction');
    await wrapper.get('button').trigger('click');
    expect(ownClick).toHaveBeenCalledTimes(1);
    expect(click).not.toHaveBeenCalled();
    expect(wrapper.find('#unused-provider-id').exists()).toBe(false);
    expect(wrapper.find('.unused-provider-class').exists()).toBe(false);
    expect(wrapper.findAll('div')).toHaveLength(0);
    show.value = false;
    await settle();
    expect(wrapper.text()).toBe('0Text');
    show.value = true;
    await settle();
    expect(wrapper.text()).toBe('0TextAction');
  });
});

describe('ConfigProvider writable and isolated theme context', () => {
  it('projects the nearest explicit ThemeProvider, including an empty reset, without replacing content', async () => {
    const current = ref<ThemeConfig>({ token: { fontSize: 19 } });
    const wrapper = render(() =>
      h(ConfigProvider, { theme: { token: { fontSize: 29 } } }, () =>
        h(ThemeProvider, { theme: current.value }, () =>
          h(ConfigProvider, null, () => h('input', { 'aria-label': 'Nearest theme draft' })),
        ),
      ),
    );
    const editor = wrapper.get('input').element;
    editor.value = 'Preserved nearest theme draft';
    editor.focus();
    editor.setSelectionRange(2, 7);
    await settle();
    expect(editor.style.getPropertyValue('--apollo-font-size')).toBe('19px');
    current.value = {};
    await settle();
    expect(editor.style.getPropertyValue('--apollo-font-size')).toBe('14px');
    expect(editor.value).toBe('Preserved nearest theme draft');
    expect(wrapper.get('input').element).toBe(editor);
    expect(document.activeElement).toBe(editor);
    expect([editor.selectionStart, editor.selectionEnd]).toEqual([2, 7]);
    current.value = { token: { fontSize: 23 } };
    await settle();
    expect(editor.style.getPropertyValue('--apollo-font-size')).toBe('23px');
  });

  it('activates and clears a runtime source without an external theme prop', async () => {
    const probe = themeProbe();
    const wrapper = render(() => h(ConfigProvider, null, () => h(probe.Probe)));
    const scope = wrapper.get('output').element;
    expect(probe.context.sourceActive?.value).toBe(false);
    expect(scope.style.getPropertyValue('--apollo-font-size')).toBe('');
    probe.context.config.value = { token: { fontSize: 23 } };
    await settle();
    expect(wrapper.text()).toBe('23');
    expect(probe.context.sourceActive?.value).toBe(true);
    expect(scope.style.getPropertyValue('--apollo-font-size')).toBe('23px');
    probe.context.config.value = {};
    await settle();
    expect(probe.context.sourceActive?.value).toBe(false);
    expect(scope.style.getPropertyValue('--apollo-font-size')).toBe('');
    expect(wrapper.get('output').element).toBe(scope);
  });

  it('keeps deep runtime edits local and resets them when an external source changes', async () => {
    const external = ref({ token: { fontSize: 18 }, components: { Button: { borderRadius: 7 } } });
    const probe = themeProbe();
    const wrapper = render(() =>
      h(ConfigProvider, { theme: external.value }, () => h(probe.Probe)),
    );
    probe.context.config.value.token ??= {};
    probe.context.config.value.token.fontSize = 25;
    probe.context.config.value.components ??= {};
    probe.context.config.value.components.Button ??= {};
    probe.context.config.value.components.Button.borderRadius = 12;
    await settle();
    expect(wrapper.text()).toBe('25');
    expect(external.value).toEqual({
      token: { fontSize: 18 },
      components: { Button: { borderRadius: 7 } },
    });
    external.value.token.fontSize = 20;
    await settle();
    expect(wrapper.text()).toBe('20');
    expect(probe.context.config.value.components?.Button?.borderRadius).toBe(7);
  });

  it('replaces effective inherited config and isolates sibling contexts', async () => {
    const first = themeProbe();
    const second = themeProbe();
    const wrapper = render(() =>
      h(ThemeProvider, { theme: { token: { fontSize: 18 } } }, () => [
        h(ConfigProvider, null, () => h(first.Probe)),
        h(ConfigProvider, null, () => h(second.Probe)),
      ]),
    );
    first.context.config.value = { token: { fontSize: 24 } };
    await settle();
    expect(first.context.config.value).toEqual({ token: { fontSize: 24 } });
    expect(second.context.config.value.token?.fontSize).toBe(18);
    expect(wrapper.findAll('output').map((node) => node.text())).toEqual(['24', '18']);
  });

  it('serializes scope variables around complete server content', async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(
            ConfigProvider,
            {
              prefixCls: 'brand',
              scopeTag: 'section',
              theme: { cssVarPrefix: 'custom', token: { fontSize: 21 } },
            },
            () => [
              h('input', { 'aria-label': 'Server editor', value: 'Draft' }),
              h('span', 'Server content'),
            ],
          ),
      }),
    );
    expect(html).toMatch(/^<section style="display:contents;--custom-/);
    expect(html).toContain('--custom-font-size:21px');
    expect(html).toContain('value="Draft"');
    expect(html).toContain('Server content');
    expect(html).not.toContain('teleport');
    expect(html.endsWith('</section>')).toBe(true);
  });
});

describe('ConfigProvider component and form sources', () => {
  it('preserves own __proto__ component keys and honest property reflection', () => {
    const components = { ['__proto__']: { className: 'custom-proto' } };
    const Probe = defineComponent({
      setup() {
        const context = useConfigContext();
        const config = useComponentConfig('__proto__');
        return () =>
          h(
            'output',
            {
              'data-own': String(Object.hasOwn(context.components ?? {}, '__proto__')),
              'data-missing': String(Object.hasOwn(config, 'missing')),
            },
            String(config.className),
          );
      },
    });
    const wrapper = render(() =>
      h(ConfigProvider, { components }, () => h(ConfigProvider, null, () => h(Probe))),
    );
    expect(wrapper.get('output').attributes('data-own')).toBe('true');
    expect(wrapper.get('output').attributes('data-missing')).toBe('false');
    expect(wrapper.text()).toBe('custom-proto');
  });

  it('inherits parent validation messages and resolves map and direct form overrides', async () => {
    const direct = ref(false);
    const wrapper = render(() =>
      h(
        ConfigProvider,
        { locale: zh_CN, form: { validateMessages: { required: 'Parent required' } } },
        () =>
          h(ConfigProvider, null, () =>
            h(
              ConfigProvider,
              {
                components: { form: { validateMessages: { required: 'Map required' } } },
                form: direct.value
                  ? { validateMessages: { required: 'Direct required' } }
                  : undefined,
              },
              () => h(FormMessage),
            ),
          ),
      ),
    );
    expect(wrapper.text()).toBe('Map required');
    direct.value = true;
    await settle();
    expect(wrapper.text()).toBe('Direct required');
    direct.value = false;
    await settle();
    expect(wrapper.text()).toBe('Map required');
    const inherited = render(() =>
      h(ConfigProvider, { locale: zh_CN }, () => h(ConfigProvider, null, () => h(FormMessage))),
    );
    expect(inherited.text()).toBe(zh_CN.Form?.defaultValidateMessages?.required);
    const parent = render(() =>
      h(ConfigProvider, { form: { validateMessages: { required: 'Parent required' } } }, () =>
        h(ConfigProvider, null, () => h(FormMessage)),
      ),
    );
    expect(parent.text()).toBe('Parent required');
  });

  it('updates actual mounted form validation without replacing its input or store', async () => {
    const message = ref('First required');
    const [form] = useForm();
    const wrapper = render(() =>
      h(ConfigProvider, { form: { validateMessages: { required: message.value } } }, () =>
        h(Form, { form }, () =>
          h(FormItem, { name: 'user', label: 'User', rules: [{ required: true }] }, () => h(Input)),
        ),
      ),
    );
    const editor = wrapper.get('input').element;
    await expect(form.validateFields()).rejects.toMatchObject({
      errorFields: [{ errors: ['First required'] }],
    });
    message.value = 'Second required';
    await settle();
    await expect(form.validateFields()).rejects.toMatchObject({
      errorFields: [{ errors: ['Second required'] }],
    });
    expect(wrapper.get('input').element).toBe(editor);
  });

  it('provides current icon prefixes while preserving a nearer IconProvider override', async () => {
    const prefix = ref('brand-icon');
    const wrapper = render(() =>
      h(ConfigProvider, { iconPrefixCls: prefix.value }, () => [
        h(HomeOutlined),
        h(IconProvider, { value: { prefixCls: 'near-icon' } }, () => h(HomeOutlined)),
      ]),
    );
    expect(wrapper.find('.brand-icon').exists()).toBe(true);
    expect(wrapper.find('.near-icon').exists()).toBe(true);
    prefix.value = 'next-icon';
    await settle();
    expect(wrapper.find('.brand-icon').exists()).toBe(false);
    expect(wrapper.find('.next-icon').exists()).toBe(true);
    expect(wrapper.find('.near-icon').exists()).toBe(true);
  });
});

it('theme component merging keeps literal prototype-like keys as own properties', () => {
  const first = mergeProviderTheme(
    { components: { ['__proto__']: { colorPrimary: 'red' } } },
    undefined,
  );
  expect(Object.hasOwn(first?.components ?? {}, '__proto__')).toBe(true);
  const merged = mergeProviderTheme(
    { components: { ['__proto__']: { colorPrimary: 'blue' } } },
    first,
  );
  expect(
    Object.entries(merged?.components ?? {}).find(([name]) => name === '__proto__')?.[1],
  ).toEqual({ colorPrimary: 'blue' });
  expect(Object.getPrototypeOf(merged?.components)).toBe(Object.prototype);
});

it('useThemeConfig follows the active same-app Theme context and leaves inactive CSS-only state undefined', () => {
  const Reader = defineComponent({
    setup() {
      const current = useThemeConfig();
      return () =>
        h('output', current.value ? String(getDesignToken(current.value).fontSize) : 'inactive');
    },
  });
  const inactive = render(() => h(Reader));
  expect(inactive.text()).toBe('inactive');
  const Parent = defineComponent({
    setup() {
      const theme = useTheme();
      theme.config.value = { token: { fontSize: 26 } };
      return () => h(Reader);
    },
  });
  const active = render(() => h(Parent));
  expect(active.text()).toBe('26');
});
