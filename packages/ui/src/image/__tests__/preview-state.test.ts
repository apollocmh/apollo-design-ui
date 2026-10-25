import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { h, nextTick } from 'vue';
import { Image, ImagePreviewGroup, type ImageProps } from '../../index';
import ImageOpenModel from './fixtures/ImageOpenModel.vue';

type Target = 'Image' | 'PreviewGroup';
type StateProps = Pick<
  ImageProps,
  'open' | 'defaultOpen' | 'onOpenChange' | 'onUpdate:open' | 'preview'
>;
const targets: Target[] = ['Image', 'PreviewGroup'];
const options = { attachTo: document.body, global: { stubs: { teleport: false } } };

afterEach(() => {
  vi.restoreAllMocks();
});

function mountTarget(target: Target, state: StateProps = {}, attrs: Record<string, unknown> = {}) {
  if (target === 'Image') {
    return mount(Image, {
      ...options,
      props: { src: 'state.png', alt: 'State preview', ...state },
      attrs: { 'data-state-trigger': '', ...attrs },
    });
  }
  return mount(ImagePreviewGroup, {
    ...options,
    props: state,
    attrs,
    slots: {
      default: () => h(Image, { src: 'state.png', alt: 'State preview', 'data-state-trigger': '' }),
    },
  });
}

async function settle() {
  await nextTick();
  await nextTick();
  await nextTick();
}
function dialog() {
  return document.querySelector('[role="dialog"]');
}
function closePreview() {
  const mask = document.querySelector('.apollo-image-preview-mask');
  if (!(mask instanceof HTMLElement)) throw new Error('Expected an open preview mask');
  mask.click();
}
async function expectClosed() {
  // Real CSSMotion can retain leaving DOM until its existing 500ms deadline.
  await vi.waitFor(() => expect(dialog()).toBeNull(), { timeout: 1500 });
}
function callbacks() {
  const change = vi.fn<(next: boolean, previous: boolean) => void>();
  const update = vi.fn<(next: boolean) => void>();
  return { change, update, props: { onOpenChange: change, 'onUpdate:open': update } };
}
function assertCallbacks(
  listeners: ReturnType<typeof callbacks>,
  next: boolean,
  previous: boolean,
) {
  expect.soft(listeners.change).toHaveBeenCalledExactlyOnceWith(next, previous);
  expect(listeners.update).toHaveBeenCalledExactlyOnceWith(next);
}

describe('Image preview state through native v-model', () => {
  for (const target of ['image', 'group']) {
    it(`${target}: real SFC v-model:open follows external opening and closing assignments`, async () => {
      const wrapper = mount(ImageOpenModel, options);
      expect(dialog()).toBeNull();
      await wrapper.get(`[data-open-${target}-model]`).trigger('click');
      await settle();
      expect(wrapper.get(`[data-${target}-model-value]`).text()).toBe('true');
      expect(dialog()).not.toBeNull();
      const changes = target === 'image' ? 'data-image-model-changes' : 'data-group-open-changes';
      expect(wrapper.get(`[${changes}]`).text()).toBe('[]');
      await wrapper.get(`[data-close-${target}-model]`).trigger('click');
      await settle();
      await expectClosed();
      expect(wrapper.get(`[data-${target}-model-value]`).text()).toBe('false');
      expect(wrapper.get(`[${changes}]`).text()).toBe('[]');
    });

    it(`${target}: real SFC trigger and mask close update the model with previous state`, async () => {
      const wrapper = mount(ImageOpenModel, options);
      const trigger = target === 'image' ? 'data-state-model-image' : 'data-state-model-second';
      await wrapper.get(`[${trigger}]`).trigger('click');
      await settle();
      expect(dialog()).not.toBeNull();
      expect(wrapper.get(`[data-${target}-model-value]`).text()).toBe('true');
      const changes = target === 'image' ? 'data-image-model-changes' : 'data-group-open-changes';
      expect(wrapper.get(`[${changes}]`).text()).toBe('[[true,false]]');
      if (target === 'group') {
        expect(wrapper.get('[data-group-current-value]').text()).toBe('1');
        expect(wrapper.get('[data-group-model-changes]').text()).toBe('[[1,0]]');
        expect(wrapper.get('[data-group-model-updates]').text()).toBe('[1]');
        expect(document.querySelector('.apollo-image-preview-img')?.getAttribute('alt')).toBe(
          'Group model second',
        );
      }
      closePreview();
      await settle();
      await expectClosed();
      expect(wrapper.get(`[data-${target}-model-value]`).text()).toBe('false');
      expect(wrapper.get(`[${changes}]`).text()).toBe('[[true,false],[false,true]]');
    });
  }
});

describe('Image and PreviewGroup top-level preview state', () => {
  for (const target of targets) {
    it(`${target}: defaultOpen initializes an uncontrolled preview without emitting requests`, async () => {
      const listeners = callbacks();
      const wrapper = mountTarget(target, { defaultOpen: true, ...listeners.props });
      await settle();
      expect(dialog()).not.toBeNull();
      expect(listeners.change).not.toHaveBeenCalled();
      expect(listeners.update).not.toHaveBeenCalled();
      expect(wrapper.emitted('openChange')).toBeUndefined();
      expect(wrapper.emitted('update:open')).toBeUndefined();
    });

    it(`${target}: initial controlled true wins over defaultOpen false`, async () => {
      const listeners = callbacks();
      mountTarget(target, { open: true, defaultOpen: false, ...listeners.props });
      await settle();
      expect(dialog()).not.toBeNull();
      expect(listeners.change).not.toHaveBeenCalled();
      expect(listeners.update).not.toHaveBeenCalled();
    });

    it(`${target}: controlled false wins over defaultOpen true and a click only requests opening`, async () => {
      const listeners = callbacks();
      const wrapper = mountTarget(target, { open: false, defaultOpen: true, ...listeners.props });
      await settle();
      expect(dialog()).toBeNull();
      await wrapper.get('[data-state-trigger]').trigger('click');
      await settle();
      expect.soft(dialog()).toBeNull();
      assertCallbacks(listeners, true, false);
      expect(wrapper.emitted('openChange')).toEqual([[true, false]]);
      expect(wrapper.emitted('update:open')).toEqual([[true]]);
    });

    it(`${target}: later controlled updates remain authoritative and closing only requests a change`, async () => {
      const listeners = callbacks();
      const wrapper = mountTarget(target, { open: false, ...listeners.props });
      expect(dialog()).toBeNull();
      await wrapper.setProps({ open: true });
      await settle();
      expect(dialog()).not.toBeNull();
      expect(listeners.change).not.toHaveBeenCalled();
      closePreview();
      await settle();
      expect(dialog()).not.toBeNull();
      assertCallbacks(listeners, false, true);
      await wrapper.setProps({ open: false });
      await settle();
      await expectClosed();
      expect(listeners.change).toHaveBeenCalledTimes(1);
      expect(listeners.update).toHaveBeenCalledTimes(1);
      await wrapper.setProps({ open: true });
      await settle();
      expect(dialog()).not.toBeNull();
      expect(listeners.change).toHaveBeenCalledTimes(1);
    });

    it(`${target}: an uncontrolled trigger opens once and reports previous false`, async () => {
      const listeners = callbacks();
      const wrapper = mountTarget(target, listeners.props);
      expect(dialog()).toBeNull();
      await wrapper.get('[data-state-trigger]').trigger('click');
      await settle();
      expect(dialog()).not.toBeNull();
      assertCallbacks(listeners, true, false);
      expect(wrapper.emitted('openChange')).toEqual([[true, false]]);
      expect(wrapper.emitted('update:open')).toEqual([[true]]);
    });

    it(`${target}: an uncontrolled mask close reports previous true and really closes`, async () => {
      const listeners = callbacks();
      const wrapper = mountTarget(target, listeners.props);
      await wrapper.get('[data-state-trigger]').trigger('click');
      await settle();
      expect(dialog()).not.toBeNull();
      listeners.change.mockClear();
      listeners.update.mockClear();
      closePreview();
      await settle();
      await expectClosed();
      assertCallbacks(listeners, false, true);
      expect(wrapper.emitted('openChange')).toEqual([
        [true, false],
        [false, true],
      ]);
      expect(wrapper.emitted('update:open')).toEqual([[true], [false]]);
    });

    for (const initial of [false, true]) {
      it(`${target}: removing initial controlled ${initial} keeps the synchronized state`, async () => {
        const listeners = callbacks();
        const wrapper = mountTarget(target, {
          open: initial,
          defaultOpen: !initial,
          ...listeners.props,
        });
        await settle();
        expect(Boolean(dialog())).toBe(initial);
        await wrapper.setProps({ open: undefined });
        await settle();
        expect(Boolean(dialog())).toBe(initial);
        expect(listeners.change).not.toHaveBeenCalled();
        expect(listeners.update).not.toHaveBeenCalled();
      });
    }

    it(`${target}: removing a later controlled open preserves the last state`, async () => {
      const listeners = callbacks();
      const wrapper = mountTarget(target, { open: false, defaultOpen: false, ...listeners.props });
      await wrapper.setProps({ open: true });
      await settle();
      expect(dialog()).not.toBeNull();
      await wrapper.setProps({ open: undefined });
      await settle();
      expect(dialog()).not.toBeNull();
      expect(listeners.change).not.toHaveBeenCalled();
      expect(listeners.update).not.toHaveBeenCalled();
    });

    it(`${target}: changing defaultOpen after mount never resets uncontrolled state`, async () => {
      const wrapper = mountTarget(target, { defaultOpen: false });
      await settle();
      expect(dialog()).toBeNull();
      await wrapper.setProps({ defaultOpen: true });
      await settle();
      expect(dialog()).toBeNull();
      await wrapper.get('[data-state-trigger]').trigger('click');
      await settle();
      expect(dialog()).not.toBeNull();
      await wrapper.setProps({ defaultOpen: false });
      await settle();
      expect(dialog()).not.toBeNull();
      closePreview();
      await settle();
      await expectClosed();
      await wrapper.setProps({ defaultOpen: true });
      await settle();
      expect(dialog()).toBeNull();
    });

    it(`${target}: state event arrays, once, current listeners and ordering follow Vue`, async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const order: string[] = [];
      const first = vi.fn(() => order.push('first'));
      const second = vi.fn(() => order.push('second'));
      const once = vi.fn();
      const update = vi.fn(() => order.push('update'));
      const updateOnce = vi.fn();
      const wrapper = mountTarget(
        target,
        {},
        {
          onOpenChange: [first, second],
          onOpenChangeOnce: once,
          'onUpdate:open': [update],
          'onUpdate:openOnce': updateOnce,
        },
      );
      await wrapper.get('[data-state-trigger]').trigger('click');
      await settle();
      expect(dialog()).not.toBeNull();
      expect(first).toHaveBeenCalledExactlyOnceWith(true, false);
      expect(second).toHaveBeenCalledExactlyOnceWith(true, false);
      expect(once).toHaveBeenCalledExactlyOnceWith(true, false);
      expect(update).toHaveBeenCalledExactlyOnceWith(true);
      expect(updateOnce).toHaveBeenCalledExactlyOnceWith(true);
      expect(order).toEqual(['first', 'second', 'update']);
      closePreview();
      await settle();
      await expectClosed();
      expect(first).toHaveBeenLastCalledWith(false, true);
      expect(second).toHaveBeenCalledTimes(2);
      expect(once).toHaveBeenCalledTimes(1);
      expect(updateOnce).toHaveBeenCalledTimes(1);
      const current = vi.fn();
      const currentUpdate = vi.fn();
      await wrapper.setProps({ onOpenChange: current, 'onUpdate:open': currentUpdate });
      await wrapper.get('[data-state-trigger]').trigger('click');
      await settle();
      expect(current).toHaveBeenCalledExactlyOnceWith(true, false);
      expect(currentUpdate).toHaveBeenCalledExactlyOnceWith(true);
      expect(first).toHaveBeenCalledTimes(2);
      expect(second).toHaveBeenCalledTimes(2);
      expect(once).toHaveBeenCalledTimes(1);
      expect(updateOnce).toHaveBeenCalledTimes(1);
      expect(warn).not.toHaveBeenCalled();
      warn.mockRestore();
    });
  }
});

describe('PreviewGroup current typed events', () => {
  function groupProps() {
    return {
      default: () => [
        h(Image, { src: 'first.png', alt: 'First state image', 'data-current-first': '' }),
        h(Image, { src: 'second.png', alt: 'Second state image', 'data-current-second': '' }),
      ],
    };
  }
  it('preview=false ignores group triggers and enabling later does not reveal a latent preview', async () => {
    const listeners = callbacks();
    const wrapper = mount(ImagePreviewGroup, {
      ...options,
      props: { preview: false, ...listeners.props },
      slots: groupProps(),
    });
    await wrapper.get('[data-current-second]').trigger('click');
    await settle();
    expect(dialog()).toBeNull();
    expect(listeners.change).not.toHaveBeenCalled();
    expect(listeners.update).not.toHaveBeenCalled();
    await wrapper.setProps({ preview: true });
    await settle();
    expect(dialog()).toBeNull();
    expect(wrapper.emitted('openChange')).toBeUndefined();
    expect(wrapper.emitted('update:open')).toBeUndefined();
    await wrapper.get('[data-current-second]').trigger('click');
    await settle();
    expect(dialog()).not.toBeNull();
    assertCallbacks(listeners, true, false);
  });
  it('change/current arrays and once preserve number payloads and current listeners', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const first = vi.fn();
    const second = vi.fn();
    const once = vi.fn();
    const update = vi.fn();
    const updateOnce = vi.fn();
    const wrapper = mount(ImagePreviewGroup, {
      ...options,
      slots: groupProps(),
      attrs: {
        onChange: [first, second],
        onChangeOnce: once,
        'onUpdate:current': [update],
        'onUpdate:currentOnce': updateOnce,
      },
    });
    await wrapper.get('[data-current-second]').trigger('click');
    await settle();
    expect(first).toHaveBeenCalledExactlyOnceWith(1, 0);
    expect(second).toHaveBeenCalledExactlyOnceWith(1, 0);
    expect(once).toHaveBeenCalledExactlyOnceWith(1, 0);
    expect(update).toHaveBeenCalledExactlyOnceWith(1);
    expect(updateOnce).toHaveBeenCalledExactlyOnceWith(1);
    closePreview();
    await settle();
    await expectClosed();
    await wrapper.get('[data-current-first]').trigger('click');
    await settle();
    expect(first).toHaveBeenLastCalledWith(0, 1);
    expect(second).toHaveBeenCalledTimes(2);
    expect(once).toHaveBeenCalledTimes(1);
    expect(updateOnce).toHaveBeenCalledTimes(1);
    closePreview();
    await settle();
    await expectClosed();
    const current = vi.fn();
    const currentUpdate = vi.fn();
    await wrapper.setProps({ onChange: current, 'onUpdate:current': currentUpdate });
    await wrapper.get('[data-current-second]').trigger('click');
    await settle();
    expect(current).toHaveBeenCalledExactlyOnceWith(1, 0);
    expect(currentUpdate).toHaveBeenCalledExactlyOnceWith(1);
    expect(first).toHaveBeenCalledTimes(2);
    expect(second).toHaveBeenCalledTimes(2);
    expect(once).toHaveBeenCalledTimes(1);
    expect(wrapper.emitted('change')).toEqual([
      [1, 0],
      [0, 1],
      [1, 0],
    ]);
    expect(wrapper.emitted('update:current')).toEqual([[1], [0], [1]]);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
  it('controlled current remains authoritative while emitting requested numeric changes', async () => {
    const change = vi.fn();
    const update = vi.fn();
    const wrapper = mount(ImagePreviewGroup, {
      ...options,
      props: { current: 0, onChange: change, 'onUpdate:current': update },
      slots: groupProps(),
    });
    await wrapper.get('[data-current-second]').trigger('click');
    await settle();
    expect(change).toHaveBeenCalledExactlyOnceWith(1, 0);
    expect(update).toHaveBeenCalledExactlyOnceWith(1);
    expect(document.querySelector('.apollo-image-preview-img')?.getAttribute('alt')).toBe(
      'First state image',
    );
  });
});
