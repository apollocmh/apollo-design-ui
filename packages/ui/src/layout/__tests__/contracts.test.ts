import { compactAlgorithm, type ThemeConfig, ThemeProvider, useTheme } from '@apollo-design/theme';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSSRApp, defineComponent, Fragment, h, nextTick, ref, type VNodeChild } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { ConfigProvider } from '../../config-provider';
import { Content, Footer, Header, Layout, Sider } from '../index';

const cleanup: Array<() => void> = [];
const host = (render: () => VNodeChild) => {
  const wrapper = mount(defineComponent({ setup: () => render }), {
    attachTo: document.body,
    global: { stubs: { teleport: false } },
  });
  cleanup.push(() => wrapper.unmount());
  return wrapper;
};
afterEach(() => {
  for (const dispose of cleanup.splice(0)) dispose();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.body.replaceChildren();
});

function mediaFixture(legacy = false) {
  const queries: Array<{
    media: string;
    matches: boolean;
    listeners: Set<(event: { matches: boolean }) => void>;
    change: (matches: boolean) => void;
  }> = [];
  const matchMedia = vi.fn((media: string) => {
    const listeners = new Set<(event: { matches: boolean }) => void>();
    const query = {
      media,
      matches: true,
      listeners,
      change(matches: boolean) {
        this.matches = matches;
        for (const listener of listeners) listener({ matches });
      },
    };
    queries.push(query);
    const add = (listener: (event: { matches: boolean }) => void) => listeners.add(listener);
    const remove = (listener: (event: { matches: boolean }) => void) => listeners.delete(listener);
    return Object.assign(
      query,
      legacy
        ? { addListener: add, removeListener: remove }
        : {
            addEventListener: (_name: string, listener: (event: { matches: boolean }) => void) =>
              add(listener),
            removeEventListener: (_name: string, listener: (event: { matches: boolean }) => void) =>
              remove(listener),
          },
    );
  });
  vi.stubGlobal('matchMedia', matchMedia);
  return { queries, matchMedia };
}

describe('LAYOUT-01 current native styles and Provider', () => {
  it.each([Layout, Sider])(
    '$name retains string and array native style through updates',
    async (component) => {
      const style = ref<string | Array<Record<string, string>>>(
        'color: rgb(1, 2, 3); --draft-tone: red',
      );
      const wrapper = host(() =>
        h(component, { style: style.value }, () => h('input', { value: 'draft' })),
      );
      const root = wrapper.get<HTMLElement>(component === Layout ? '.apollo-layout' : 'aside');
      const input = wrapper.get<HTMLInputElement>('input').element;
      input.focus();
      input.setSelectionRange(1, 3);
      expect(root.element.style.color).toBe('rgb(1, 2, 3)');
      style.value = [{ color: 'rgb(4, 5, 6)' }, { '--draft-tone': 'blue', paddingTop: '3px' }];
      await nextTick();
      expect(root.element.style.color).toBe('rgb(4, 5, 6)');
      expect(root.element.style.paddingTop).toBe('3px');
      expect(root.element.style.getPropertyValue('--draft-tone')).toBe('blue');
      expect(wrapper.get('input').element).toBe(input);
      expect(document.activeElement).toBe(input);
      expect([input.selectionStart, input.selectionEnd]).toEqual([1, 3]);
    },
  );

  it('uses current direction and Provider class/style after replacement and removal', async () => {
    const rtl = ref(false);
    const configured = ref(true);
    const wrapper = host(() =>
      h(
        ConfigProvider,
        {
          direction: rtl.value ? 'rtl' : 'ltr',
          components: configured.value
            ? { layout: { className: 'provided', style: { color: 'red' } } }
            : {},
        },
        () =>
          h(Layout, null, () => [
            h(Sider, { collapsible: true }),
            h(Content, null, () => 'Content'),
          ]),
      ),
    );
    expect(wrapper.get('.apollo-layout').classes()).toContain('provided');
    expect(wrapper.find('.apollo-layout-sider-trigger .apollo-icon-left').exists()).toBe(true);
    rtl.value = true;
    await nextTick();
    expect(wrapper.get('.apollo-layout').classes()).toContain('apollo-layout-rtl');
    expect(wrapper.find('.apollo-layout-sider-trigger .apollo-icon-right').exists()).toBe(true);
    configured.value = false;
    await nextTick();
    expect(wrapper.get('.apollo-layout').classes()).not.toContain('provided');
    expect(wrapper.get<HTMLElement>('.apollo-layout').element.style.color).toBe('');
  });

  it('retains native style and content for independent Header/Footer/Content', () => {
    for (const component of [Header, Footer, Content]) {
      const wrapper = host(() =>
        h(component, { style: ['color: red', { paddingTop: '2px' }] }, () => [h('b', 'rich'), 0]),
      );
      expect(wrapper.text()).toBe('rich0');
      expect(
        wrapper.get<HTMLElement>(
          component === Header ? 'header' : component === Footer ? 'footer' : 'main',
        ).element.style.paddingTop,
      ).toBe('2px');
    }
  });
});

describe('LAYOUT-02 complete Vue trigger and state', () => {
  it.each([80, 0])(
    'uses an accessible native button with collapsedWidth=%s',
    async (collapsedWidth) => {
      const wrapper = host(() =>
        h(Sider, { collapsible: true, collapsedWidth }, () =>
          h('input', { 'aria-label': 'Draft' }),
        ),
      );
      const trigger = wrapper.get<HTMLElement>(
        collapsedWidth ? '.apollo-layout-sider-trigger' : '.apollo-layout-sider-zero-width-trigger',
      );
      expect(trigger.element.tagName).toBe('BUTTON');
      expect(trigger.attributes('type')).toBe('button');
      expect(trigger.attributes('aria-expanded')).toBe('true');
      expect(trigger.attributes('aria-label')).toBeTruthy();
      const target = trigger.attributes('aria-controls');
      expect(target).toBeTruthy();
      expect(wrapper.get('.apollo-layout-sider-children').attributes('id')).toBe(target);
      await trigger.trigger('click');
      expect(trigger.attributes('aria-expanded')).toBe('false');
    },
  );

  it('reads conditional trigger slots in render; presence wins over data including null', async () => {
    const mode = ref(0);
    const wrapper = host(() =>
      h(
        Sider,
        { collapsible: true, trigger: 'prop content' },
        mode.value ? { trigger: () => (mode.value === 2 ? [] : [h('b', 'slot'), 0]) } : {},
      ),
    );
    expect(wrapper.get('.apollo-layout-sider-trigger').text()).toBe('prop content');
    for (const value of [1, 2, 0, 1]) {
      mode.value = value;
      await nextTick();
      expect(wrapper.get('.apollo-layout-sider-trigger').text()).toBe(
        value === 2 ? '' : value ? 'slot0' : 'prop content',
      );
    }
    const override = host(() =>
      h(Sider, { collapsible: true, trigger: null }, { trigger: () => ['current', 0] }),
    );
    expect(override.get('.apollo-layout-sider-trigger').text()).toBe('current0');
  });

  it('emits typed state requests once and never forwards business callbacks to native DOM', async () => {
    const collapse = vi.fn();
    const wrapper = host(() => h(Sider, { collapsible: true, onCollapse: collapse }));
    await wrapper.get('aside').trigger('collapse');
    expect(collapse).not.toHaveBeenCalled();
    await wrapper.get('.apollo-layout-sider-trigger').trigger('click');
    expect(collapse).toHaveBeenCalledExactlyOnceWith(true, 'clickTrigger');
    expect(wrapper.findComponent(Sider).emitted('update:collapsed')).toEqual([[true]]);
  });

  it('keeps the last accepted controlled value when control is removed', async () => {
    const collapsed = ref<boolean | undefined>(false);
    const wrapper = host(() => h(Sider, { collapsible: true, collapsed: collapsed.value }));
    await wrapper.get('.apollo-layout-sider-trigger').trigger('click');
    expect(wrapper.get('aside').classes()).not.toContain('apollo-layout-sider-collapsed');
    collapsed.value = true;
    await nextTick();
    collapsed.value = undefined;
    await nextTick();
    expect(wrapper.get('aside').classes()).toContain('apollo-layout-sider-collapsed');
  });

  it('uses defaultCollapsed only for initialization and again on remount', async () => {
    const initial = ref(true),
      present = ref(true);
    const wrapper = host(() =>
      present.value ? h(Sider, { collapsible: true, defaultCollapsed: initial.value }) : null,
    );
    const original = wrapper.get('aside').element;
    expect(wrapper.get('aside').classes()).toContain('apollo-layout-sider-collapsed');
    initial.value = false;
    await nextTick();
    expect(wrapper.get('aside').classes()).toContain('apollo-layout-sider-collapsed');
    await wrapper.get('button').trigger('click');
    initial.value = true;
    await nextTick();
    expect(wrapper.get('aside').classes()).not.toContain('apollo-layout-sider-collapsed');
    present.value = false;
    await nextTick();
    present.value = true;
    await nextTick();
    expect(wrapper.get('aside').element).not.toBe(original);
    expect(wrapper.get('aside').classes()).toContain('apollo-layout-sider-collapsed');
  });

  it('hides zero-width body from accessibility/focus while retaining the input instance and draft', async () => {
    const wrapper = host(() =>
      h(Sider, { collapsible: true, collapsedWidth: 0 }, () =>
        h('input', { 'aria-label': 'Draft' }),
      ),
    );
    const input = wrapper.get<HTMLInputElement>('input');
    await input.setValue('retained draft');
    await wrapper.get('.apollo-layout-sider-zero-width-trigger').trigger('click');
    expect(wrapper.get('.apollo-layout-sider-children').attributes('inert')).toBeDefined();
    expect(wrapper.get('.apollo-layout-sider-children').attributes('aria-hidden')).toBe('true');
    await wrapper.get('.apollo-layout-sider-zero-width-trigger').trigger('click');
    expect(wrapper.get('input').element).toBe(input.element);
    expect(input.element.value).toBe('retained draft');
    expect(wrapper.get('.apollo-layout-sider-children').attributes('aria-hidden')).toBeUndefined();
  });
});

describe('LAYOUT-03 media lifecycle and SSR structure', () => {
  it('detects Fragment/array Sider on the server while keeping nested Layout separate', async () => {
    const html = await renderToString(
      createSSRApp({
        render: () => h(Layout, null, () => [h(Fragment, null, [h(Sider)]), h(Content)]),
      }),
    );
    expect(html).toContain('class="apollo-layout apollo-layout-has-sider"');
    const nested = await renderToString(
      createSSRApp({ render: () => h(Layout, null, () => h(Layout, null, () => h(Sider))) }),
    );
    expect(nested).toMatch(/^<div class="apollo-layout"(?: style="")?>/);
  });

  it('does not subscribe or emit during SSR even when window exists', async () => {
    const { matchMedia } = mediaFixture();
    const breakpoint = vi.fn();
    await renderToString(
      createSSRApp({ render: () => h(Sider, { breakpoint: 'md', onBreakpoint: breakpoint }) }),
    );
    expect(matchMedia).not.toHaveBeenCalled();
    expect(breakpoint).not.toHaveBeenCalled();
  });

  it('keeps a usable nonresponsive Sider when matchMedia is unavailable', async () => {
    vi.stubGlobal('matchMedia', undefined);
    const breakpoint = vi.fn();
    const wrapper = host(() =>
      h(Sider, { breakpoint: 'md', collapsible: true, onBreakpoint: breakpoint }),
    );
    await nextTick();
    expect(breakpoint).not.toHaveBeenCalled();
    expect(wrapper.get('aside').classes()).not.toContain('apollo-layout-sider-below');
    await wrapper.get('button').trigger('click');
    expect(wrapper.get('aside').classes()).toContain('apollo-layout-sider-collapsed');
  });

  it.each([false, true])(
    'replaces, removes and cleans media subscriptions (legacy=%s)',
    async (legacy) => {
      const { queries } = mediaFixture(legacy);
      const breakpoint = ref<'md' | 'lg' | undefined>('md');
      const present = ref(true);
      const events = vi.fn();
      const wrapper = host(() =>
        present.value ? h(Sider, { breakpoint: breakpoint.value, onBreakpoint: events }) : null,
      );
      await nextTick();
      expect(queries[0]?.listeners.size).toBe(1);
      expect(wrapper.get('aside').classes()).toContain('apollo-layout-sider-below');
      breakpoint.value = 'lg';
      await nextTick();
      expect(queries[0]?.listeners.size).toBe(0);
      expect(queries[1]?.listeners.size).toBe(1);
      breakpoint.value = undefined;
      await nextTick();
      expect(queries[1]?.listeners.size).toBe(0);
      expect(wrapper.get('aside').classes()).not.toContain('apollo-layout-sider-below');
      const count = events.mock.calls.length;
      queries[0]?.change(false);
      queries[1]?.change(false);
      expect(events).toHaveBeenCalledTimes(count);
      breakpoint.value = 'md';
      await nextTick();
      expect(queries[2]?.listeners.size).toBe(1);
      present.value = false;
      await nextTick();
      expect(queries[2]?.listeners.size).toBe(0);
      const beforeRemount = events.mock.calls.length;
      queries[2]?.change(false);
      expect(events).toHaveBeenCalledTimes(beforeRemount);
      present.value = true;
      await nextTick();
      expect(queries[3]?.listeners.size).toBe(1);
      present.value = false;
      await nextTick();
      expect(queries[3]?.listeners.size).toBe(0);
    },
  );
});

describe('LAYOUT-04 all current theme fields', () => {
  it.each([Layout, Header, Footer, Content, Sider])(
    '$name activates and clears shared fallback data without a Provider',
    async (component) => {
      const captured: { context?: ReturnType<typeof useTheme> } = {};
      const Probe = defineComponent({
        setup() {
          captured.context = useTheme();
          return () => h(component, { 'data-fallback-layout': '' });
        },
      });
      const wrapper = host(() => h(Probe));
      const source = captured.context;
      if (!source) throw new Error('The mounted probe must capture its fallback context');
      const previous = source.config.value;
      cleanup.push(() => {
        source.config.value = previous;
      });
      const root = wrapper.get<HTMLElement>('[data-fallback-layout]').element;
      source.config.value = {};
      await nextTick();
      expect(source.sourceActive?.value).toBe(false);
      expect(root.style.getPropertyValue('--apollo-font-size')).toBe('');
      expect(root.style.getPropertyValue('--apollo-layout-source-header-height')).toBe('');
      source.config.value = {
        token: { fontSize: 18 },
        components: { Layout: { headerHeight: 77 } },
      };
      await nextTick();
      expect(source.sourceActive?.value).toBe(true);
      expect(root.style.getPropertyValue('--apollo-font-size')).toBe('18px');
      expect(root.style.getPropertyValue('--apollo-layout-source-header-height')).toBe('77px');
      source.config.value = {};
      await nextTick();
      expect(source.sourceActive?.value).toBe(false);
      expect(root.style.getPropertyValue('--apollo-font-size')).toBe('');
      expect(root.style.getPropertyValue('--apollo-layout-source-header-height')).toBe('');
    },
  );

  it('preserves CSS-only data through an unconfigured Provider and clears removed themes', async () => {
    const config = ref<ThemeConfig>();
    const wrapper = host(() =>
      h(ConfigProvider, { theme: config.value }, () =>
        h(Layout, { style: { '--apollo-font-size': '18px' } }, () => h(Header)),
      ),
    );
    const root = wrapper.get<HTMLElement>('.apollo-layout').element;
    const header = wrapper.get<HTMLElement>('header').element;
    expect(root.style.getPropertyValue('--apollo-font-size')).toBe('18px');
    expect(root.style.getPropertyValue('--apollo-layout-source-header-height')).toBe('');
    expect(header.style.getPropertyValue('--apollo-font-size')).toBe('');
    config.value = { algorithm: compactAlgorithm, components: { Layout: { headerHeight: 77 } } };
    await nextTick();
    await nextTick();
    expect(root.style.getPropertyValue('--apollo-layout-source-header-height')).toBe('77px');
    expect(header.style.getPropertyValue('--apollo-layout-source-header-height')).toBe('');
    config.value = undefined;
    await nextTick();
    await nextTick();
    expect(root.style.getPropertyValue('--apollo-layout-source-header-height')).toBe('');
    expect(root.style.getPropertyValue('--apollo-font-size')).toBe('18px');
  });
  const fields = {
    bodyBg: 'rgb(1, 2, 3)',
    headerBg: 'rgb(4, 5, 6)',
    headerHeight: 72,
    headerPadding: '2px 13px',
    headerColor: 'rgb(7, 8, 9)',
    footerPadding: '3px 9px',
    footerBg: 'rgb(10, 11, 12)',
    siderBg: 'rgb(13, 14, 15)',
    triggerHeight: 37,
    triggerBg: 'rgb(16, 17, 18)',
    triggerColor: 'rgb(19, 20, 21)',
    zeroTriggerWidth: 43,
    zeroTriggerHeight: 45,
    lightSiderBg: 'rgb(22, 23, 24)',
    lightTriggerBg: 'rgb(25, 26, 27)',
    lightTriggerColor: 'rgb(28, 29, 30)',
    colorBgBody: 'rgb(31, 32, 33)',
    colorBgHeader: 'rgb(34, 35, 36)',
    colorBgTrigger: 'rgb(37, 38, 39)',
  };
  it.each([Layout, Header, Footer, Content, Sider])(
    '$name maps explicit theme data to its current local CSS namespace',
    async (component) => {
      const suffix =
        component === Header
          ? '-header'
          : component === Footer
            ? '-footer'
            : component === Content
              ? '-content'
              : component === Sider
                ? '-sider'
                : '';
      const prefix = ref('brand-layout' + suffix);
      const wrapper = host(() =>
        h(ThemeProvider, { theme: { components: { Layout: { headerBg: 'red' } } } }, () =>
          h(component, { prefixCls: prefix.value }),
        ),
      );
      const region = () => wrapper.get<HTMLElement>('.' + prefix.value);
      expect(region().element.style.getPropertyValue('--brand-layout-source-header-bg')).toBe(
        'red',
      );
      prefix.value = 'next-layout' + suffix;
      await nextTick();
      expect(region().element.style.getPropertyValue('--next-layout-source-header-bg')).toBe('red');
      expect(region().element.style.getPropertyValue('--brand-layout-source-header-bg')).toBe('');
    },
  );
  it.each(Object.entries(fields))(
    'consumes current components.Layout.%s and removes it dynamically',
    async (key, value) => {
      const config = ref<ThemeConfig>({
        algorithm: compactAlgorithm,
        components: { Layout: { [key]: value } },
      });
      const wrapper = host(() =>
        h(ThemeProvider, { theme: config.value }, () =>
          h(Layout, null, () => [
            h(Header),
            h(Sider, { collapsible: true }),
            h(Content),
            h(Footer),
          ]),
        ),
      );
      const name =
        '--apollo-layout-source-' + key.replace(/[A-Z]/g, (letter) => '-' + letter.toLowerCase());
      const expected = typeof value === 'number' ? value + 'px' : value;
      expect(wrapper.get<HTMLElement>('.apollo-layout').element.style.getPropertyValue(name)).toBe(
        expected,
      );
      expect(
        wrapper.get<HTMLElement>('.apollo-layout-sider').element.style.getPropertyValue(name),
      ).toBe('');
      expect(
        wrapper
          .get<HTMLElement>('.apollo-layout')
          .element.style.getPropertyValue('--apollo-font-size'),
      ).toBe('12px');
      expect(
        wrapper.get<HTMLElement>('header').element.style.getPropertyValue('--apollo-font-size'),
      ).toBe('');
      config.value = { algorithm: compactAlgorithm };
      await nextTick();
      await nextTick();
      expect(wrapper.get<HTMLElement>('.apollo-layout').element.style.getPropertyValue(name)).toBe(
        'initial',
      );
      expect(
        wrapper.get<HTMLElement>('.apollo-layout-sider').element.style.getPropertyValue(name),
      ).toBe('');
    },
  );
});
