import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSSRApp, defineComponent, h, nextTick, shallowRef } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { darkAlgorithm, getDesignToken } from '../get-design-token';
import { mergeThemeConfig } from '../merge-theme';
import { defaultPreset } from '../presets/default';
import { material3Preset } from '../presets/material3';
import { monoPreset } from '../presets/mono';
import type { ThemeConfig } from '../types';
import { ThemeProvider, useTheme } from '../vue';

afterEach(() => vi.unstubAllGlobals());

describe('Built-in presets use public configuration', () => {
  it('preserves the original default and makes Mono achromatic without removing status colors', () => {
    expect(getDesignToken({ preset: defaultPreset })).toEqual(getDesignToken());
    expect(getDesignToken({ preset: defaultPreset, mode: 'dark' })).toEqual(
      getDesignToken({ algorithm: darkAlgorithm }),
    );
    for (const mode of ['light', 'dark'] as const) {
      const token = getDesignToken({ preset: monoPreset, mode });
      for (const name of [
        'colorPrimary',
        'colorPrimaryHover',
        'colorPrimaryActive',
        'colorLink',
      ] as const)
        expect(token[name]).toMatch(/^#([\da-f]{2})\1\1$/i);
      for (const name of ['colorSuccess', 'colorWarning', 'colorError'] as const)
        expect(token[name]).not.toMatch(/^#([\da-f]{2})\1\1$/i);
      expect(token.boxShadow).toBe('none');
      expect(token.borderRadius).toBe(2);
    }
  });

  it('Material typography, radii, surfaces and shadows follow final user seeds and aliases', () => {
    const original = getDesignToken({ preset: material3Preset });
    const token = getDesignToken({
      preset: material3Preset,
      token: { fontSize: 20, borderRadius: 10, colorPrimary: '#a52142' },
    });
    expect(original.fontSizeHeading1).toBe(34);
    expect(token.fontSizeHeading1).toBeGreaterThan(original.fontSizeHeading1);
    expect(token.borderRadiusLG).toBe(10);
    expect(token.colorPrimary).toBe('#a52142');
    expect(token.colorPrimaryHover).not.toBe(original.colorPrimaryHover);
    expect(token.colorBgElevated).toBe(token.colorBgContainer);
    expect(original.boxShadow).not.toBe(getDesignToken().boxShadow);
    expect(
      getDesignToken({
        preset: material3Preset,
        token: { fontSizeHeading1: 72, boxShadow: 'none' },
      }),
    ).toMatchObject({ fontSizeHeading1: 72, boxShadow: 'none' });
  });

  it('keeps Material brand actions, neutral surfaces and readable dark text independently', () => {
    const light = getDesignToken({ preset: material3Preset, mode: 'light' });
    const dark = getDesignToken({ preset: material3Preset, mode: 'dark' });
    for (const token of [light, dark]) {
      expect(token.colorPrimary).toBe('#0073e6');
      expect(token.colorInfo).toBe('#0073e6');
      expect(token.borderRadiusLG).toBe(4);
      expect(token.colorPrimaryHover).not.toBe(token.colorPrimary);
      expect(token.colorInfoBorder).toBe(token.colorInfoBg);
    }
    expect(light.colorBgContainer).toBe('#ffffff');
    expect(light.colorLink).toBe('#0073e6');
    expect(dark.colorBgContainer).toMatch(/^#([\da-f]{2})\1\1$/i);
    expect(dark.colorBgElevated).toMatch(/^#([\da-f]{2})\1\1$/i);
    expect(dark.colorBgElevated).not.toBe(dark.colorBgContainer);
    expect(dark.colorPrimaryText).not.toBe(dark.colorPrimary);
    expect(dark.colorLink).toBe('#90caf9');
    const custom = getDesignToken({
      preset: material3Preset,
      mode: 'dark',
      token: {
        colorBgBase: '#202830',
        colorTextBase: '#ffeedd',
        colorPrimary: '#ad294a',
        colorBgElevated: '#334455',
      },
    });
    expect(custom.colorPrimary).toBe('#ad294a');
    expect(custom.colorBgContainer).not.toBe(dark.colorBgContainer);
    expect(custom.colorText).toBe('rgb(255,238,221)');
    expect(custom.colorBgElevated).toBe('#334455');
  });

  it('inherits raw user overrides and keeps local legacy algorithms and reset semantics', () => {
    const parent: ThemeConfig = {
      preset: monoPreset,
      mode: 'light',
      token: { colorPrimary: '#b52341' },
      components: { Button: { primaryColor: '#ffeedd' } },
    };
    const child = mergeThemeConfig(parent, {
      preset: material3Preset,
      algorithm: darkAlgorithm,
      components: { Button: { borderRadius: 0 } },
    });
    expect(child?.mode).toBeUndefined();
    expect(child?.token).toEqual(parent.token);
    expect(child?.components?.Button).toEqual({ primaryColor: '#ffeedd', borderRadius: 0 });
    expect(getDesignToken(child).colorPrimary).toBe(
      getDesignToken({ algorithm: darkAlgorithm, token: parent.token }).colorPrimary,
    );
    expect(mergeThemeConfig(parent, { inherit: false, mode: 'dark' })).toMatchObject({
      mode: 'dark',
      token: {},
      components: {},
    });
    expect(mergeThemeConfig(parent, { inherit: false })?.preset).toBeUndefined();
    expect(
      mergeThemeConfig({ algorithm: darkAlgorithm }, { mode: 'light' })?.algorithm,
    ).toBeUndefined();
    expect(parent.mode).toBe('light');
  });
});

it('resolves system per live provider and releases media listeners without recreating editors', async () => {
  let dark = false;
  const media = new EventTarget();
  Object.defineProperty(media, 'matches', { get: () => dark });
  const add = vi.spyOn(media, 'addEventListener');
  const remove = vi.spyOn(media, 'removeEventListener');
  vi.stubGlobal('matchMedia', () => media);
  const config = shallowRef<ThemeConfig>({ preset: monoPreset, mode: 'system' });
  const Probe = defineComponent({
    setup() {
      const theme = useTheme();
      return () => h('section', { 'data-bg': theme.token.value.colorBgContainer }, [h('input')]);
    },
  });
  const wrapper = mount(
    defineComponent({
      setup: () => () => h(ThemeProvider, { theme: config.value }, { default: () => h(Probe) }),
    }),
    { attachTo: document.body },
  );
  try {
    await nextTick();
    const editor = wrapper.get('input').element;
    editor.value = 'Keep my draft';
    editor.focus();
    expect(add).toHaveBeenCalledTimes(1);
    const light = wrapper.get('section').attributes('data-bg');
    dark = true;
    media.dispatchEvent(new Event('change'));
    await nextTick();
    expect(wrapper.get('section').attributes('data-bg')).not.toBe(light);
    config.value = { preset: material3Preset, mode: 'system' };
    await nextTick();
    expect(wrapper.get('input').element).toBe(editor);
    expect(editor.value).toBe('Keep my draft');
    expect(document.activeElement).toBe(editor);
    config.value = { preset: material3Preset, mode: 'light' };
    await nextTick();
    expect(remove).toHaveBeenCalledTimes(1);
  } finally {
    wrapper.unmount();
    vi.restoreAllMocks();
  }
});

it('keeps a nested ThemeProvider reset by default and inherits raw settings only when requested', async () => {
  const parent = shallowRef<ThemeConfig>({
    preset: monoPreset,
    mode: 'dark',
    token: { colorPrimary: '#a52142' },
  });
  const child = shallowRef<ThemeConfig>({ inherit: true, token: { fontSize: 20 } });
  const Probe = defineComponent({
    props: { name: { type: String, required: true } },
    setup(props) {
      const context = useTheme();
      return () =>
        h('span', {
          'data-probe': props.name,
          'data-primary': context.token.value.colorPrimary,
          'data-font': context.token.value.fontSize,
          'data-family': context.token.value.fontFamily,
        });
    },
  });
  const wrapper = mount(
    defineComponent({
      setup: () => () =>
        h(ThemeProvider, { theme: parent.value }, () => [
          h(ThemeProvider, { theme: child.value }, () => h(Probe, { name: 'inherited' })),
          h(ThemeProvider, { theme: {} }, () => h(Probe, { name: 'reset' })),
        ]),
    }),
  );
  try {
    const inherited = () => wrapper.get('[data-probe="inherited"]');
    expect(inherited().attributes('data-primary')).toBe(getDesignToken(parent.value).colorPrimary);
    expect(inherited().attributes('data-font')).toBe('20');
    expect(inherited().attributes('data-family')).toContain('monospace');
    expect(wrapper.get('[data-probe="reset"]').attributes('data-font')).toBe('14');
    parent.value = { preset: material3Preset, mode: 'light', token: { colorPrimary: '#228844' } };
    await nextTick();
    expect(inherited().attributes('data-primary')).toBe('#228844');
    expect(inherited().attributes('data-family')).toContain('Roboto');
    child.value = { inherit: false };
    await nextTick();
    expect(inherited().attributes('data-primary')).toBe('#1677ff');
    expect(inherited().attributes('data-font')).toBe('14');
  } finally {
    wrapper.unmount();
  }
});

it('renders explicit and system presets on the server without reading matchMedia or document', async () => {
  const matchMedia = vi.fn(() => {
    throw new Error('SSR must not observe the OS');
  });
  vi.stubGlobal('matchMedia', matchMedia);
  vi.stubGlobal('document', undefined);
  const Probe = defineComponent({
    setup() {
      const context = useTheme();
      return () => h('span', context.token.value.colorBgContainer);
    },
  });
  for (const mode of ['light', 'dark', 'system'] as const) {
    const theme = { preset: material3Preset, mode };
    const markup = await renderToString(
      createSSRApp({
        render: () => h(ThemeProvider, { theme, injectCssVar: true }, () => h(Probe)),
      }),
    );
    expect(markup).toContain(getDesignToken(theme).colorBgContainer);
  }
  expect(matchMedia).not.toHaveBeenCalled();
});
