import { token2CSSVar } from '@apollo-design/theme';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  Comment,
  createSSRApp,
  defineComponent,
  Fragment,
  h,
  nextTick,
  onMounted,
  ref,
  type StyleValue,
  shallowRef,
} from 'vue';
import { renderToString } from 'vue/server-renderer';
import buttonTokenValues from '../../../../../tests/browser/fixtures/button-token-values.json';
import { ConfigProvider, type ConfigProviderProps } from '../../config-provider';
import { Button } from '../index';
import type { ButtonColorType, ButtonRef, ButtonVariantType } from '../interface';

const mounted: { unmount(): void }[] = [];
afterEach(() => {
  for (const w of mounted.splice(0)) w.unmount();
  if (vi.isFakeTimers()) vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});
const track = <T extends { unmount(): void }>(w: T): T => {
  mounted.push(w);
  return w;
};
const render = (fn: () => ReturnType<typeof h>) =>
  track(
    mount(defineComponent({ setup: () => fn }), {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    }),
  );
const colors: ButtonColorType[] = [
  'default',
  'primary',
  'danger',
  'blue',
  'purple',
  'cyan',
  'green',
  'magenta',
  'pink',
  'red',
  'orange',
  'yellow',
  'volcano',
  'geekblue',
  'lime',
  'gold',
];
const variants: ButtonVariantType[] = ['outlined', 'dashed', 'solid', 'filled', 'text', 'link'];

export const buttonAuditTokens = buttonTokenValues;
const lengths = new Set([
  'iconGap',
  'paddingInline',
  'paddingInlineLG',
  'paddingInlineSM',
  'paddingBlock',
  'paddingBlockLG',
  'paddingBlockSM',
  'onlyIconSize',
  'onlyIconSizeLG',
  'onlyIconSizeSM',
  'contentFontSize',
  'contentFontSizeLG',
  'contentFontSizeSM',
]);

describe('Button complete public contracts', () => {
  it.each(colors)('consumes independently provided color %s', (color) => {
    const w = track(mount(Button, { props: { color }, slots: { default: () => 'Save' } }));
    expect(w.classes()).toContain(`apollo-btn-color-${color === 'danger' ? 'dangerous' : color}`);
  });
  it.each(variants)('consumes independently provided variant %s', (variant) => {
    const w = track(mount(Button, { props: { variant }, slots: { default: () => 'Save' } }));
    expect(w.classes()).toContain(`apollo-btn-variant-${variant}`);
  });
  it('reads current Provider fields after replacement, removal and restoration without changing root', async () => {
    const components = shallowRef<ConfigProviderProps['components']>();
    const w = render(() =>
      h(
        ConfigProvider,
        { components: components.value },
        { default: () => h(Button, null, () => '保存') },
      ),
    );
    const original = w.get('button').element;
    for (const name of ['first', 'second']) {
      components.value = {
        button: {
          className: name,
          style: { paddingInline: '13px' },
          shape: 'round',
          color: 'danger',
          variant: 'solid',
          autoInsertSpace: false,
          classNames: { content: `${name}-content` },
          styles: { content: { opacity: 0.8 } },
        },
      };
      await nextTick();
      expect(w.get('button').element).toBe(original);
      expect(w.get('button').classes()).toEqual(
        expect.arrayContaining([
          name,
          'apollo-btn-round',
          'apollo-btn-color-dangerous',
          'apollo-btn-variant-solid',
        ]),
      );
      expect(w.get(`.${name}-content`).text()).toBe('保存');
    }
    components.value = undefined;
    await nextTick();
    expect(w.get('button').classes()).not.toContain('second');
    expect(w.get<HTMLElement>('button').element.style.paddingInline).toBe('');
  });
  it('materializes each full Vue slot only once per render', () => {
    const slots = {
      default: vi.fn(() => [h(Comment), h('b', 'Save'), h('em', 'Tail')]),
      icon: vi.fn(() => h('i', 'Icon')),
    };
    track(mount(Button, { slots }));
    expect(slots.default).toHaveBeenCalledTimes(1);
    expect(slots.icon).toHaveBeenCalledTimes(1);
  });
  it('owns current native direction while respecting explicit native dir and its removal', async () => {
    const rtl = ref(false),
      native = ref<string>();
    const w = render(() =>
      h(ConfigProvider, { direction: rtl.value ? 'rtl' : 'ltr' }, () =>
        h(Button, { dir: native.value }, () => 'Save'),
      ),
    );
    expect(w.get('button').attributes('dir')).toBe('ltr');
    rtl.value = true;
    await nextTick();
    expect(w.get('button').attributes('dir')).toBe('rtl');
    native.value = 'ltr';
    await nextTick();
    expect(w.get('button').attributes('dir')).toBe('ltr');
    native.value = undefined;
    await nextTick();
    expect(w.get('button').attributes('dir')).toBe('rtl');
  });
  it('reads dynamically added/empty/removed icon slots before the fallback data prop', async () => {
    const present = ref(false),
      empty = ref(false);
    const w = render(() =>
      h(
        Button,
        { icon: 'fallback' },
        {
          default: () => 'Save',
          ...(present.value
            ? {
                icon: () => (empty.value ? [h(Comment)] : [h('i', 'Current icon'), h('b', 'Tail')]),
              }
            : {}),
        },
      ),
    );
    present.value = true;
    await nextTick();
    expect(w.get('.apollo-btn-icon').text()).toBe('Current iconTail');
    empty.value = true;
    await nextTick();
    expect(w.find('.apollo-btn-icon').exists()).toBe(false);
    present.value = false;
    await nextTick();
    expect(w.get('.apollo-btn-icon').text()).toBe('fallback');
  });
  it('reads dynamically added/empty/removed complete default slots', async () => {
    const present = ref(false),
      empty = ref(false);
    const w = render(() =>
      h(
        Button,
        { icon: '*' },
        present.value
          ? {
              default: () =>
                empty.value ? [h(Fragment, null, [h(Comment)])] : [h('b', 'Save'), h('em', 'Tail')],
            }
          : {},
      ),
    );
    for (let cycle = 0; cycle < 2; cycle++) {
      present.value = true;
      await nextTick();
      expect(w.text()).toContain('SaveTail');
      empty.value = true;
      await nextTick();
      expect(w.find('.apollo-btn-content').exists()).toBe(false);
      present.value = false;
      empty.value = false;
      await nextTick();
      expect(w.classes()).toContain('apollo-btn-icon-only');
    }
  });
  it('owns content styles without cloning business children or changing their props', async () => {
    const applied = ref(false);
    const w = render(() =>
      h(
        Button,
        {
          classNames: { content: 'owned-content' },
          styles: applied.value ? { content: { opacity: 0.4 } } : undefined,
        },
        () => h('span', { class: 'business-label', style: { opacity: 0.9 } }, 'Label'),
      ),
    );
    const label = w.get('.business-label').element;
    expect(w.get('.owned-content').element).not.toBe(label);
    applied.value = true;
    await nextTick();
    expect(w.get('.business-label').element).toBe(label);
    expect(w.get<HTMLElement>('.business-label').element.style.opacity).toBe('0.9');
    expect(w.get<HTMLElement>('.owned-content').element.style.opacity).toBe('0.4');
  });
  it('keeps caller Chinese text and accessible name while applying visual spacing', () => {
    const w = track(mount(Button, { slots: { default: () => '确定' } }));
    expect(w.text()).toBe('确定');
    expect(w.classes()).toContain('apollo-btn-two-chinese-chars');
    const element = track(mount(Button, { slots: { default: () => h('span', '保存') } }));
    expect(element.get('.apollo-btn-content span').text()).toBe('保存');
  });
  it('makes square an effective shape', () => {
    const w = track(
      mount(Button, { props: { shape: 'square' }, slots: { default: () => 'Save' } }),
    );
    expect(w.classes()).toContain('apollo-btn-square');
  });
  it('retains explicit tabindex for enabled anchors and protects disabled anchors', async () => {
    const w = track(
      mount(Button, {
        props: { href: '#target' },
        attrs: { tabindex: -1 },
        slots: { default: () => 'Link' },
      }),
    );
    expect(w.attributes('tabindex')).toBe('-1');
    await w.setProps({ disabled: true });
    expect(w.attributes('tabindex')).toBe('-1');
    expect(w.attributes('aria-disabled')).toBe('true');
    expect(w.attributes('href')).toBeUndefined();
    await w.setProps({ disabled: false });
    expect(w.attributes('tabindex')).toBe('-1');
    expect(w.attributes('href')).toBe('#target');
  });
  it('blocks requested loading immediately while delaying only the indicator', async () => {
    vi.useFakeTimers();
    const click = vi.fn();
    const w = track(
      mount(Button, {
        props: { loading: { delay: 100 } },
        attrs: { onClick: click },
        slots: { default: () => 'Save' },
      }),
    );
    expect(w.attributes('aria-busy')).toBe('true');
    expect(w.attributes('aria-disabled')).toBe('true');
    expect(w.find('.apollo-btn-loading-icon').exists()).toBe(false);
    await w.trigger('click');
    expect(click).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    await nextTick();
    expect(w.classes()).toContain('apollo-btn-loading');
  });
  it('does not restart a pending delay when only loading icon data changes', async () => {
    vi.useFakeTimers();
    const w = track(
      mount(Button, {
        props: { loading: { delay: 100, icon: 'First' } },
        slots: { default: () => 'Save' },
      }),
    );
    vi.advanceTimersByTime(50);
    await w.setProps({ loading: { delay: 100, icon: 'Second' } });
    vi.advanceTimersByTime(50);
    await nextTick();
    expect(w.classes()).toContain('apollo-btn-loading');
    expect(w.text()).toContain('Second');
  });
  it('uses explicit zero and empty loading icons instead of truthiness fallbacks', async () => {
    const w = track(
      mount(Button, { props: { loading: { icon: 0 } }, slots: { default: () => 'Save' } }),
    );
    expect(w.get('.apollo-btn-icon').text()).toBe('0');
    await w.setProps({ loading: { icon: false } });
    expect(w.find('.apollo-btn-icon').exists()).toBe(false);
    await w.setProps({ loading: false, icon: 0 });
    expect(w.get('.apollo-btn-icon').text()).toBe('0');
  });
  it('removes pending loading anchor navigation while preserving focus and restores it on cancel', async () => {
    vi.useFakeTimers();
    const w = track(
      mount(Button, {
        props: { href: '#target' },
        slots: { default: () => 'Navigate' },
        attachTo: document.body,
      }),
    );
    w.get<HTMLAnchorElement>('a').element.focus();
    await w.setProps({ loading: { delay: 100 } });
    expect(w.attributes('href')).toBeUndefined();
    expect(document.activeElement).toBe(w.element);
    expect(w.attributes('tabindex')).toBe('0');
    await w.setProps({ loading: false });
    expect(w.attributes('href')).toBe('#target');
    expect(document.activeElement).toBe(w.element);
  });
  it('anchors keep link semantics when disabled or pending and preserve explicit native roles', async () => {
    const w = track(
      mount(Button, {
        props: { href: '#target', disabled: true },
        slots: { default: () => 'Navigate' },
      }),
    );
    expect(w.attributes('role')).toBe('link');
    await w.setProps({ disabled: false, loading: { delay: 1000 } });
    expect(w.attributes('role')).toBe('link');
    await w.setProps({ loading: false });
    expect(w.attributes('role')).toBeUndefined();
    const explicit = track(
      mount(Button, {
        props: { href: '#target', disabled: true },
        attrs: { role: 'button' },
        slots: { default: () => 'Native override' },
      }),
    );
    expect(explicit.attributes('role')).toBe('button');
  });
  it('never schedules client delay timers during SSR', async () => {
    vi.useFakeTimers();
    const html = await renderToString(
      createSSRApp({ render: () => h(Button, { loading: { delay: 100 } }, () => 'Server save') }),
    );
    expect(vi.getTimerCount()).toBe(0);
    expect(html).toContain('Server save');
    expect(html).toContain('aria-busy="true"');
  });
  it('cleans repeated pending delays on cancellation, unmount and independent remount', async () => {
    vi.useFakeTimers();
    const w = track(
      mount(Button, { props: { loading: { delay: 100 } }, slots: { default: () => 'Save' } }),
    );
    expect(vi.getTimerCount()).toBe(1);
    await w.setProps({ loading: false });
    expect(vi.getTimerCount()).toBe(0);
    await w.setProps({ loading: { delay: 200 } });
    expect(vi.getTimerCount()).toBe(1);
    w.unmount();
    mounted.splice(mounted.indexOf(w), 1);
    expect(vi.getTimerCount()).toBe(0);
  });
  it('keeps valid native style forms, root focus and a real nullable expose', async () => {
    const style = shallowRef<StyleValue>('padding-inline:13px');
    const visible = ref(true);
    const instance = shallowRef<ButtonRef | null>(null);
    const w = render(() =>
      visible.value
        ? h(
            Button,
            { ref: instance, style: style.value, styles: { root: { paddingInline: '3px' } } },
            () => 'Save',
          )
        : h('p', 'Removed'),
    );
    const root = w.get<HTMLButtonElement>('button');
    root.element.focus();
    const exposed = instance.value;
    for (const value of [[{ paddingInline: '17px' }], { paddingInline: '19px' }, undefined]) {
      style.value = value;
      await nextTick();
      expect(w.get('button').element).toBe(root.element);
      expect(document.activeElement).toBe(root.element);
    }
    expect(root.element.style.paddingInline).toBe('3px');
    visible.value = false;
    await nextTick();
    expect(exposed?.nativeElement).toBeNull();
  });
  it('preserves child component state and refs across styles, theme and content updates', async () => {
    const text = ref('Draft'),
      themed = ref(false),
      count = ref(0),
      child = shallowRef<HTMLElement | null>(null);
    const Probe = defineComponent({
      setup() {
        onMounted(() => count.value++);
        return () => h('span', { ref: child }, text.value);
      },
    });
    const w = render(() =>
      h(
        ConfigProvider,
        { theme: themed.value ? { components: { Button: { contentFontSize: 19 } } } : undefined },
        {
          default: () =>
            h(Button, { styles: { content: { opacity: themed.value ? 0.8 : 1 } } }, () => [
              h(Comment),
              h(Probe),
              h('b', 'Tail'),
            ]),
        },
      ),
    );
    const original = child.value;
    text.value = 'Updated';
    themed.value = true;
    await nextTick();
    expect(child.value).toBe(original);
    expect(count.value).toBe(1);
    expect(w.text()).toContain('UpdatedTail');
  });
  it('does not issue obsolete string icon naming warnings for valid Vue text content', () => {
    const warn = vi.spyOn(console, 'error').mockImplementation(() => {});
    const w = track(
      mount(Button, { props: { icon: 'custom text icon' }, slots: { default: () => 'Save' } }),
    );
    expect(w.text()).toContain('custom text icon');
    expect(warn).not.toHaveBeenCalled();
  });
  it('keeps shared current token derivation alive after its first consumer unmounts', async () => {
    const first = ref(true),
      font = ref(18);
    const w = render(() =>
      h(
        ConfigProvider,
        { theme: { components: { Button: { contentFontSize: font.value } } } },
        () => [
          first.value ? h(Button, { key: 'first' }, () => 'First') : null,
          h(Button, { key: 'second', class: 'second' }, () => 'Second'),
        ],
      ),
    );
    const node = w.get('.second').element;
    first.value = false;
    font.value = 21;
    await nextTick();
    expect(w.get('.second').element).toBe(node);
    expect(
      w
        .get<HTMLElement>('.second')
        .element.style.getPropertyValue('--apollo-btn-content-font-size'),
    ).toBe('21px');
  });
  it('owns a decorative loading graphic while native busy semantics carry status', () => {
    const w = track(mount(Button, { props: { loading: true }, slots: { default: () => 'Save' } }));
    expect(w.attributes('aria-busy')).toBe('true');
    expect(w.get('svg').attributes('aria-hidden')).toBe('true');
    expect(w.get('svg').attributes('focusable')).toBe('false');
  });
  it('accepts current component icon definitions from normal reactive Provider objects without Vue warnings', async () => {
    const First = defineComponent({ setup: () => () => h('i', 'First reactive glyph') });
    const Second = defineComponent({ setup: () => () => h('i', 'Second reactive glyph') });
    const components = ref({ button: { loadingIcon: First } });
    const warnings = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const w = render(() =>
      h(ConfigProvider, { components: components.value }, () =>
        h(Button, { loading: true }, () => 'Save'),
      ),
    );
    expect(w.get('i').text()).toBe('First reactive glyph');
    components.value = { button: { loadingIcon: Second } };
    await nextTick();
    expect(w.get('i').text()).toBe('Second reactive glyph');
    expect(warnings).not.toHaveBeenCalled();
  });
  it('records all 58 existing token fields without dropping legacy or preset fields', () => {
    expect(Object.keys(buttonAuditTokens)).toHaveLength(58);
  });
  it.each(Object.entries(buttonAuditTokens))(
    'consumes published component token %s on the owning root',
    (name, value) => {
      const w = render(() =>
        h(
          ConfigProvider,
          { theme: { components: { Button: buttonAuditTokens } } },
          { default: () => h(Button, null, () => 'Save') },
        ),
      );
      const expected =
        typeof value === 'number' && lengths.has(name) ? `${value}px` : String(value);
      expect(
        w
          .get<HTMLElement>('button')
          .element.style.getPropertyValue(token2CSSVar(name, 'apollo-btn')),
      ).toBe(expected);
    },
  );
});
