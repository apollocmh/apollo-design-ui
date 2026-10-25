import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, isVNode, nextTick, ref, shallowRef } from 'vue';
import { renderToString } from 'vue/server-renderer';
import {
  Image,
  ImagePreviewGroup,
  type ImageRenderInfo,
  type ImageSlots,
  type PreviewActionsInfo,
  type PreviewGroupSlots,
  type PreviewImageInfo,
} from '../index';
import ImagePreviewSlots from './fixtures/ImagePreviewSlots.vue';

vi.unmock('@apollo-design/motion');

type Target = 'Image' | 'PreviewGroup';
const targets: Target[] = ['Image', 'PreviewGroup'];
const options = { attachTo: document.body, global: { stubs: { teleport: false } } };
async function settle() {
  await nextTick();
  await nextTick();
}
function control(name: string) {
  const button = document.querySelector(`[role="dialog"] button[aria-label="${name}"]`);
  if (!(button instanceof HTMLButtonElement))
    throw new Error(`Missing real preview action ${name}`);
  return button;
}
function previewImage() {
  const image = document.querySelector('.apollo-image-preview-img');
  if (!(image instanceof HTMLImageElement)) throw new Error('Missing actual preview image');
  return image;
}
function host(target: Target, initial: ImageSlots & PreviewGroupSlots = {}) {
  const slots = shallowRef(initial);
  const source = ref<string | undefined>('first.png');
  const preview = ref(true);
  const attrs = shallowRef<Record<string, unknown>>({});
  const Host = defineComponent({
    setup: () => () =>
      target === 'Image'
        ? h(
            Image,
            {
              src: source.value,
              alt: 'First preview image',
              preview: preview.value,
              ...attrs.value,
            },
            { ...slots.value },
          )
        : h(
            ImagePreviewGroup,
            { preview: preview.value, ...attrs.value },
            {
              ...slots.value,
              default: () => [
                h(Image, { src: source.value, alt: 'First preview image' }),
                h(Image, { src: 'second.png', alt: 'Second preview image' }),
              ],
            },
          ),
  });
  const wrapper = mount(Host, options);
  const open = async () => {
    await wrapper.get('.apollo-image').trigger('click');
    await settle();
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
  };
  return { wrapper, slots, source, preview, attrs, open };
}

describe('Image/Group native preview slots', () => {
  for (const target of targets) {
    it(`${target}: actual typed SFC preview slots support empty and conditional removal`, async () => {
      const wrapper = mount(ImagePreviewSlots, { ...options, props: { target } });
      await wrapper
        .get(
          target === 'Image'
            ? '[aria-label="Typed preview image"]'
            : '[aria-label="Typed group first"]',
        )
        .trigger('click');
      await settle();
      expect(document.querySelector('[data-typed-preview-image]')).not.toBeNull();
      expect(document.querySelector('[data-typed-preview-actions]')).not.toBeNull();
      if (target === 'PreviewGroup')
        expect(document.querySelector('[data-typed-preview-count]')?.textContent).toBe('1 / 2');
      await wrapper.setProps({ empty: true });
      expect(document.querySelector('.apollo-image-preview-img')).toBeNull();
      expect(document.querySelector('.apollo-image-preview-actions')).toBeNull();
      await wrapper.setProps({ show: false });
      expect(previewImage().getAttribute('src')).toBe('typed-first.png');
      expect(control('rotateRight')).not.toBeNull();
    });
    it(`${target}: lazy preview slots receive real origin VNodes and current image/transform metadata`, async () => {
      const image = vi.fn((info: PreviewImageInfo) =>
        h('figure', { 'data-preview-image-slot': '' }, [info.originNode]),
      );
      const actions = vi.fn((info: PreviewActionsInfo) =>
        h('section', { 'data-preview-actions-slot': '' }, [info.originNode]),
      );
      const current = host(target, { previewImage: image, previewActions: actions });
      expect(image).not.toHaveBeenCalled();
      expect(actions).not.toHaveBeenCalled();
      await current.open();
      expect(document.querySelector('[data-preview-image-slot]')).not.toBeNull();
      expect(document.querySelector('[data-preview-actions-slot]')).not.toBeNull();
      expect(image).toHaveBeenLastCalledWith(
        expect.objectContaining({
          src: 'first.png',
          alt: 'First preview image',
          current: 0,
          total: target === 'Image' ? 1 : 2,
        }),
      );
      const info = image.mock.calls.at(-1)?.[0];
      if (!info) throw new Error('Expected current image slot info');
      expect(isVNode(info.originNode)).toBe(true);
      expect(info.originNode.type).toBe('img');
      expect(previewImage().getAttribute('src')).toBe(info.src);
      control('rotateRight').click();
      await settle();
      expect(previewImage().style.transform).toContain('rotate(90deg)');
      expect(image).toHaveBeenLastCalledWith(
        expect.objectContaining({ transform: expect.objectContaining({ rotate: 90 }) }),
      );
      expect(actions).toHaveBeenLastCalledWith(
        expect.objectContaining({
          transform: expect.objectContaining({ rotate: 90 }),
          image: expect.objectContaining({ src: 'first.png' }),
        }),
      );
    });

    it(`${target}: replacing current slot functions preserves editor, image, focus and selection`, async () => {
      const rich = (revision: number) => (info: PreviewImageInfo) =>
        h('figure', { 'data-preview-rich': revision }, [
          info.originNode,
          h('input', { 'aria-label': 'Preview note', 'data-preview-editor': '' }),
          h('figcaption', null, `${revision}:${info.src}`),
        ]);
      const current = host(target, { previewImage: rich(0) });
      await current.open();
      const image = previewImage();
      const input = document.querySelector('[data-preview-editor]');
      if (!(input instanceof HTMLInputElement)) throw new Error('Missing actual preview editor');
      input.value = 'Draft note';
      input.focus();
      input.setSelectionRange(1, 5);
      current.slots.value = { previewImage: rich(1) };
      current.source.value = 'current.png';
      await settle();
      current.attrs.value = { 'data-unrelated': 'current' };
      await settle();
      expect(document.querySelector('[data-preview-editor]')).toBe(input);
      expect(previewImage()).toBe(image);
      expect(image.getAttribute('src')).toBe('current.png');
      expect(document.querySelector('figcaption')?.textContent).toBe('1:current.png');
      expect(input.value).toBe('Draft note');
      expect(document.activeElement).toBe(input);
      expect([input.selectionStart, input.selectionEnd]).toEqual([1, 5]);
    });

    it(`${target}: empty slots suppress defaults, and removing them restores defaults`, async () => {
      const current = host(target, { previewImage: () => null, previewActions: () => [] });
      await current.open();
      expect(document.querySelector('.apollo-image-preview-img')).toBeNull();
      expect(document.querySelector('.apollo-image-preview-actions')).toBeNull();
      expect(document.querySelector('[aria-label="rotateRight"]')).toBeNull();
      current.slots.value = {};
      await settle();
      expect(previewImage().getAttribute('src')).toBe('first.png');
      expect(control('rotateRight')).not.toBeNull();
    });

    it(`${target}: custom typed actions use the same transform kernel and close request`, async () => {
      const current = host(target, {
        previewActions: (info) =>
          h('section', { 'data-custom-toolbar': '' }, [
            h(
              'button',
              { 'aria-label': 'Custom rotate', onClick: info.actions.rotateRight },
              'Rotate',
            ),
            h('button', { 'aria-label': 'Custom reset', onClick: info.actions.reset }, 'Reset'),
            h(
              'button',
              {
                'aria-label': 'Custom zoom',
                onClick: info.actions.zoomIn,
                disabled: info.disabled.zoomIn,
              },
              'Zoom',
            ),
            h('button', { 'aria-label': 'Custom close', onClick: info.actions.close }, 'Close'),
          ]),
      });
      const transformed = vi.fn();
      current.attrs.value = { onTransform: transformed };
      await current.open();
      expect(document.querySelector('.apollo-image-preview-actions')).toBeNull();
      control('Custom rotate').click();
      await settle();
      expect(previewImage().style.transform).toContain('rotate(90deg)');
      expect(transformed).toHaveBeenLastCalledWith(expect.objectContaining({ rotate: 90 }));
      control('Custom reset').click();
      await settle();
      expect(previewImage().style.transform).toContain('rotate(0deg)');
      control('Custom zoom').click();
      await settle();
      expect(transformed).toHaveBeenLastCalledWith(expect.objectContaining({ scale: 1.1 }));
      control('Custom close').click();
      await vi.waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeNull(), {
        timeout: 1500,
      });
    });

    it(`${target}: disabled and SSR previews never eagerly evaluate preview slots`, async () => {
      const image = vi.fn((info: PreviewImageInfo) => info.originNode);
      const actions = vi.fn((info: PreviewActionsInfo) => info.originNode);
      const current = host(target, { previewImage: image, previewActions: actions });
      current.preview.value = false;
      await settle();
      await current.wrapper.get('.apollo-image').trigger('click');
      expect(image).not.toHaveBeenCalled();
      expect(actions).not.toHaveBeenCalled();
      const component =
        target === 'Image'
          ? h(
              Image,
              { src: 'server.png', defaultOpen: true },
              { previewImage: image, previewActions: actions },
            )
          : h(
              ImagePreviewGroup,
              { defaultOpen: true },
              {
                default: () => h(Image, { src: 'server.png' }),
                previewImage: image,
                previewActions: actions,
              },
            );
      const html = await renderToString(component);
      expect(html).not.toContain('role="dialog"');
      expect(image).not.toHaveBeenCalled();
      expect(actions).not.toHaveBeenCalled();
    });
  }

  it('Group count and image/action scopes track zero-based current, total and current source', async () => {
    const image = vi.fn((info: PreviewImageInfo) => info.originNode);
    const current = host('PreviewGroup', {
      previewImage: image,
      previewCount: ({ originNode, current, total }) =>
        h('p', { 'data-native-count': '' }, [
          originNode,
          h('span', null, `${current + 1} of ${total}`),
        ]),
    });
    await current.open();
    expect(document.querySelector('[data-native-count] span')?.textContent).toBe('1 of 2');
    control('Next image').click();
    await settle();
    expect(document.querySelector('[data-native-count] span')?.textContent).toBe('2 of 2');
    expect(image).toHaveBeenLastCalledWith(
      expect.objectContaining({ src: 'second.png', current: 1, total: 2 }),
    );
    current.slots.value = { previewCount: () => false };
    await settle();
    expect(document.querySelector('.apollo-image-preview-progress')).toBeNull();
    current.slots.value = {};
    await settle();
    expect(document.querySelector('.apollo-image-preview-progress')?.textContent).toBe('2 / 2');
  });

  it('grouped Images retain their thumbnail slot while only Group owns preview slots', async () => {
    const childImage = vi.fn((info: PreviewImageInfo) => info.originNode);
    const childActions = vi.fn((info: PreviewActionsInfo) => info.originNode);
    const groupImage = vi.fn((info: PreviewImageInfo) => info.originNode);
    const thumbnail = vi.fn((info: ImageRenderInfo) =>
      h('span', { 'data-child-thumbnail': '' }, [info.originNode]),
    );
    const wrapper = mount(ImagePreviewGroup, {
      ...options,
      slots: {
        previewImage: groupImage,
        default: () =>
          h(
            Image,
            { src: 'child.png' },
            { imageRender: thumbnail, previewImage: childImage, previewActions: childActions },
          ),
      },
    });
    expect(wrapper.find('[data-child-thumbnail]').exists()).toBe(true);
    await wrapper.get('.apollo-image').trigger('click');
    await settle();
    expect(groupImage).toHaveBeenCalled();
    expect(childImage).not.toHaveBeenCalled();
    expect(childActions).not.toHaveBeenCalled();
    expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(1);
  });

  it('an omitted source stays optional in the real image slot', async () => {
    const slot = vi.fn((info: PreviewImageInfo) => info.originNode);
    const current = host('Image', { previewImage: slot });
    current.source.value = undefined;
    await current.open();
    const info = slot.mock.calls.at(-1)?.[0];
    if (!info) throw new Error('Expected optional source info');
    expect(info.src).toBeUndefined();
    expect(previewImage().hasAttribute('src')).toBe(false);
  });

  it.each(['input', 'textarea', 'select'] as const)(
    'Group: native %s arrow keys do not navigate the gallery',
    async (tag) => {
      const current = host('PreviewGroup', {
        previewImage: (info) =>
          h('figure', [
            info.originNode,
            h(tag, { 'data-preview-editable': '', 'aria-label': 'Gallery editor' }),
          ]),
      });
      await current.open();
      const editor = document.querySelector('[data-preview-editable]');
      if (!(editor instanceof HTMLElement)) throw new Error('Missing actual native editor');
      editor.focus();
      const event = new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        bubbles: true,
        cancelable: true,
      });
      editor.dispatchEvent(event);
      await settle();
      expect(previewImage().getAttribute('src')).toBe('first.png');
      expect(document.activeElement).toBe(editor);
      expect(event.defaultPrevented).toBe(false);
    },
  );

  it('Progress CSR and SSR never evaluate preview render slots', async () => {
    const image = vi.fn((info: PreviewImageInfo) => info.originNode);
    const actions = vi.fn((info: PreviewActionsInfo) => info.originNode);
    const props = {
      src: 'loading.png',
      defaultOpen: true,
      placeholder: { progress: { percent: 50 } },
    };
    const slots = { previewImage: image, previewActions: actions };
    const wrapper = mount(Image, { ...options, props, slots });
    expect(wrapper.attributes('role')).toBe('progressbar');
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    const html = await renderToString(h(Image, props, slots));
    expect(html).toContain('role="progressbar"');
    expect(image).not.toHaveBeenCalled();
    expect(actions).not.toHaveBeenCalled();
  });
});
