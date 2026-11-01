import {
  darkAlgorithm,
  getDesignToken,
  type ThemeConfig,
  ThemeProvider,
  useTheme,
} from '@apollo-design/theme';
import { material3Preset } from '@apollo-design/theme/presets/material3';
import { monoPreset } from '@apollo-design/theme/presets/mono';
import { mount } from '@vue/test-utils';
import { afterEach, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, shallowRef } from 'vue';
import ConfigProvider from '../ConfigProvider';

const wrappers: Array<{ unmount(): void }> = [];
afterEach(() => {
  for (const wrapper of wrappers.splice(0)) wrapper.unmount();
  vi.unstubAllGlobals();
});
const Probe = defineComponent({
  props: { name: { type: String, required: true } },
  setup(props) {
    const theme = useTheme();
    return () =>
      h(
        'section',
        {
          'data-preset-probe': props.name,
          'data-primary': theme.token.value.colorPrimary,
          'data-hover': theme.token.value.colorPrimaryHover,
          'data-font': theme.token.value.fontSize,
          'data-background': theme.token.value.colorBgContainer,
          'data-button-radius': theme.config.value.components?.Button?.borderRadius,
        },
        [h('input', { 'aria-label': props.name })],
      );
  },
});
const tick = async () => {
  await nextTick();
  await nextTick();
};

it('projects a standalone Mono without any default token stylesheet and preserves nested raw overrides', async () => {
  const parent = shallowRef<ThemeConfig>({
    preset: monoPreset,
    mode: 'light',
    token: { colorPrimary: '#a52142' },
    components: { Button: { borderRadius: 7 } },
  });
  const child = shallowRef<ThemeConfig>({ token: { fontSize: 20 } });
  const wrapper = mount(
    defineComponent({
      setup: () => () =>
        h(ConfigProvider, { theme: parent.value }, () => [
          h(Probe, { name: 'parent' }),
          h(ConfigProvider, { theme: child.value }, () => h(Probe, { name: 'child' })),
          h(ConfigProvider, { theme: { inherit: false } }, () => h(Probe, { name: 'reset' })),
        ]),
    }),
    { attachTo: document.body, global: { stubs: { teleport: false } } },
  );
  wrappers.push(wrapper);
  await tick();
  const parentRoot = wrapper.get<HTMLElement>('[data-preset-probe="parent"]');
  const childRoot = wrapper.get<HTMLElement>('[data-preset-probe="child"]');
  const editor = childRoot.get('input').element;
  editor.value = 'Preset draft';
  editor.focus();
  const expected = getDesignToken(parent.value);
  expect(parentRoot.element.style.getPropertyValue('--apollo-font-family')).toBe(
    expected.fontFamily,
  );
  expect(parentRoot.element.style.getPropertyValue('--apollo-box-shadow')).toBe('none');
  expect(childRoot.attributes('data-hover')).toBe(expected.colorPrimaryHover);
  expect(childRoot.attributes('data-font')).toBe('20');
  expect(childRoot.attributes('data-button-radius')).toBe('7');
  expect(wrapper.get('[data-preset-probe="reset"]').attributes('data-primary')).toBe('#1677ff');
  parent.value = { preset: material3Preset, mode: 'dark', token: { colorPrimary: '#336644' } };
  await tick();
  expect(childRoot.attributes('data-background')).toBe(
    getDesignToken(parent.value).colorBgContainer,
  );
  expect(childRoot.attributes('data-font')).toBe('20');
  expect(childRoot.get('input').element).toBe(editor);
  expect(editor.value).toBe('Preset draft');
  expect(document.activeElement).toBe(editor);
  child.value = { algorithm: darkAlgorithm, token: { colorBgContainer: '#123456' } };
  parent.value = { preset: monoPreset, mode: 'light' };
  await tick();
  expect(childRoot.attributes('data-background')).toBe('#123456');
  expect(childRoot.attributes('data-primary')).toBe(
    getDesignToken({ preset: monoPreset, algorithm: darkAlgorithm }).colorPrimary,
  );
});

it('takes an explicitly inheriting ThemeProvider as the nearest source through a transparent ConfigProvider', async () => {
  const wrapper = mount(
    defineComponent({
      setup: () => () =>
        h(ConfigProvider, { theme: { preset: monoPreset, mode: 'dark' } }, () =>
          h(ThemeProvider, { theme: { inherit: true, token: { fontSize: 19 } } }, () =>
            h(ConfigProvider, {}, () => h(Probe, { name: 'nearest' })),
          ),
        ),
    }),
  );
  wrappers.push(wrapper);
  await tick();
  const probe = wrapper.get('[data-preset-probe="nearest"]');
  expect(probe.attributes('data-background')).toBe(
    getDesignToken({ preset: monoPreset, mode: 'dark' }).colorBgContainer,
  );
  expect(probe.attributes('data-font')).toBe('19');
});

it('owns a system listener for a live ConfigProvider and releases it on mode replacement and unmount', async () => {
  let dark = false;
  const media = new EventTarget();
  Object.defineProperty(media, 'matches', { get: () => dark });
  const add = vi.spyOn(media, 'addEventListener');
  const remove = vi.spyOn(media, 'removeEventListener');
  vi.stubGlobal('matchMedia', () => media);
  const wrapper = mount(ConfigProvider, {
    props: { theme: { preset: monoPreset, mode: 'system' } },
    slots: { default: () => h(Probe, { name: 'system' }) },
  });
  wrappers.push(wrapper);
  await tick();
  expect(add).toHaveBeenCalledTimes(1);
  dark = true;
  media.dispatchEvent(new Event('change'));
  await tick();
  expect(wrapper.get('[data-preset-probe]').attributes('data-background')).toBe(
    getDesignToken({ preset: monoPreset, mode: 'dark' }).colorBgContainer,
  );
  await wrapper.setProps({ theme: { preset: monoPreset, mode: 'light' } });
  expect(remove).toHaveBeenCalledTimes(1);
  await wrapper.setProps({ theme: { preset: monoPreset, mode: 'system' } });
  expect(add).toHaveBeenCalledTimes(2);
  wrapper.unmount();
  wrappers.splice(wrappers.indexOf(wrapper), 1);
  expect(remove).toHaveBeenCalledTimes(2);
});
