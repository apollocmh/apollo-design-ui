import { useTheme } from '@apollo-design/theme';
import { mount } from '@vue/test-utils';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { createSSRApp, defineComponent, h, nextTick } from 'vue';
import { renderToString } from 'vue/server-renderer';
import DemoFrame from '../src/components/demo/DemoFrame.vue';
import DemoProvider from '../src/components/demo/DemoProvider.vue';
import { provideSiteLocale } from '../src/composables/locale';
import {
  setThemeOverride,
  setupTheme,
  useResolvedTheme,
  useThemeMode,
} from '../src/composables/theme';
import type { DemoMeta } from '../src/types/manifest';

let dark = false;
const media = new EventTarget();
Object.defineProperty(media, 'matches', { get: () => dark });
const mounted: { unmount(): void }[] = [];
beforeAll(() => {
  vi.stubGlobal('matchMedia', () => media);
  setupTheme();
});
afterEach(() => {
  for (const w of mounted.splice(0)) w.unmount();
  setThemeOverride(null);
  useThemeMode().setMode('light');
  dark = false;
  media.dispatchEvent(new Event('change'));
  document.body.innerHTML = '';
});

describe('Docs source theme context', () => {
  it('keeps source theme, CSS and the original native editor in sync', async () => {
    const Probe = defineComponent({
      setup() {
        const theme = useTheme();
        return () =>
          h(
            'section',
            { 'data-theme-bg': theme.token.value.colorBgContainer },
            h('input', { 'aria-label': 'Persistent theme draft' }),
          );
      },
    });
    const wrapper = mount(DemoProvider, {
      props: { instanceId: 'theme-contract' },
      slots: { default: () => h(Probe) },
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    mounted.push(wrapper);
    const editor = wrapper.get('input').element;
    editor.value = 'Kept draft';
    editor.focus();
    for (const mode of ['dark', 'light', 'dark'] as const) {
      useThemeMode().setMode(mode);
      await nextTick();
      expect(wrapper.get('section').attributes('data-theme-bg')).toBe(
        mode === 'dark' ? '#141414' : '#ffffff',
      );
      expect(wrapper.get('input').element).toBe(editor);
      expect(editor.value).toBe('Kept draft');
      expect(document.activeElement).toBe(editor);
    }
  });
  it('makes resolved system preference reactive without changing the selected mode', async () => {
    useThemeMode().setMode('system');
    const resolved = useResolvedTheme();
    expect(resolved.value).toBe('light');
    dark = true;
    media.dispatchEvent(new Event('change'));
    await nextTick();
    expect(document.documentElement.dataset.apolloTheme).toBe('dark');
    expect(resolved.value).toBe('dark');
    dark = false;
    media.dispatchEvent(new Event('change'));
    await nextTick();
    expect(resolved.value).toBe('light');
    expect(useThemeMode().mode.value).toBe('system');
  });
});

it('hydrates the server frame before applying the stored dark theme', async () => {
  const text = { zh: 'Example', en: 'Example', enFallback: false };
  const demo: DemoMeta = {
    id: 'button-demo-basic',
    component: 'button',
    name: 'basic',
    order: 0,
    title: text,
    desc: text,
    descHtml: text,
    iframe: true,
    preview: { mode: 'isolated' },
    sources: [],
    githubPath: 'packages/ui/src/button/demo/basic.vue',
  };
  useThemeMode().setMode('light');
  const serverApp = createSSRApp(DemoFrame, { demo });
  provideSiteLocale(serverApp);
  const html = await renderToString(serverApp);
  const host = document.createElement('div');
  host.innerHTML = html;
  document.body.appendChild(host);
  const original = host.querySelector('iframe');
  useThemeMode().setMode('dark');
  const app = createSSRApp(DemoFrame, { demo }),
    warnings: string[] = [];
  provideSiteLocale(app);
  app.config.warnHandler = (message) => warnings.push(message);
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    app.mount(host);
    mounted.push({ unmount: () => app.unmount() });
    await nextTick();
    expect(warnings).toEqual([]);
    expect(host.querySelector('iframe')).toBe(original);
    expect(original?.getAttribute('src')).toContain('theme=dark');
  } finally {
    error.mockRestore();
  }
});

it('keeps temporary query overrides separate from the saved mode and restores it on clear', async () => {
  useThemeMode().setMode('light');
  setThemeOverride('dark');
  await nextTick();
  expect(document.documentElement.dataset.apolloTheme).toBe('dark');
  expect(useResolvedTheme().value).toBe('dark');
  expect(localStorage.getItem('apollo-site-theme')).toBe('light');
  setThemeOverride('light');
  dark = true;
  media.dispatchEvent(new Event('change'));
  useThemeMode().setMode('system');
  await nextTick();
  expect(useResolvedTheme().value).toBe('light');
  setThemeOverride(null);
  await nextTick();
  expect(useResolvedTheme().value).toBe('dark');
  expect(useThemeMode().mode.value).toBe('system');
});
