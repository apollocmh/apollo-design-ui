import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref, shallowRef } from 'vue';
import {
  ConfigProvider,
  Image,
  ImagePreviewGroup,
  type PreviewConfig,
  type PreviewImageInfo,
} from '../../index';

vi.unmock('@apollo-design/motion');
function button(name: string) {
  const node = document.querySelector(`[role="dialog"] button[aria-label="${name}"]`);
  if (!(node instanceof HTMLButtonElement)) throw new Error('Missing gallery navigation control');
  return node;
}
async function host(initial: 'ltr' | 'rtl', custom: boolean | PreviewConfig = false) {
  const direction = ref(initial);
  const preview = shallowRef<PreviewConfig>(
    typeof custom === 'object'
      ? custom
      : custom
        ? {
            icons: {
              left: h('span', { 'data-direction-icon': 'left' }, 'L'),
              right: h('span', { 'data-direction-icon': 'right' }, 'R'),
            },
          }
        : {},
  );
  const Host = defineComponent({
    setup: () => () =>
      h(
        ConfigProvider,
        { direction: direction.value },
        {
          default: () =>
            h(
              ImagePreviewGroup,
              { preview: preview.value },
              {
                default: () => [
                  h(Image, { src: 'first.png', alt: 'Gallery first' }),
                  h(Image, { src: 'second.png', alt: 'Gallery second' }),
                ],
                previewImage: (info: PreviewImageInfo) =>
                  h('figure', [info.originNode, h('input', { 'aria-label': 'Direction draft' })]),
              },
            ),
        },
      ),
  });
  const wrapper = mount(Host, { attachTo: document.body, global: { stubs: { teleport: false } } });
  await nextTick();
  await nextTick();
  await wrapper.get('.apollo-image').trigger('click');
  await nextTick();
  await nextTick();
  return { wrapper, direction, preview };
}
describe('Gallery provider direction', () => {
  it.each(['ltr', 'rtl'] as const)(
    'initial %s keeps both built-in navigation icons',
    async (direction) => {
      const current = await host(direction);
      expect(button('Previous image').querySelector('svg')).not.toBeNull();
      expect(button('Next image').querySelector('svg')).not.toBeNull();
      current.wrapper.unmount();
    },
  );
  it('default icons follow current provider direction without replacing the preview', async () => {
    const current = await host('ltr');
    const root = document.querySelector('[role="dialog"]');
    const left = button('Previous image').querySelector('svg')?.innerHTML;
    const right = button('Next image').querySelector('svg')?.innerHTML;
    expect(left).toBeTruthy();
    expect(right).toBeTruthy();
    expect(left).not.toBe(right);
    const image = document.querySelector('.apollo-image-preview-img');
    const editor = document.querySelector('input[aria-label="Direction draft"]');
    if (!(image instanceof HTMLImageElement) || !(editor instanceof HTMLInputElement))
      throw new Error('Missing actual preview/editor');
    button('rotateRight').click();
    await nextTick();
    editor.value = 'Kept direction draft';
    editor.focus();
    editor.setSelectionRange(1, 4);
    current.direction.value = 'rtl';
    await nextTick();
    await nextTick();
    expect(document.querySelector('[role="dialog"]')).toBe(root);
    expect(button('Previous image').querySelector('svg')?.innerHTML).toBe(right);
    expect(button('Next image').querySelector('svg')?.innerHTML).toBe(left);
    expect(document.querySelector('.apollo-image-preview-img')).toBe(image);
    expect(document.querySelector('input[aria-label="Direction draft"]')).toBe(editor);
    expect(image.style.transform).toContain('rotate(90deg)');
    expect(editor.value).toBe('Kept direction draft');
    expect(document.activeElement).toBe(editor);
    expect([editor.selectionStart, editor.selectionEnd]).toEqual([1, 4]);
    current.direction.value = 'ltr';
    await nextTick();
    await nextTick();
    expect(button('Previous image').querySelector('svg')?.innerHTML).toBe(left);
    current.wrapper.unmount();
  });
  it('custom icons follow ltr/rtl/ltr using the current provider direction', async () => {
    const current = await host('ltr', true);
    expect(
      button('Previous image')
        .querySelector('[data-direction-icon]')
        ?.getAttribute('data-direction-icon'),
    ).toBe('left');
    current.direction.value = 'rtl';
    await nextTick();
    await nextTick();
    expect(
      button('Previous image')
        .querySelector('[data-direction-icon]')
        ?.getAttribute('data-direction-icon'),
    ).toBe('right');
    current.direction.value = 'ltr';
    await nextTick();
    await nextTick();
    expect(
      button('Previous image')
        .querySelector('[data-direction-icon]')
        ?.getAttribute('data-direction-icon'),
    ).toBe('left');
    current.wrapper.unmount();
  });
  it('initial RTL retains the existing custom icon mirror behavior', async () => {
    const current = await host('rtl', true);
    expect(
      button('Previous image')
        .querySelector('[data-direction-icon]')
        ?.getAttribute('data-direction-icon'),
    ).toBe('right');
    expect(
      button('Next image')
        .querySelector('[data-direction-icon]')
        ?.getAttribute('data-direction-icon'),
    ).toBe('left');
    current.wrapper.unmount();
  });
  it('partial custom icons preserve the other default icon in RTL', async () => {
    const current = await host('rtl', {
      icons: { left: h('span', { 'data-direction-icon': 'custom-left' }, 'Custom') },
    });
    expect(button('Previous image').querySelector('svg')).not.toBeNull();
    expect(
      button('Next image')
        .querySelector('[data-direction-icon]')
        ?.getAttribute('data-direction-icon'),
    ).toBe('custom-left');
    current.wrapper.unmount();
  });
  it('explicit empty custom icons remain empty after mirroring', async () => {
    const current = await host('rtl', { icons: { left: null } });
    expect(button('Previous image').querySelector('svg')).not.toBeNull();
    expect(button('Next image').childNodes).toHaveLength(0);
    expect(button('Next image').getAttribute('aria-label')).toBe('Next image');
    current.wrapper.unmount();
  });
  it('current preview icon objects can be replaced and removed while RTL stays active', async () => {
    const current = await host('rtl', true);
    current.preview.value = {
      icons: { right: h('span', { 'data-direction-icon': 'current-right' }, 'Current') },
    };
    await nextTick();
    await nextTick();
    expect(
      button('Previous image')
        .querySelector('[data-direction-icon]')
        ?.getAttribute('data-direction-icon'),
    ).toBe('current-right');
    expect(button('Next image').querySelector('svg')).not.toBeNull();
    current.preview.value = {};
    await nextTick();
    await nextTick();
    expect(button('Previous image').querySelector('svg')).not.toBeNull();
    expect(button('Next image').querySelector('svg')).not.toBeNull();
    current.wrapper.unmount();
  });
});
