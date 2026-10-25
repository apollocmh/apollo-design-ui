import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, shallowRef, type VNodeChild } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { Image, ImagePreviewGroup, type PreviewConfig, type PreviewImageInfo } from '../index';

vi.unmock('@apollo-design/motion');
type Target = 'image' | 'group';
const targets: Target[] = ['image', 'group'];
async function settle() {
  await nextTick();
  await nextTick();
}
function closeButton() {
  const node = document.querySelector('[role="dialog"] button[aria-label="Close preview"]');
  if (!(node instanceof HTMLButtonElement)) throw new Error('Missing actual close button');
  return node;
}
function host(
  target: Target,
  initial: PreviewConfig = {},
  initialSlots: Record<string, () => VNodeChild> = {},
) {
  const preview = shallowRef(initial);
  const slots = shallowRef(initialSlots);
  const changes = vi.fn();
  const Host = defineComponent({
    setup: () => () => {
      const shared = { preview: preview.value, onOpenChange: changes };
      const content = {
        previewImage: (info: PreviewImageInfo) =>
          h('figure', [info.originNode, h('input', { 'aria-label': 'Close preview draft' })]),
        ...slots.value,
      };
      return target === 'image'
        ? h(Image, { ...shared, src: 'first.png', alt: 'Close first' }, content)
        : h(ImagePreviewGroup, shared, {
            ...content,
            default: () => [
              h(Image, { src: 'first.png', alt: 'Close first' }),
              h(Image, { src: 'second.png', alt: 'Close second' }),
            ],
          });
    },
  });
  const wrapper = mount(Host, { attachTo: document.body, global: { stubs: { teleport: false } } });
  const open = async () => {
    await wrapper.get('.apollo-image').trigger('click');
    await settle();
  };
  return { wrapper, Host, preview, slots, changes, open };
}
describe.each(targets)('Current preview close controls (%s)', (target) => {
  it('keeps the built-in named button and current icons.close fallback', async () => {
    const current = host(target, {
      icons: { close: h('span', { 'data-close-fallback': '' }, 'Fallback') },
    });
    await current.open();
    expect(closeButton().querySelector('[data-close-fallback]')).not.toBeNull();
    current.wrapper.unmount();
  });
  it('honors closable=false without evaluating close icon content', async () => {
    const icon = vi.fn(() => h('span', 'Hidden icon'));
    const current = host(target, { closable: false }, { previewCloseIcon: icon });
    await current.open();
    expect(document.querySelector('[role="dialog"] .apollo-image-preview-close')).toBeNull();
    expect(icon).not.toHaveBeenCalled();
    current.wrapper.unmount();
  });
  it('uses current closeIcon data, explicit empty data, and the icons fallback after removal', async () => {
    const current = host(target, { closeIcon: h('span', { 'data-close-data': '' }, 'First') });
    await current.open();
    expect(closeButton().querySelector('[data-close-data]')?.textContent).toBe('First');
    current.preview.value = { closeIcon: h('span', { 'data-close-data': '' }, 'Second') };
    await settle();
    expect(closeButton().querySelector('[data-close-data]')?.textContent).toBe('Second');
    current.preview.value = { closeIcon: null };
    await settle();
    expect(closeButton().childNodes).toHaveLength(0);
    current.preview.value = { closeIcon: 0 };
    await settle();
    expect(closeButton().textContent).toBe('0');
    current.preview.value = { closeIcon: false };
    await settle();
    expect(closeButton().textContent).toBe('');
    current.preview.value = {};
    await settle();
    expect(closeButton().querySelector('svg')).not.toBeNull();
    current.wrapper.unmount();
  });
  it('gives the current native slot priority, including empty, then restores data on removal', async () => {
    const current = host(
      target,
      { closeIcon: h('span', 'Data') },
      { previewCloseIcon: () => h('span', 'Slot') },
    );
    await current.open();
    expect(closeButton().textContent).toBe('Slot');
    current.slots.value = { previewCloseIcon: () => [] };
    await settle();
    expect(closeButton().textContent).toBe('');
    expect(closeButton().querySelector('span, svg')).toBeNull();
    current.slots.value = {};
    await settle();
    expect(closeButton().textContent).toBe('Data');
    current.wrapper.unmount();
  });
  it('reads late and replaced close slot functions without replacing preview state', async () => {
    const current = host(target);
    await current.open();
    const dialog = document.querySelector('[role="dialog"]');
    const image = document.querySelector('.apollo-image-preview-img');
    const editor = document.querySelector('input[aria-label="Close preview draft"]');
    if (!(editor instanceof HTMLInputElement) || !(image instanceof HTMLImageElement))
      throw new Error('Missing preview content');
    const rotate = document.querySelector('[role="dialog"] button[aria-label="rotateRight"]');
    if (!(rotate instanceof HTMLButtonElement)) throw new Error('Missing rotate action');
    rotate.click();
    await settle();
    editor.value = 'Kept close draft';
    editor.focus();
    editor.setSelectionRange(2, 5);
    current.slots.value = { previewCloseIcon: () => h('span', 'Late') };
    await settle();
    expect(closeButton().textContent).toBe('Late');
    current.slots.value = { previewCloseIcon: () => h('span', 'Current') };
    await settle();
    expect(closeButton().textContent).toBe('Current');
    expect(document.querySelector('[role="dialog"]')).toBe(dialog);
    expect(document.querySelector('.apollo-image-preview-img')).toBe(image);
    expect(document.querySelector('input[aria-label="Close preview draft"]')).toBe(editor);
    expect(image.style.transform).toContain('rotate(90deg)');
    expect(document.activeElement).toBe(editor);
    expect(editor.value).toBe('Kept close draft');
    expect([editor.selectionStart, editor.selectionEnd]).toEqual([2, 5]);
    current.wrapper.unmount();
  });
  it('can hide/restore the button while open and closes once with an independently named empty icon', async () => {
    const current = host(target, {}, { previewCloseIcon: () => null });
    await current.open();
    const dialog = document.querySelector('[role="dialog"]');
    current.preview.value = { closable: false };
    await settle();
    expect(document.querySelector('[role="dialog"] .apollo-image-preview-close')).toBeNull();
    current.preview.value = { closable: true };
    await settle();
    expect(document.querySelector('[role="dialog"]')).toBe(dialog);
    expect(closeButton().getAttribute('aria-label')).toBe('Close preview');
    expect(closeButton().textContent).toBe('');
    expect(closeButton().querySelector('svg')).toBeNull();
    current.changes.mockClear();
    closeButton().click();
    await settle();
    expect(current.changes).toHaveBeenCalledExactlyOnceWith(false, true);
    current.wrapper.unmount();
  });
  it('does not eagerly evaluate a closed or SSR close slot', async () => {
    const icon = vi.fn(() => h('span', 'Lazy'));
    const current = host(target, {}, { previewCloseIcon: icon });
    await settle();
    expect(icon).not.toHaveBeenCalled();
    expect(await renderToString(h(current.Host))).not.toContain('Lazy');
    expect(icon).not.toHaveBeenCalled();
    current.wrapper.unmount();
  });
  it('repairs focus when hiding the focused button and keeps Escape available', async () => {
    const current = host(target);
    await current.open();
    closeButton().focus();
    current.preview.value = { closable: false };
    await settle();
    const dialog = document.querySelector('[role="dialog"]');
    if (!(dialog instanceof HTMLElement)) throw new Error('Missing actual dialog');
    expect(document.activeElement).toBe(dialog);
    current.changes.mockClear();
    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await settle();
    expect(current.changes).toHaveBeenCalledExactlyOnceWith(false, true);
    current.wrapper.unmount();
  });
});

it('Progress does not eagerly evaluate previewCloseIcon in CSR or SSR', async () => {
  const icon = vi.fn(() => h('span', 'Lazy progress icon'));
  const props = {
    src: 'first.png',
    alt: 'Progress close guard',
    open: true,
    placeholder: { progress: true },
  };
  const wrapper = mount(Image, { props, slots: { previewCloseIcon: icon } });
  await settle();
  expect(icon).not.toHaveBeenCalled();
  expect(await renderToString(h(Image, props, { previewCloseIcon: icon }))).not.toContain(
    'Lazy progress icon',
  );
  expect(icon).not.toHaveBeenCalled();
  wrapper.unmount();
});

it('Group owns its close icon and does not invoke a child preview icon slot', async () => {
  const child = vi.fn(() => h('span', 'Child icon'));
  const group = vi.fn(() => h('span', 'Group icon'));
  const wrapper = mount(
    defineComponent({
      setup: () => () =>
        h(
          ImagePreviewGroup,
          {},
          {
            default: () =>
              h(Image, { src: 'first.png', alt: 'Owned first' }, { previewCloseIcon: child }),
            previewCloseIcon: group,
          },
        ),
    }),
    { attachTo: document.body, global: { stubs: { teleport: false } } },
  );
  await wrapper.get('.apollo-image').trigger('click');
  await settle();
  expect(closeButton().textContent).toBe('Group icon');
  expect(child).not.toHaveBeenCalled();
  expect(group).toHaveBeenCalled();
  wrapper.unmount();
});
