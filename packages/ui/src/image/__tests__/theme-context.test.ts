import {
  compactAlgorithm,
  darkAlgorithm,
  getDesignToken,
  type ThemeConfig,
  ThemeProvider,
} from '@apollo-design/theme';
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref, shallowRef } from 'vue';
import {
  ConfigProvider,
  type ConfigProviderThemeConfig,
  Image,
  ImagePreviewGroup,
} from '../../index';

vi.unmock('@apollo-design/motion');
async function settle() {
  await nextTick();
  await nextTick();
}
function required(selector: string) {
  const node = document.querySelector(selector);
  if (!(node instanceof HTMLElement)) throw new Error(`Missing ${selector}`);
  return node;
}
const componentTokens = {
  zIndexPopup: 2300,
  previewOperationColor: '#123456',
  previewOperationHoverColor: '#234567',
  previewOperationColorDisabled: '#345678',
  previewOperationSize: 31,
  progressAnimationDuration: '5s',
  imagePreviewSwitchSize: 57,
};
const expectedVariables = {
  '--apollo-image-z-index-popup': '2300',
  '--apollo-image-preview-operation-color': '#123456',
  '--apollo-image-preview-operation-hover-color': '#234567',
  '--apollo-image-preview-operation-color-disabled': '#345678',
  '--apollo-image-preview-operation-size': '31px',
  '--apollo-image-progress-animation-duration': '5s',
  '--apollo-image-preview-switch-size': '57px',
};
describe.each([false, true])('Image source theme context (group=%s)', (group) => {
  it('keeps explicit popup styles above component tokens and the zIndex prop above those styles', async () => {
    const index = shallowRef<number | undefined>();
    const Host = defineComponent(
      () => () =>
        h(
          ConfigProvider,
          { theme: { components: { Image: componentTokens } } },
          {
            default: () =>
              h(group ? ImagePreviewGroup : Image, {
                src: 'first.png',
                items: ['first.png', 'second.png'],
                open: true,
                preview: { zIndex: index.value },
                styles: {
                  popup: {
                    root: { zIndex: 2450, '--apollo-image-preview-operation-size': '36px' },
                  },
                },
              }),
          },
        ),
    );
    const wrapper = mount(Host, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    await settle();
    const dialog = required('[role="dialog"]');
    expect(dialog.style.zIndex).toBe('2450');
    expect(dialog.style.getPropertyValue('--apollo-image-preview-operation-size')).toBe('36px');
    index.value = 2600;
    await settle();
    expect(dialog.style.zIndex).toBe('2600');
    index.value = undefined;
    await settle();
    expect(dialog.style.zIndex).toBe('2450');
    wrapper.unmount();
  });
  it('consumes all seven current component tokens on the real preview, and removes overrides', async () => {
    const theme = ref<ConfigProviderThemeConfig | undefined>({
      token: { colorBgSpotlight: '#456789' },
      components: { Image: { ...componentTokens } },
    });
    const Host = defineComponent(
      () => () =>
        h(
          ConfigProvider,
          { theme: theme.value },
          {
            default: () =>
              group
                ? h(ImagePreviewGroup, { open: true, items: ['first.png', 'second.png'] })
                : h(Image, { src: 'first.png', open: true }),
          },
        ),
    );
    const wrapper = mount(Host, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    await settle();
    const dialog = required('[role="dialog"]');
    const image = required('.apollo-image-preview-img');
    for (const [name, value] of Object.entries(expectedVariables))
      expect(dialog.style.getPropertyValue(name), name).toBe(value);
    expect(dialog.style.getPropertyValue('--apollo-color-bg-spotlight')).toBe('#456789');
    const overrides = theme.value?.components?.Image;
    if (!overrides) throw new Error('Expected configured component tokens');
    overrides.previewOperationSize = 35;
    await settle();
    expect(dialog.style.getPropertyValue('--apollo-image-preview-operation-size')).toBe('35px');
    theme.value = { components: { Image: { previewOperationSize: 27 } } };
    await settle();
    expect(required('[role="dialog"]')).toBe(dialog);
    expect(required('.apollo-image-preview-img')).toBe(image);
    expect(dialog.style.getPropertyValue('--apollo-image-preview-operation-size')).toBe('27px');
    expect(dialog.style.getPropertyValue('--apollo-image-preview-operation-color')).not.toBe(
      '#123456',
    );
    theme.value = undefined;
    await settle();
    expect(dialog.style.getPropertyValue('--apollo-image-preview-operation-size')).toBe('');
    expect(dialog.style.getPropertyValue('--apollo-color-bg-spotlight')).toBe('');
    wrapper.unmount();
  });
  it('inherits a ThemeProvider through an unrelated ConfigProvider and follows algorithms', async () => {
    const theme = shallowRef<ThemeConfig>({
      algorithm: darkAlgorithm,
      token: { colorBgSpotlight: '#223344' },
      components: { Image: { previewOperationSize: 29 } },
    });
    const Host = defineComponent(
      () => () =>
        h(
          ThemeProvider,
          { theme: theme.value },
          {
            default: () =>
              h(
                ConfigProvider,
                { direction: 'rtl' },
                {
                  default: () =>
                    group
                      ? h(ImagePreviewGroup, { open: true, items: ['first.png', 'second.png'] })
                      : h(Image, { src: 'first.png', open: true }),
                },
              ),
          },
        ),
    );
    const wrapper = mount(Host, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    await settle();
    const dialog = required('[role="dialog"]');
    expect(dialog.style.getPropertyValue('--apollo-color-bg-spotlight')).toBe('#223344');
    expect(dialog.style.getPropertyValue('--apollo-image-preview-operation-size')).toBe('29px');
    theme.value = { algorithm: [darkAlgorithm, compactAlgorithm] };
    await settle();
    expect(dialog.style.getPropertyValue('--apollo-control-height')).toBe(
      `${getDesignToken(theme.value).controlHeight}px`,
    );
    wrapper.unmount();
  });
  it('respects inherit=false through an outer ThemeProvider', async () => {
    const Host = defineComponent(
      () => () =>
        h(
          ThemeProvider,
          {
            theme: {
              token: { colorBgSpotlight: '#123456' },
              components: { Image: { previewOperationSize: 39 } },
            },
          },
          {
            default: () =>
              h(
                ConfigProvider,
                { theme: { inherit: false, components: { Image: { previewOperationSize: 25 } } } },
                {
                  default: () =>
                    group
                      ? h(ImagePreviewGroup, { open: true, items: ['first.png'] })
                      : h(Image, { src: 'first.png', open: true }),
                },
              ),
          },
        ),
    );
    const wrapper = mount(Host, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    await settle();
    const dialog = required('[role="dialog"]');
    expect(dialog.style.getPropertyValue('--apollo-color-bg-spotlight')).toBe(
      getDesignToken().colorBgSpotlight,
    );
    expect(dialog.style.getPropertyValue('--apollo-image-preview-operation-size')).toBe('25px');
    wrapper.unmount();
  });
});
it('keeps simultaneously open providers isolated when one current theme changes', async () => {
  const first = ref('#123456');
  const Host = defineComponent(
    () => () =>
      h('section', [
        h(
          ConfigProvider,
          { theme: { token: { colorBgSpotlight: first.value } } },
          {
            default: () =>
              h(Image, { src: 'first.png', alt: 'First isolated preview', open: true }),
          },
        ),
        h(
          ConfigProvider,
          { theme: { token: { colorBgSpotlight: '#456789' } } },
          {
            default: () =>
              h(Image, { src: 'second.png', alt: 'Second isolated preview', open: true }),
          },
        ),
      ]),
  );
  const wrapper = mount(Host, { attachTo: document.body, global: { stubs: { teleport: false } } });
  await settle();
  const one = required('[role="dialog"][aria-label="First isolated preview"]');
  const two = required('[role="dialog"][aria-label="Second isolated preview"]');
  first.value = '#234567';
  await settle();
  expect(one.style.getPropertyValue('--apollo-color-bg-spotlight')).toBe('#234567');
  expect(two.style.getPropertyValue('--apollo-color-bg-spotlight')).toBe('#456789');
  expect(document.documentElement.style.getPropertyValue('--apollo-color-bg-spotlight')).toBe('');
  wrapper.unmount();
});
it('uses the same component variables for a normal Image and its Progress root while preserving native style priority', async () => {
  const progress = shallowRef(false);
  const Host = defineComponent(
    () => () =>
      h(
        ConfigProvider,
        { theme: { components: { Image: componentTokens } } },
        {
          default: () =>
            h(Image, {
              src: progress.value ? undefined : 'first.png',
              placeholder: progress.value ? { progress: true } : undefined,
              style: { '--apollo-image-preview-operation-size': '39px' },
            }),
        },
      ),
  );
  const wrapper = mount(Host, { attachTo: document.body });
  const root = wrapper.get('.apollo-image').element;
  if (!(root instanceof HTMLElement)) throw new Error('Expected the native Image root');
  expect(root.style.getPropertyValue('--apollo-image-progress-animation-duration')).toBe('5s');
  expect(root.style.getPropertyValue('--apollo-image-preview-operation-size')).toBe('39px');
  progress.value = true;
  await settle();
  const node = required('.apollo-image-progress-wrapper');
  expect(node.style.getPropertyValue('--apollo-image-progress-animation-duration')).toBe('5s');
  expect(node.style.getPropertyValue('--apollo-image-preview-operation-size')).toBe('39px');
  wrapper.unmount();
});
