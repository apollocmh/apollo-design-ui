import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import {
  Image,
  ImagePreviewGroup,
  type PreviewActionsInfo,
  type PreviewConfig,
  type PreviewImageInfo,
  type TransformInfo,
} from '../../index';

vi.unmock('@apollo-design/motion');

function action(name: string) {
  const node = document.querySelector(`[role="dialog"] button[aria-label="${name}"]`);
  if (!(node instanceof HTMLButtonElement)) throw new Error(`Missing actual ${name} action`);
  return node;
}
async function host(group: boolean, maximum = 50) {
  // Keep these clamp/identity scenarios at a deliberate 10% step. The public
  // default and live step replacement are covered by contract-audit.test.ts.
  const preview = ref<Pick<PreviewConfig, 'minScale' | 'maxScale' | 'scaleStep'>>({
    scaleStep: 0.1,
    minScale: 1,
    maxScale: maximum,
  });
  const notifications: TransformInfo[] = [];
  const Host = defineComponent({
    setup: () => () => {
      const slots = {
        previewImage: (info: PreviewImageInfo) =>
          h('figure', [info.originNode, h('input', { 'aria-label': 'Scale note' })]),
        previewActions: (info: PreviewActionsInfo) =>
          h('div', [
            info.originNode,
            h('output', { 'data-scale-disabled': '' }, String(info.disabled.zoomIn)),
          ]),
      };
      const props = {
        preview: preview.value,
        onTransform: (info: TransformInfo) => notifications.push(info),
      };
      return group
        ? h(ImagePreviewGroup, props, {
            ...slots,
            default: () => [
              h(Image, { src: 'scale.png', alt: 'Scale first' }),
              h(Image, { src: 'second.png', alt: 'Scale second' }),
            ],
          })
        : h(Image, { ...props, src: 'scale.png', alt: 'Scale first' }, slots);
    },
  });
  const wrapper = mount(Host, { attachTo: document.body, global: { stubs: { teleport: false } } });
  await nextTick();
  await nextTick();
  await wrapper.get('.apollo-image').trigger('click');
  await nextTick();
  await nextTick();
  const step = async (name: string) => {
    action(name).click();
    await nextTick();
  };
  return { wrapper, preview, notifications, step };
}

describe.each([false, true])('Current preview scale bounds (group=%s)', (group) => {
  it('raises the current maximum without remounting or emitting on the prop update', async () => {
    const current = await host(group, 1.05);
    await current.step('zoomIn');
    expect(current.notifications.at(-1)?.scale).toBe(1.05);
    expect(action('zoomIn').disabled).toBe(true);
    const dialog = document.querySelector('[role="dialog"]');
    const image = document.querySelector('.apollo-image-preview-img');
    const editor = document.querySelector('input[aria-label="Scale note"]');
    if (!(editor instanceof HTMLInputElement)) throw new Error('Missing preview editor');
    editor.value = 'Kept scaling note';
    editor.focus();
    editor.setSelectionRange(2, 5);
    const count = current.notifications.length;
    current.preview.value.maxScale = 2;
    await nextTick();
    await nextTick();
    expect(current.notifications).toHaveLength(count);
    expect(action('zoomIn').disabled).toBe(false);
    await current.step('zoomIn');
    expect(current.notifications.at(-1)?.scale).toBeCloseTo(1.155);
    expect(document.querySelector('[role="dialog"]')).toBe(dialog);
    expect(document.querySelector('.apollo-image-preview-img')).toBe(image);
    expect(document.querySelector('input[aria-label="Scale note"]')).toBe(editor);
    expect(editor.value).toBe('Kept scaling note');
    expect(document.activeElement).toBe(editor);
    expect([editor.selectionStart, editor.selectionEnd]).toEqual([2, 5]);
    current.wrapper.unmount();
  });

  it('uses a replaced smaller maximum on the next zoom operation', async () => {
    const current = await host(group);
    current.preview.value = { minScale: 1, maxScale: 1.05 };
    await nextTick();
    await nextTick();
    await current.step('zoomIn');
    expect(current.notifications.at(-1)?.scale).toBe(1.05);
    expect(action('zoomIn').disabled).toBe(true);
    current.wrapper.unmount();
  });

  it('uses the current minimum on the next zoom-out operation', async () => {
    const current = await host(group);
    await current.step('zoomIn');
    await current.step('zoomIn');
    expect(current.notifications.at(-1)?.scale).toBeCloseTo(1.21);
    current.preview.value.minScale = 1.15;
    await nextTick();
    await nextTick();
    await current.step('zoomOut');
    expect(current.notifications.at(-1)?.scale).toBe(1.15);
    expect(action('zoomOut').disabled).toBe(true);
    current.wrapper.unmount();
  });

  it('marks zoom-in disabled when a new maximum falls below the retained scale', async () => {
    const current = await host(group);
    await current.step('zoomIn');
    await current.step('zoomIn');
    const count = current.notifications.length;
    current.preview.value.maxScale = 1.05;
    await nextTick();
    await nextTick();
    expect(current.notifications).toHaveLength(count);
    expect(current.notifications.at(-1)?.scale).toBeCloseTo(1.21);
    expect(action('zoomIn').disabled).toBe(true);
    expect(document.querySelector('[data-scale-disabled]')?.textContent).toBe('true');
    await current.step('zoomOut');
    expect(current.notifications.at(-1)?.scale).toBe(1.05);
    current.wrapper.unmount();
  });

  it('restores the default upper bound when preview limits are removed', async () => {
    const current = await host(group, 1.05);
    await current.step('zoomIn');
    current.preview.value = { scaleStep: 0.1 };
    await nextTick();
    await nextTick();
    await current.step('zoomIn');
    expect(current.notifications.at(-1)?.scale).toBeCloseTo(1.155);
    current.wrapper.unmount();
  });

  it('wheel zoom reads current bounds while preserving the pointer anchor', async () => {
    const current = await host(group, 1.05);
    const image = document.querySelector('.apollo-image-preview-img');
    if (!(image instanceof HTMLImageElement)) throw new Error('Missing actual preview image');
    image.dispatchEvent(
      new WheelEvent('wheel', {
        deltaY: -1,
        clientX: 100,
        clientY: 80,
        bubbles: true,
        cancelable: true,
      }),
    );
    await nextTick();
    expect(current.notifications.at(-1)?.scale).toBe(1.05);
    current.preview.value.maxScale = 2;
    await nextTick();
    await nextTick();
    image.dispatchEvent(
      new WheelEvent('wheel', {
        deltaY: -1,
        clientX: 100,
        clientY: 80,
        bubbles: true,
        cancelable: true,
      }),
    );
    await nextTick();
    expect(current.notifications.at(-1)?.scale).toBeCloseTo(1.155);
    expect(current.notifications.at(-1)?.x).toBeCloseTo(-15.5);
    expect(current.notifications.at(-1)?.y).toBeCloseTo(-12.4);
    current.wrapper.unmount();
  });

  it('non-zoom transform updates also use the current clamp', async () => {
    const current = await host(group);
    current.preview.value.minScale = 1.15;
    await nextTick();
    await nextTick();
    expect(current.notifications).toHaveLength(0);
    await current.step('rotateRight');
    expect(current.notifications.at(-1)).toMatchObject({ scale: 1.15, rotate: 90 });
    current.wrapper.unmount();
  });
});
