import { getDesignToken, ThemeProvider } from '@apollo-design/theme';
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import {
  defineComponent,
  Fragment,
  type FunctionalComponent,
  h,
  nextTick,
  provide,
  reactive,
  ref,
  type StyleValue,
  shallowRef,
} from 'vue';
import { configContextKey, DEFAULT_CONFIG_CONTEXT } from '../../config-provider/context';
import { Flex } from '../index';
import type { FlexConfig } from '../interface';
import { alignItemsValues, justifyContentValues } from '../utils';

const NativeHost = defineComponent({
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => h('section', attrs, slots.default?.());
  },
});

function html(element: Element): HTMLElement {
  if (!(element instanceof HTMLElement)) throw new Error('Expected an actual HTML host');
  return element;
}

describe('Flex current Vue contracts', () => {
  it('reads replacement Provider class/style/vertical/direction and clears removed defaults', async () => {
    const config = reactive({
      ...DEFAULT_CONFIG_CONTEXT,
      direction: 'ltr' as 'ltr' | 'rtl',
      components: {
        flex: { className: 'first', style: { padding: '7px' }, vertical: false } as FlexConfig,
      },
    });
    const w = mount(
      defineComponent({
        setup() {
          provide(configContextKey, config);
          return () => h(Flex, null, () => 'Business');
        },
      }),
    );
    expect(w.classes()).toContain('first');
    config.components = { flex: { className: 'second', style: { margin: '9px' }, vertical: true } };
    config.direction = 'rtl';
    await nextTick();
    expect(w.classes()).toContain('second');
    expect(w.classes()).not.toContain('first');
    expect(w.classes()).toContain('apollo-flex-vertical');
    expect(w.classes()).toContain('apollo-flex-rtl');
    expect(html(w.element).style.padding).toBe('');
    expect(html(w.element).style.margin).toBe('9px');
    config.components = { flex: {} };
    config.direction = 'ltr';
    await nextTick();
    expect(w.classes()).not.toContain('second');
    expect(w.classes()).not.toContain('apollo-flex-vertical');
    expect(w.classes()).not.toContain('apollo-flex-rtl');
    expect(html(w.element).style.margin).toBe('');
    w.unmount();
  });

  it('reads a replacement prefix getter while explicit local prefix still wins', async () => {
    const config = reactive({ ...DEFAULT_CONFIG_CONTEXT });
    const ownPrefix = ref<string>();
    const w = mount(
      defineComponent({
        setup() {
          provide(configContextKey, config);
          return () => h(Flex, { prefixCls: ownPrefix.value }, () => 'Business');
        },
      }),
    );
    config.getPrefixCls = (suffix, custom) => custom ?? `current-${suffix}`;
    await nextTick();
    expect(w.classes()).toContain('current-flex');
    ownPrefix.value = 'own-flex';
    await nextTick();
    expect(w.classes()).toContain('own-flex');
    config.getPrefixCls = (suffix, custom) => custom ?? `next-${suffix}`;
    await nextTick();
    expect(w.classes()).toContain('own-flex');
    ownPrefix.value = undefined;
    await nextTick();
    expect(w.classes()).toContain('next-flex');
    w.unmount();
  });

  it('reads attrs-only class/style/id/ARIA/listener changes and removals during render', async () => {
    const first = vi.fn(),
      second = vi.fn();
    const attrs = shallowRef<Record<string, unknown>>({
      id: 'first',
      class: ['first'],
      style: 'padding: 3px',
      'aria-label': 'First',
      onClick: first,
    });
    const w = mount(
      defineComponent({ setup: () => () => h(Flex, attrs.value, () => h('span', 'Content')) }),
    );
    await w.trigger('click');
    expect(first).toHaveBeenCalledTimes(1);
    attrs.value = {
      id: 'second',
      class: { second: true },
      style: [{ margin: '5px' }, 'padding: 9px'],
      'aria-label': 'Second',
      onClick: second,
    };
    await nextTick();
    expect(w.attributes('id')).toBe('second');
    expect(w.attributes('aria-label')).toBe('Second');
    expect(w.classes()).toContain('second');
    expect(w.classes()).not.toContain('first');
    expect(html(w.element).style.padding).toBe('9px');
    await w.trigger('click');
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
    expect(second.mock.calls[0]?.[0]).toBeInstanceOf(MouseEvent);
    attrs.value = {};
    await nextTick();
    expect(w.attributes('id')).toBeUndefined();
    expect(w.attributes('aria-label')).toBeUndefined();
    expect(w.classes()).not.toContain('second');
    expect(html(w.element).style.padding).toBe('');
    expect(html(w.element).style.margin).toBe('');
    await w.trigger('click');
    expect(second).toHaveBeenCalledTimes(1);
    w.unmount();
  });

  it('keeps prop flex/gap priority while replacing all native style forms', async () => {
    const style = shallowRef<StyleValue>('gap: 99px; flex: 9; padding: 3px');
    const w = mount(
      defineComponent({
        setup: () => () => h(Flex, { flex: 0, gap: 0, style: style.value }, () => 'Content'),
      }),
    );
    expect(html(w.element).style.gap).toBe('0px');
    expect(html(w.element).style.flexGrow).toBe('0');
    style.value = ['padding: 4px', { margin: '5px' }];
    await nextTick();
    expect(html(w.element).style.padding).toBe('4px');
    expect(html(w.element).style.gap).toBe('0px');
    style.value = { padding: '6px' };
    await nextTick();
    expect(html(w.element).style.padding).toBe('6px');
    expect(html(w.element).style.margin).toBe('');
    w.unmount();
  });

  it('exposes actual single-root Vue component HTML rather than the component instance', async () => {
    const w = mount(Flex, {
      props: { component: NativeHost },
      attrs: { id: 'business-host' },
      slots: { default: () => 'Content' },
    });
    expect(w.vm.nativeElement).toBe(w.element);
    expect(w.element.tagName).toBe('SECTION');
    expect(w.attributes('id')).toBe('business-host');
    await w.setProps({ component: 'article' });
    expect(w.vm.nativeElement).toBe(w.element);
    expect(w.element.tagName).toBe('ARTICLE');
    const exposed = w.vm;
    w.unmount();
    expect(exposed.nativeElement).toBeNull();
  });

  it('exposes null for custom components with no single HTML host', () => {
    const FragmentHost = defineComponent({
      inheritAttrs: false,
      setup: () => () => h(Fragment, [h('span', 'One'), h('span', 'Two')]),
    });
    const w = mount(Flex, { props: { component: FragmentHost } });
    expect(w.vm.nativeElement).toBeNull();
    w.unmount();
  });

  it('supports functional Vue roots and returns null for non-HTML roots', () => {
    const FunctionalHost: FunctionalComponent = (_props, { attrs, slots }) =>
      h('article', attrs, slots.default?.());
    const w = mount(Flex, {
      props: { component: FunctionalHost },
      slots: { default: () => 'Functional' },
    });
    expect(w.vm.nativeElement).toBe(w.element);
    expect(w.element.tagName).toBe('ARTICLE');
    w.unmount();
    const svg = mount(Flex, { props: { component: 'svg' } });
    expect(svg.vm.nativeElement).toBeNull();
    svg.unmount();
  });

  it.each(alignItemsValues)('consumes explicit align=%s, including stretch', (align) => {
    const w = mount(Flex, { props: { align }, slots: { default: () => 'Content' } });
    expect(w.classes()).toContain(`apollo-flex-align-${align}`);
    w.unmount();
  });

  it('updates every main alignment and wrap branch without leaking layout props', async () => {
    const w = mount(Flex, { slots: { default: () => 'Content' } });
    for (const justify of justifyContentValues) {
      await w.setProps({ justify });
      expect(w.classes()).toContain(`apollo-flex-justify-${justify}`);
      expect(w.attributes('justify')).toBeUndefined();
    }
    for (const wrap of ['wrap', 'nowrap', 'wrap-reverse'] as const) {
      await w.setProps({ wrap });
      expect(w.classes()).toContain(`apollo-flex-wrap-${wrap}`);
    }
    await w.setProps({ wrap: false });
    expect(w.classes().some((c) => c.startsWith('apollo-flex-wrap-'))).toBe(false);
    w.unmount();
  });

  it('preserves complete default content, stable child identity and native focus across appearance updates', async () => {
    const gap = ref(0),
      shown = ref(true);
    const w = mount(
      defineComponent({
        setup: () => () =>
          h(
            Flex,
            { gap: gap.value },
            shown.value
              ? {
                  default: () => [
                    h('strong', 'Complete'),
                    ' text ',
                    0,
                    h(Fragment, [
                      h('input', { key: 'draft', 'aria-label': 'Draft' }),
                      h('em', 'Tail'),
                    ]),
                  ],
                }
              : {},
          ),
      }),
      { attachTo: document.body },
    );
    const input = w.get('input').element;
    expect(w.text()).toContain('Complete text 0Tail');
    if (!(input instanceof HTMLInputElement)) throw new Error('Expected input');
    input.value = 'Preserved draft';
    input.focus();
    input.setSelectionRange(2, 6);
    gap.value = 10.5;
    await nextTick();
    expect(w.get('input').element).toBe(input);
    expect(document.activeElement).toBe(input);
    expect(input.value).toBe('Preserved draft');
    expect([input.selectionStart, input.selectionEnd]).toEqual([2, 6]);
    const root = w.element;
    shown.value = false;
    await nextTick();
    expect(w.element).toBe(root);
    expect(w.text()).toBe('');
    shown.value = true;
    await nextTick();
    expect(w.get('strong').text()).toBe('Complete');
    w.unmount();
  });

  it('honors explicit native dir ahead of Provider and responds to its removal', async () => {
    const dir = ref<string | undefined>('ltr');
    const config = reactive({ ...DEFAULT_CONFIG_CONTEXT, direction: 'rtl' as const });
    const w = mount(
      defineComponent({
        setup() {
          provide(configContextKey, config);
          return () => h(Flex, { dir: dir.value }, () => 'Business');
        },
      }),
    );
    expect(w.attributes('dir')).toBe('ltr');
    expect(w.classes()).not.toContain('apollo-flex-rtl');
    dir.value = undefined;
    await nextTick();
    expect(w.attributes('dir')).toBe('rtl');
    expect(w.classes()).toContain('apollo-flex-rtl');
    w.unmount();
  });

  it('resolves the three gap aliases from current ThemeProvider without global CSS injection', async () => {
    const theme = shallowRef({ token: { paddingXS: 19, padding: 23, paddingLG: 29 } });
    const w = mount(
      defineComponent({
        setup: () => () =>
          h(ThemeProvider, { theme: theme.value }, () =>
            h(Flex, { gap: 'small' }, () => 'Business'),
          ),
      }),
    );
    expect(html(w.get('.apollo-flex').element).style.getPropertyValue('--apollo-padding-xs')).toBe(
      '19px',
    );
    expect(html(w.get('.apollo-flex').element).style.getPropertyValue('--apollo-padding')).toBe(
      '23px',
    );
    expect(html(w.get('.apollo-flex').element).style.getPropertyValue('--apollo-padding-lg')).toBe(
      '29px',
    );
    theme.value = { token: { paddingXS: 31, padding: 37, paddingLG: 41 } };
    await nextTick();
    expect(html(w.get('.apollo-flex').element).style.getPropertyValue('--apollo-padding-xs')).toBe(
      '31px',
    );
    expect(document.documentElement.style.getPropertyValue('--apollo-padding-xs')).toBe('');
    w.unmount();
  });

  it('isolates nested default ThemeProvider from an outer Flex alias scope', () => {
    const w = mount(ThemeProvider, {
      props: { theme: { token: { paddingXS: 19 } } },
      slots: {
        default: () =>
          h(Flex, { gap: 'small' }, () =>
            h(ThemeProvider, { theme: {} }, () =>
              h(Flex, { gap: 'small', id: 'inner' }, () => 'Inner'),
            ),
          ),
      },
    });
    expect(html(w.get('#inner').element).style.getPropertyValue('--apollo-padding-xs')).toBe(
      `${getDesignToken().paddingXS}px`,
    );
    w.unmount();
  });

  it('updates direction props with correct precedence and preserves separate instances', async () => {
    const local = reactive({
      orientation: undefined as 'horizontal' | 'vertical' | undefined,
      vertical: undefined as boolean | undefined,
    });
    const config = reactive({
      ...DEFAULT_CONFIG_CONTEXT,
      components: { flex: { vertical: true } },
    });
    const w = mount(
      defineComponent({
        setup() {
          provide(configContextKey, config);
          return () =>
            h('div', [
              h(Flex, { ...local, id: 'first' }, () => 'One'),
              h(Flex, { vertical: false, id: 'second' }, () => 'Two'),
            ]);
        },
      }),
    );
    expect(w.get('#first').classes()).toContain('apollo-flex-vertical');
    expect(w.get('#second').classes()).not.toContain('apollo-flex-vertical');
    local.vertical = false;
    await nextTick();
    expect(w.get('#first').classes()).not.toContain('apollo-flex-vertical');
    local.orientation = 'vertical';
    await nextTick();
    expect(w.get('#first').classes()).toContain('apollo-flex-vertical');
    local.orientation = undefined;
    local.vertical = undefined;
    await nextTick();
    expect(w.get('#first').classes()).toContain('apollo-flex-vertical');
    w.unmount();
  });
});
