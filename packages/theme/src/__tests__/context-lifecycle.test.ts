import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSSRApp, defineComponent, h, nextTick, provide } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { compactAlgorithm, getDesignToken } from '../get-design-token';
import type { ThemeConfig } from '../types';
import type { ThemeContext } from '../vue';
import { createThemeContext, ThemeContextKey, ThemeProvider, useTheme, useToken } from '../vue';

const cleanup: Array<() => void> = [];
function keep<T extends { unmount: () => void }>(wrapper: T): T {
  cleanup.push(() => wrapper.unmount());
  return wrapper;
}
function reader(seen: ThemeContext[]) {
  return defineComponent({
    setup() {
      const theme = useTheme();
      seen.push(theme);
      return () => h('span', theme.token.value.colorPrimary);
    },
  });
}
function captured(seen: ThemeContext[]): ThemeContext {
  const context = seen[0];
  if (!context) throw new Error('reader did not receive its context');
  return context;
}
afterEach(() => {
  vi.unstubAllGlobals();
  for (const stop of cleanup.splice(0).reverse()) stop();
  vi.restoreAllMocks();
});

describe('writable current theme context', () => {
  it('direct nested Ref writes recompute tokens and explicit empty contexts stay active', () => {
    const context = createThemeContext({ token: { fontSize: 14 } });
    expect(context.token.value.fontSize).toBe(14);
    const token = context.config.value.token;
    if (!token) throw new Error('configured token was lost');
    token.fontSize = 20;
    expect(context.token.value.fontSize).toBe(20);
    context.config.value = { algorithm: compactAlgorithm };
    expect(context.token.value.controlHeight).toBe(28);
    context.config.value = {};
    expect(context.sourceActive?.value).toBe(true);
  });

  it('shares the implicit fallback within one app and isolates separate SSR apps', async () => {
    const first: ThemeContext[] = [];
    const Writer = defineComponent({
      setup() {
        const context = useTheme();
        first.push(context);
        context.config.value = { token: { colorPrimary: '#aa3300' } };
        return () => h('span', context.token.value.colorPrimary);
      },
    });
    const FirstReader = reader(first);
    const html = await renderToString(
      createSSRApp({ render: () => h('div', [h(Writer), h(FirstReader)]) }),
    );
    expect(first).toHaveLength(2);
    expect(first[0]).toBe(first[1]);
    expect(html.match(/#aa3300/g)).toHaveLength(2);
    const second: ThemeContext[] = [];
    await renderToString(createSSRApp(reader(second)));
    expect(captured(second)).not.toBe(captured(first));
    expect(captured(second).token.value.colorPrimary).toBe('#1677ff');
    expect(captured(second).sourceActive?.value).toBe(false);
    captured(second).config.value.token = { fontSize: 18 };
    expect(captured(second).sourceActive?.value).toBe(true);
    captured(second).config.value = {};
    expect(captured(second).sourceActive?.value).toBe(false);
  });

  it('keeps legacy explicitly injected contexts without source metadata', async () => {
    const source = createThemeContext({ token: { colorPrimary: '#0055aa' } });
    const legacy: ThemeContext = { config: source.config, token: source.token };
    const seen: ThemeContext[] = [];
    const Child = reader(seen);
    await renderToString(
      createSSRApp({
        setup() {
          provide(ThemeContextKey, legacy);
          return () => h(Child);
        },
      }),
    );
    expect(captured(seen)).toBe(legacy);
    expect(captured(seen).token.value.colorPrimary).toBe('#0055aa');
  });

  it('local Provider deep writes do not mutate input props and later props stay authoritative', async () => {
    const theme: ThemeConfig = { token: { fontSize: 14 }, components: { Button: { padding: 8 } } };
    const seen: ThemeContext[] = [];
    const wrapper = keep(
      mount(ThemeProvider, { props: { theme }, slots: { default: () => h(reader(seen)) } }),
    );
    const context = captured(seen);
    const local = context.config.value.token;
    if (!local) throw new Error('configured token was lost');
    local.fontSize = 20;
    const localButton = context.config.value.components?.Button;
    if (!localButton) throw new Error('configured component token was lost');
    localButton.padding = 12;
    expect(context.token.value.fontSize).toBe(20);
    expect(theme.token?.fontSize).toBe(14);
    expect(theme.components?.Button?.padding).toBe(8);
    await wrapper.setProps({ theme: { token: { fontSize: 16 } } });
    expect(context.token.value.fontSize).toBe(16);
  });
});

describe('ThemeProvider DOM lifecycle', () => {
  it('the default target is documentElement after mount and restores its prior inline value', () => {
    const root = document.documentElement;
    const previous = root.getAttribute('style');
    try {
      root.style.setProperty('--apollo-color-primary', '#663399', 'important');
      const wrapper = keep(mount(ThemeProvider, { props: { injectCssVar: true } }));
      expect(root.style.getPropertyValue('--apollo-color-primary')).toBe('#1677ff');
      wrapper.unmount();
      expect(root.style.getPropertyValue('--apollo-color-primary')).toBe('#663399');
      expect(root.style.getPropertyPriority('--apollo-color-primary')).toBe('important');
    } finally {
      if (previous === null) root.removeAttribute('style');
      else root.setAttribute('style', previous);
    }
  });

  it('reacts to enable, target, effective config prefix and disable without remounting children', async () => {
    const first = document.createElement('div');
    const second = document.createElement('div');
    const seen: ThemeContext[] = [];
    const Child = reader(seen);
    const wrapper = keep(
      mount(ThemeProvider, {
        props: {
          target: first,
          injectCssVar: false,
          theme: { token: { colorPrimary: '#0055aa' } },
        },
        slots: { default: () => h(Child) },
      }),
    );
    const child = wrapper.find('span').element;
    expect(first.style.length).toBe(0);
    await wrapper.setProps({ injectCssVar: true });
    expect(first.style.getPropertyValue('--apollo-color-primary')).toBe('#0055aa');
    await wrapper.setProps({ target: second });
    expect(first.style.length).toBe(0);
    expect(second.style.getPropertyValue('--apollo-color-primary')).toBe('#0055aa');
    captured(seen).config.value.cssVarPrefix = 'current';
    await nextTick();
    expect(second.style.getPropertyValue('--apollo-color-primary')).toBe('');
    expect(second.style.getPropertyValue('--current-color-primary')).toBe('#0055aa');
    await wrapper.setProps({ injectCssVar: false });
    expect(second.style.length).toBe(0);
    expect(wrapper.find('span').element).toBe(child);
    expect(seen).toHaveLength(1);
  });

  it('releases only its own variables when two mounted providers share a target', () => {
    const target = document.createElement('div');
    const first = keep(mount(ThemeProvider, { props: { target, injectCssVar: true } }));
    keep(
      mount(ThemeProvider, {
        props: { target, injectCssVar: true, theme: { token: { colorPrimary: '#0055aa' } } },
      }),
    );
    first.unmount();
    expect(target.style.getPropertyValue('--apollo-color-primary')).toBe('#0055aa');
  });

  it('SSR with CSS injection neither accesses document nor writes a supplied target', async () => {
    const target = document.createElement('div');
    const svgTarget = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const Read = defineComponent({
      setup() {
        const token = useToken();
        return () => h('span', token.value.colorPrimary);
      },
    });
    vi.stubGlobal('document', undefined);
    for (const suppliedTarget of [undefined, null, target, svgTarget]) {
      const html = await renderToString(
        createSSRApp({
          render: () =>
            h(ThemeProvider, { injectCssVar: true, target: suppliedTarget }, () => h(Read)),
        }),
      );
      expect(html).toContain(getDesignToken().colorPrimary);
      expect(target.style.length).toBe(0);
      expect(svgTarget.style.length).toBe(0);
    }
  });

  it('renderless multi-root attrs have no implicit DOM host or inheritance warnings', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const wrapper = keep(
      mount(ThemeProvider, {
        attrs: { id: 'provider', class: 'host', onClick: () => {} },
        slots: { default: () => [h('button', 'first'), h('span', 'second')] },
      }),
    );
    expect(wrapper.findAll('button')).toHaveLength(1);
    expect(wrapper.findAll('span')).toHaveLength(1);
    expect(wrapper.find('#provider').exists()).toBe(false);
    expect(warn).not.toHaveBeenCalled();
  });
});
