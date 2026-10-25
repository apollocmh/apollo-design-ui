import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, shallowRef } from 'vue';
import { Image, ImagePreviewGroup, type TransformInfo } from '../index';
import ImageTransform from './fixtures/ImageTransform.vue';

vi.unmock('@apollo-design/motion');

type Target = 'Image' | 'PreviewGroup';
const targets: Target[] = ['Image', 'PreviewGroup'];
const initial: TransformInfo = { rotate: 0, scale: 1, flipX: false, flipY: false, x: 0, y: 0 };
const options = { attachTo: document.body, global: { stubs: { teleport: false } } };

async function settle() {
  await nextTick();
  await nextTick();
}

function control(name: string) {
  const button = document.querySelector(`[role="dialog"] button[aria-label="${name}"]`);
  if (!(button instanceof HTMLButtonElement)) throw new Error(`Missing preview action ${name}`);
  return button;
}

function image() {
  const node = document.querySelector('.apollo-image-preview-img');
  if (!(node instanceof HTMLImageElement)) throw new Error('Missing actual preview image');
  return node;
}

function mountTarget(target: Target, listeners: Record<string, unknown> = {}, preview = true) {
  const handlers = shallowRef(listeners);
  const Host = defineComponent({
    setup: () => () =>
      target === 'Image'
        ? h(Image, { src: 'first.png', alt: 'Transform first', preview, ...handlers.value })
        : h(
            ImagePreviewGroup,
            { preview, ...handlers.value },
            {
              default: () => [
                h(Image, { src: 'first.png', alt: 'Transform first' }),
                h(Image, { src: 'second.png', alt: 'Transform second' }),
              ],
            },
          ),
  });
  const wrapper = mount(Host, options);
  const component =
    target === 'Image' ? wrapper.findComponent(Image) : wrapper.findComponent(ImagePreviewGroup);
  const open = async () => {
    await wrapper.get('.apollo-image').trigger('click');
    await settle();
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
  };
  return { wrapper, component, handlers, open };
}

describe('Image/Group native transform events', () => {
  for (const target of targets) {
    it(`${target}: real rotation emits one detached TransformInfo snapshot`, async () => {
      const listener = vi.fn<(info: TransformInfo) => void>();
      const host = mountTarget(target, { onTransform: listener });
      await host.open();
      expect(listener).not.toHaveBeenCalled();
      control('rotateRight').click();
      await settle();
      expect(image().style.transform).toContain('rotate(90deg)');
      expect(listener).toHaveBeenCalledExactlyOnceWith({ ...initial, rotate: 90 });
      expect(host.component.emitted('transform')).toEqual([[{ ...initial, rotate: 90 }]]);
      const first = listener.mock.calls[0]?.[0];
      control('flipX').click();
      await settle();
      expect(listener).toHaveBeenNthCalledWith(2, { ...initial, rotate: 90, flipX: true });
      expect(first).toEqual({ ...initial, rotate: 90 });
    });

    it(`${target}: arrays, once, replacement and removal use current Vue listeners`, async () => {
      const first = vi.fn();
      const second = vi.fn();
      const once = vi.fn();
      const current = vi.fn();
      const host = mountTarget(target, { onTransform: [first, second], onTransformOnce: once });
      await host.open();
      const original = image();
      control('rotateRight').click();
      await settle();
      control('flipY').click();
      await settle();
      expect(first).toHaveBeenCalledTimes(2);
      expect(second).toHaveBeenCalledTimes(2);
      expect(once).toHaveBeenCalledExactlyOnceWith({ ...initial, rotate: 90 });
      host.handlers.value = { onTransform: current, onTransformOnce: once };
      await settle();
      control('rotateLeft').click();
      await settle();
      expect(image()).toBe(original);
      expect(first).toHaveBeenCalledTimes(2);
      expect(second).toHaveBeenCalledTimes(2);
      expect(once).toHaveBeenCalledTimes(1);
      expect(current).toHaveBeenCalledExactlyOnceWith({ ...initial, flipY: true });
      host.handlers.value = {};
      await settle();
      control('flipX').click();
      await settle();
      expect(current).toHaveBeenCalledTimes(1);
      expect(host.component.emitted('transform')).toHaveLength(4);
    });

    it(`${target}: a late listener receives the current transform without remounting`, async () => {
      const host = mountTarget(target);
      await host.open();
      const original = image();
      control('rotateRight').click();
      await settle();
      const current = vi.fn();
      host.handlers.value = { onTransform: current };
      await settle();
      expect(current).not.toHaveBeenCalled();
      control('flipX').click();
      await settle();
      expect(image()).toBe(original);
      expect(current).toHaveBeenCalledExactlyOnceWith({ ...initial, rotate: 90, flipX: true });
    });

    it(`${target}: accepted close emits the reset after the last transform`, async () => {
      const listener = vi.fn();
      const host = mountTarget(target, { onTransform: listener });
      await host.open();
      control('rotateRight').click();
      await settle();
      control('Close preview').click();
      await vi.waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeNull(), {
        timeout: 1500,
      });
      expect(listener.mock.calls).toEqual([[{ ...initial, rotate: 90 }], [initial]]);
      expect(host.component.emitted('transform')).toEqual([
        [{ ...initial, rotate: 90 }],
        [initial],
      ]);
    });

    it(`${target}: opening/disabled preview do not fabricate transform notifications`, async () => {
      const listener = vi.fn();
      const host = mountTarget(target, { onTransform: listener }, false);
      await host.wrapper.get('.apollo-image').trigger('click');
      await settle();
      expect(document.querySelector('[role="dialog"]')).toBeNull();
      expect(listener).not.toHaveBeenCalled();
      host.wrapper.element.dispatchEvent(new CustomEvent('transform', { bubbles: true }));
      expect(listener).not.toHaveBeenCalled();
    });

    it(`${target}: refusing a controlled close does not reset or notify until the parent closes`, async () => {
      const listener = vi.fn();
      const host = mountTarget(target, { open: true, onTransform: listener });
      await settle();
      control('rotateRight').click();
      await settle();
      control('Close preview').click();
      await settle();
      expect(image().style.transform).toContain('rotate(90deg)');
      expect(listener.mock.calls).toEqual([[{ ...initial, rotate: 90 }]]);
      host.handlers.value = { open: false, onTransform: listener };
      await vi.waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeNull(), {
        timeout: 1500,
      });
      expect(listener.mock.calls).toEqual([[{ ...initial, rotate: 90 }], [initial]]);
    });

    it(`${target}: the actual SFC infers TransformInfo and supports transform.once`, async () => {
      const received = vi.fn();
      const once = vi.fn();
      const wrapper = mount(ImageTransform, { ...options, props: { target, received, once } });
      await wrapper.get('.apollo-image').trigger('click');
      await settle();
      control('rotateRight').click();
      await settle();
      control('flipX').click();
      await settle();
      expect(received.mock.calls).toEqual([
        [{ ...initial, rotate: 90 }],
        [{ ...initial, rotate: 90, flipX: true }],
      ]);
      expect(once).toHaveBeenCalledExactlyOnceWith({ ...initial, rotate: 90 });
    });
  }

  it('Group owns preview notifications without duplicating them through child Images or root DOM events', async () => {
    const group = vi.fn();
    const child = vi.fn();
    const wrapper = mount(ImagePreviewGroup, {
      ...options,
      attrs: { onTransform: group },
      slots: { default: () => h(Image, { src: 'first.png', onTransform: child }) },
    });
    wrapper.element.dispatchEvent(new CustomEvent('transform', { bubbles: true }));
    expect(group).not.toHaveBeenCalled();
    await wrapper.get('.apollo-image').trigger('click');
    await settle();
    control('rotateRight').click();
    await settle();
    expect(group).toHaveBeenCalledExactlyOnceWith({ ...initial, rotate: 90 });
    expect(child).not.toHaveBeenCalled();
  });
});
