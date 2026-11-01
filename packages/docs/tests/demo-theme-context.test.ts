import { getDesignToken, useTheme } from '@apollo-design/theme';
import { material3Preset } from '@apollo-design/theme/presets/material3';
import { monoPreset } from '@apollo-design/theme/presets/mono';
import { ConfigProvider } from '@apollo-design/ui';
import { mount } from '@vue/test-utils';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { createSSRApp, defineComponent, h, nextTick } from 'vue';
import { renderToString } from 'vue/server-renderer';
import DemoFrame from '../src/components/demo/DemoFrame.vue';
import DemoProvider from '../src/components/demo/DemoProvider.vue';
import { provideSiteLocale } from '../src/composables/locale';
import {
  setPresetOverride,
  setThemeOverride,
  setupTheme,
  useResolvedTheme,
  useThemeMode,
  useThemePreset,
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
  setPresetOverride(null);
  useThemePreset().setPreset('default');
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
    expect(document.documentElement.dataset.apolloTheme).toBe('system');
    expect(document.documentElement.dataset.apolloAppearance).toBe('dark');
    expect(resolved.value).toBe('dark');
    dark = false;
    media.dispatchEvent(new Event('change'));
    await nextTick();
    expect(resolved.value).toBe('light');
    expect(useThemeMode().mode.value).toBe('system');
  });
});

it('hydrates the reserved frame space, then creates one document with current preferences', async () => {
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
  expect(host.querySelector('iframe')).toBeNull();
  expect(host.querySelector('.demo-frame-placeholder')).not.toBeNull();
  useThemeMode().setMode('dark');
  useThemePreset().setPreset('mono');
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
    const frame = host.querySelector('iframe');
    expect(frame?.getAttribute('src')).toContain('theme=dark');
    expect(frame?.getAttribute('src')).toContain('preset=mono');
    const initialSrc = frame?.getAttribute('src');
    useThemePreset().setPreset('material3');
    await nextTick();
    expect(host.querySelector('iframe')).toBe(frame);
    expect(frame?.getAttribute('src')).toBe(initialSrc);
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

it('keeps the frame document when the parent changes appearance', async () => {
  const text = { zh: 'Example', en: 'Example', enFallback: false };
  const demo: DemoMeta = {
    id: 'input-demo-basic',
    component: 'input',
    name: 'basic',
    order: 0,
    title: text,
    desc: text,
    descHtml: text,
    iframe: true,
    preview: { mode: 'isolated' },
    sources: [],
    githubPath: 'packages/ui/src/input/demo/basic.vue',
  };
  useThemeMode().setMode('light');
  const wrapper = mount(DemoFrame, { props: { demo }, attachTo: document.body });
  mounted.push(wrapper);
  await nextTick();
  const frame = wrapper.get('iframe').element;
  const src = frame.getAttribute('src');
  useThemeMode().setMode('dark');
  await nextTick();
  expect(wrapper.get('iframe').element).toBe(frame);
  expect(frame.getAttribute('src')).toBe(src);
});

it('applies public presets while a local Demo override retains its own intent', async () => {
  const Probe = defineComponent({
    setup() {
      const theme = useTheme();
      return () =>
        h('output', {
          'data-primary': theme.token.value.colorPrimary,
          'data-radius': theme.token.value.borderRadius,
        });
    },
  });
  const wrapper = mount(DemoProvider, {
    props: { instanceId: 'nested-preset' },
    slots: {
      default: () => [
        h(Probe),
        h(
          ConfigProvider,
          { theme: { token: { colorPrimary: '#a12345' } } },
          { default: () => h(Probe) },
        ),
      ],
    },
  });
  mounted.push(wrapper);
  for (const [id, preset] of [
    ['mono', monoPreset],
    ['material3', material3Preset],
  ] as const) {
    useThemePreset().setPreset(id);
    useThemeMode().setMode('dark');
    await nextTick();
    const [inherited, local] = wrapper.findAll('output');
    expect(inherited?.attributes('data-primary')).toBe(
      getDesignToken({ preset, mode: 'dark' }).colorPrimary,
    );
    expect(local?.attributes('data-primary')).toBe(
      getDesignToken({ preset, mode: 'dark', token: { colorPrimary: '#a12345' } }).colorPrimary,
    );
    expect(local?.attributes('data-radius')).toBe(
      String(getDesignToken({ preset, mode: 'dark' }).borderRadius),
    );
    expect(document.documentElement.dataset.apolloPreset).toBe(id);
  }
  setPresetOverride('default');
  expect(useThemePreset().preset.value).toBe('material3');
  expect(localStorage.getItem('apollo-site-preset')).toBe('material3');
});
