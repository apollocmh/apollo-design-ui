import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeAll, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';
import DemoFrame from '../src/components/demo/DemoFrame.vue';
import { setLocaleOverride, useSiteLocale } from '../src/composables/locale';
import {
  setPresetOverride,
  setThemeOverride,
  setupTheme,
  useSiteTheme,
  useThemeMode,
  useThemePreset,
} from '../src/composables/theme';
import DemoStandalonePage from '../src/pages/DemoStandalonePage.vue';
import type { DemoMeta } from '../src/types/manifest';

const text = { zh: 'Input', en: 'Input', enFallback: false };
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
vi.mock('../src/composables/manifest', () => ({
  loadComponentPage: async () => ({ demos: [demo] }),
}));
const mounted: { unmount(): void }[] = [];
beforeAll(setupTheme);
afterEach(() => {
  for (const wrapper of mounted.splice(0)) wrapper.unmount();
  setThemeOverride(null);
  setPresetOverride(null);
  setLocaleOverride(null);
  useThemeMode().setMode('system');
  useThemePreset().setPreset('default');
  useSiteLocale().setLocale('zh-CN');
  document.body.innerHTML = '';
});

it('sends current context to one frame without changing its src or accepting sibling messages', async () => {
  useThemePreset().setPreset('mono');
  useThemeMode().setMode('system');
  const wrapper = mount(DemoFrame, { props: { demo }, attachTo: document.body });
  mounted.push(wrapper);
  await nextTick();
  const frame = wrapper.get('iframe').element;
  const originalSrc = frame.src;
  const frameId = new URL(originalSrc).searchParams.get('frameId');
  expect(new URL(originalSrc).searchParams.get('preset')).toBe('mono');
  if (!frame.contentWindow) throw new Error('The mounted frame has no contentWindow');
  const post = vi.spyOn(frame.contentWindow, 'postMessage');
  useThemePreset().setPreset('material3');
  useThemeMode().setMode('dark');
  useSiteLocale().setLocale('en-US');
  await nextTick();
  expect(post).toHaveBeenLastCalledWith(
    {
      type: 'apollo-demo:context',
      frameId,
      preset: 'material3',
      mode: 'dark',
      lang: 'en-US',
    },
    location.origin,
  );
  expect(frame.src).toBe(originalSrc);
  post.mockClear();
  for (const invalid of [
    { origin: 'https://example.com', source: frame.contentWindow, frameId },
    { origin: location.origin, source: window, frameId },
    { origin: location.origin, source: frame.contentWindow, frameId: 'sibling' },
  ]) {
    window.dispatchEvent(
      new MessageEvent('message', {
        origin: invalid.origin,
        source: invalid.source,
        data: { type: 'apollo-demo:ready', frameId: invalid.frameId },
      }),
    );
  }
  expect(post).not.toHaveBeenCalled();
  window.dispatchEvent(
    new MessageEvent('message', {
      origin: location.origin,
      source: frame.contentWindow,
      data: { type: 'apollo-demo:ready', frameId },
    }),
  );
  expect(post).toHaveBeenCalledOnce();
  post.mockRestore();
});

it('controls the standalone document only from its parent and keeps draft, selection and open state', async () => {
  useThemePreset().setPreset('default');
  useThemeMode().setMode('light');
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/components/:name/demo/:demo', component: DemoStandalonePage }],
  });
  await router.push(
    '/components/input/demo/basic?embed=1&frameId=controlled&theme=light&preset=mono&lang=zh-CN',
  );
  await router.isReady();
  const Editor = defineComponent({
    render: () =>
      h('section', [
        h('input', { 'aria-label': 'Draft' }),
        h('details', [h('summary', 'Open'), 'Details']),
      ]),
  });
  const wrapper = mount(DemoStandalonePage, {
    attachTo: document.body,
    global: { plugins: [router], stubs: { DemoRenderer: Editor } },
  });
  mounted.push(wrapper);
  await flushPromises();
  const input = wrapper.get('input').element;
  input.value = 'persistent draft';
  input.focus();
  input.setSelectionRange(2, 7);
  const details = wrapper.get('details').element;
  details.open = true;
  const context = {
    type: 'apollo-demo:context',
    frameId: 'controlled',
    preset: 'material3',
    mode: 'dark',
    lang: 'en-US',
  };
  const sibling = document.createElement('iframe');
  document.body.append(sibling);
  for (const invalid of [
    { origin: 'https://example.com', source: window, data: context },
    { origin: location.origin, source: sibling.contentWindow, data: context },
    { origin: location.origin, source: window, data: { ...context, frameId: 'other' } },
    { origin: location.origin, source: window, data: { ...context, preset: 'not-a-preset' } },
  ])
    window.dispatchEvent(new MessageEvent('message', invalid));
  expect(useSiteTheme().preset.value).toBe('mono');
  window.dispatchEvent(
    new MessageEvent('message', { origin: location.origin, source: window, data: context }),
  );
  await nextTick();
  expect(useSiteTheme().preset.value).toBe('material3');
  expect(useSiteTheme().mode.value).toBe('dark');
  expect(useSiteLocale().locale.value).toBe('en-US');
  expect(wrapper.get('input').element).toBe(input);
  expect(input.value).toBe('persistent draft');
  expect([input.selectionStart, input.selectionEnd]).toEqual([2, 7]);
  expect(document.activeElement).toBe(input);
  expect(wrapper.get('details').element).toBe(details);
  expect(details.open).toBe(true);
  expect(localStorage.getItem('apollo-site-preset')).toBe('default');
  expect(localStorage.getItem('apollo-site-theme')).toBe('light');
});

it('applies saved or standalone query selectors before first paint without a second palette', () => {
  const html = readFileSync(
    resolve(dirname(fileURLToPath(import.meta.url)), '../index.html'),
    'utf8',
  );
  const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  if (!script) throw new Error('Missing pre-paint theme bootstrap');
  localStorage.setItem('apollo-site-preset', 'mono');
  localStorage.setItem('apollo-site-theme', 'system');
  runInNewContext(script, {
    document,
    localStorage,
    location: { pathname: '/', search: '' },
    URLSearchParams,
    matchMedia: () => ({ matches: true }),
  });
  expect(document.documentElement.dataset.apolloPreset).toBe('mono');
  expect(document.documentElement.dataset.apolloTheme).toBe('system');
  expect(document.documentElement.dataset.apolloAppearance).toBe('dark');
  runInNewContext(script, {
    document,
    localStorage,
    location: {
      pathname: '/components/input/demo/basic',
      search: '?preset=material3&theme=light&lang=en-US',
    },
    URLSearchParams,
    matchMedia: () => ({ matches: true }),
  });
  expect(document.documentElement.dataset.apolloPreset).toBe('material3');
  expect(document.documentElement.dataset.apolloTheme).toBe('light');
  expect(document.documentElement.lang).toBe('en-US');
  expect(localStorage.getItem('apollo-site-preset')).toBe('mono');
});
