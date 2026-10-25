import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, shallowRef } from 'vue';
import { Image, type ImageRenderInfo } from '../index';
import ImageNativeEvents from './fixtures/ImageNativeEvents.vue';

afterEach(() => {
  vi.restoreAllMocks();
});

const mountOptions = {
  attachTo: document.body,
  global: { stubs: { teleport: false } },
};

async function settle() {
  await nextTick();
  await nextTick();
}

describe('Image native events and root attrs', () => {
  for (const preview of [false, true]) {
    it(`keydown delivers the original event alongside preview behavior (preview=${preview})`, async () => {
      const keydown = vi.fn();
      const wrapper = mount(Image, {
        ...mountOptions,
        props: { preview },
        attrs: { onKeydown: keydown },
      });
      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      });
      wrapper.element.dispatchEvent(event);
      await settle();
      expect.soft(keydown).toHaveBeenCalledExactlyOnceWith(event);
      expect(wrapper.emitted('keydown')).toEqual([[event]]);
      expect(event.defaultPrevented).toBe(preview);
      expect(Boolean(document.querySelector('[role="dialog"]'))).toBe(preview);
    });

    it(`keydown arrays, once and replacement use current native events (preview=${preview})`, async () => {
      const first = vi.fn();
      const second = vi.fn();
      const once = vi.fn();
      const current = vi.fn();
      const handlers = shallowRef<Record<string, unknown>>({
        onKeydown: [first, second],
        onKeydownOnce: once,
      });
      const Host = defineComponent({
        setup: () => () => h(Image, { preview, ...handlers.value }),
      });
      const wrapper = mount(Host, mountOptions);
      const root = wrapper.element;
      const event = new KeyboardEvent('keydown', { key: 'x', bubbles: true });
      root.dispatchEvent(event);
      root.dispatchEvent(new KeyboardEvent('keydown', { key: 'y', bubbles: true }));
      await settle();
      expect(first).toHaveBeenCalledTimes(2);
      expect(second).toHaveBeenCalledTimes(2);
      expect(first).toHaveBeenNthCalledWith(1, event);
      expect(second).toHaveBeenNthCalledWith(1, event);
      expect(once).toHaveBeenCalledExactlyOnceWith(event);
      handlers.value = { onKeydown: current, onKeydownOnce: once };
      await settle();
      const replacementEvent = new KeyboardEvent('keydown', { key: 'z', bubbles: true });
      root.dispatchEvent(replacementEvent);
      await settle();
      expect(wrapper.element).toBe(root);
      expect(first).toHaveBeenCalledTimes(2);
      expect(second).toHaveBeenCalledTimes(2);
      expect(once).toHaveBeenCalledTimes(1);
      expect(current).toHaveBeenCalledExactlyOnceWith(replacementEvent);
      expect(document.querySelector('[role="dialog"]')).toBeNull();
    });

    it(`native attrs update and remove without replacing root or img (preview=${preview})`, async () => {
      const native = shallowRef<Record<string, unknown>>({
        role: 'img',
        tabindex: 3,
        'aria-label': 'First name',
      });
      const Host = defineComponent({
        setup: () => () => h(Image, { preview, alt: 'Image alt', ...native.value }),
      });
      const wrapper = mount(Host);
      const root = wrapper.element;
      const img = wrapper.get('img').element;
      expect(wrapper.attributes('role')).toBe(preview ? 'button' : 'img');
      expect(wrapper.attributes('tabindex')).toBe(preview ? '0' : '3');
      expect(wrapper.attributes('aria-label')).toBe('First name');
      native.value = { role: 'presentation', tabindex: -1, 'aria-label': 'Current name' };
      await settle();
      expect(wrapper.attributes('role')).toBe(preview ? 'button' : 'presentation');
      expect(wrapper.attributes('tabindex')).toBe(preview ? '0' : '-1');
      expect(wrapper.attributes('aria-label')).toBe('Current name');
      native.value = { 'aria-label': '' };
      await settle();
      expect(wrapper.attributes('aria-label')).toBe('');
      native.value = {};
      await settle();
      expect(wrapper.attributes('role')).toBe(preview ? 'button' : undefined);
      expect(wrapper.attributes('tabindex')).toBe(preview ? '0' : undefined);
      expect(wrapper.attributes('aria-label')).toBe(preview ? 'Image alt' : undefined);
      expect(wrapper.element).toBe(root);
      expect(wrapper.get('img').element).toBe(img);
    });
  }

  it('preview=false preserves native role, tabindex and accessible name', () => {
    const wrapper = mount(Image, {
      props: { preview: false },
      attrs: { role: 'img', tabindex: 3, 'aria-label': 'Native image name' },
    });
    expect.soft(wrapper.attributes('role')).toBe('img');
    expect.soft(wrapper.attributes('tabindex')).toBe('3');
    expect(wrapper.attributes('aria-label')).toBe('Native image name');
  });

  it('preview=true keeps button semantics and an explicit accessible name', () => {
    const wrapper = mount(Image, {
      props: { alt: 'Image alt' },
      attrs: { role: 'img', tabindex: 3, 'aria-label': 'Native image name' },
    });
    expect(wrapper.attributes('role')).toBe('button');
    expect(wrapper.attributes('tabindex')).toBe('0');
    expect(wrapper.attributes('aria-label')).toBe('Native image name');
  });

  for (const preview of [false, true]) {
    it(`click arrays run after internal preview without Function prop warnings (preview=${preview})`, async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const order: string[] = [];
      const first = vi.fn(() => order.push('first'));
      const second = vi.fn(() => order.push('second'));
      const errors: unknown[] = [];
      const wrapper = mount(Image, {
        ...mountOptions,
        global: {
          stubs: { teleport: false },
          config: { errorHandler: (error) => errors.push(error) },
        },
        props: { preview: preview ? { onOpenChange: () => order.push('preview') } : false },
        attrs: { onClick: [first, second] },
      });
      const event = new MouseEvent('click', { bubbles: true });
      wrapper.element.dispatchEvent(event);
      await settle();
      expect.soft(errors).toEqual([]);
      expect.soft(first).toHaveBeenCalledExactlyOnceWith(event);
      expect.soft(second).toHaveBeenCalledExactlyOnceWith(event);
      expect(order).toEqual(preview ? ['preview', 'first', 'second'] : ['first', 'second']);
      expect(wrapper.emitted('click')).toEqual([[event]]);
      expect(wrapper.emitted('update:open')).toEqual(preview ? [[true]] : undefined);
      expect(Boolean(document.querySelector('[role="dialog"]'))).toBe(preview);
      expect(warn).not.toHaveBeenCalled();
    });

    it(`error arrays and once stay on original nonbubbling img errors (preview=${preview})`, async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const first = vi.fn();
      const second = vi.fn();
      const once = vi.fn();
      const wrapper = mount(Image, {
        props: { preview },
        attrs: { onError: [first, second], onErrorOnce: once },
      });
      const event = new Event('error');
      const nextEvent = new Event('error');
      const img = wrapper.get('img').element;
      img.dispatchEvent(event);
      img.dispatchEvent(nextEvent);
      wrapper.element.dispatchEvent(new Event('error'));
      await settle();
      expect(first).toHaveBeenCalledTimes(2);
      expect(second).toHaveBeenCalledTimes(2);
      expect(first).toHaveBeenNthCalledWith(1, event);
      expect(first).toHaveBeenNthCalledWith(2, nextEvent);
      expect(second).toHaveBeenNthCalledWith(1, event);
      expect(once).toHaveBeenCalledExactlyOnceWith(event);
      expect(event.target).toBe(img);
      expect(wrapper.emitted('error')).toEqual([[event], [nextEvent]]);
      expect(warn).not.toHaveBeenCalled();
    });

    it(`control: click.once and current replacement preserve original payloads (preview=${preview})`, async () => {
      const click = vi.fn();
      const once = vi.fn();
      const current = vi.fn();
      const wrapper = mount(Image, {
        ...mountOptions,
        props: { preview, onClick: click },
        attrs: { onClickOnce: once },
      });
      const event = new MouseEvent('click', { bubbles: true });
      const imgEvent = new MouseEvent('click', { bubbles: true });
      wrapper.element.dispatchEvent(event);
      wrapper.get('img').element.dispatchEvent(imgEvent);
      await settle();
      expect(click).toHaveBeenCalledTimes(2);
      expect(click).toHaveBeenNthCalledWith(2, imgEvent);
      expect(once).toHaveBeenCalledExactlyOnceWith(event);
      await wrapper.setProps({ onClick: current });
      const currentEvent = new MouseEvent('click', { bubbles: true });
      wrapper.element.dispatchEvent(currentEvent);
      await settle();
      expect(current).toHaveBeenCalledExactlyOnceWith(currentEvent);
      expect(click).toHaveBeenCalledTimes(2);
      expect(once).toHaveBeenCalledTimes(1);
    });

    it(`real template modifiers and once receive exact native events (preview=${preview})`, async () => {
      const click = vi.fn();
      const clickOnce = vi.fn();
      const error = vi.fn();
      const errorOnce = vi.fn();
      const keydown = vi.fn();
      const keydownOnce = vi.fn();
      const opened = vi.fn();
      const bubble = vi.fn();
      const wrapper = mount(ImageNativeEvents, {
        ...mountOptions,
        props: {
          preview,
          click,
          clickOnce,
          error,
          errorOnce,
          keydown,
          keydownOnce,
          opened,
          bubble,
        },
      });
      const root = wrapper.get('.apollo-image').element;
      const keyEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      });
      root.dispatchEvent(keyEvent);
      root.dispatchEvent(
        new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }),
      );
      await settle();
      expect(document.querySelector('[role="dialog"]')).toBeNull();
      expect(opened).not.toHaveBeenCalled();
      const clickEvent = new MouseEvent('click', { bubbles: true });
      root.dispatchEvent(clickEvent);
      root.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      const errorEvent = new Event('error');
      wrapper.get('img').element.dispatchEvent(errorEvent);
      wrapper.get('img').element.dispatchEvent(new Event('error'));
      await settle();
      expect(keydown).toHaveBeenCalledTimes(2);
      expect(keydown).toHaveBeenNthCalledWith(1, keyEvent);
      expect(keydownOnce).toHaveBeenCalledExactlyOnceWith(keyEvent);
      expect(keyEvent.defaultPrevented).toBe(true);
      expect(click).toHaveBeenCalledTimes(2);
      expect(clickOnce).toHaveBeenCalledExactlyOnceWith(clickEvent);
      expect(error).toHaveBeenCalledTimes(2);
      expect(errorOnce).toHaveBeenCalledExactlyOnceWith(errorEvent);
      expect(bubble).not.toHaveBeenCalled();
      if (preview) expect(opened).toHaveBeenCalledWith(true);
      else expect(opened).not.toHaveBeenCalled();
    });
  }

  it('current error listeners preserve the origin img and rich slot draft', async () => {
    const previous = vi.fn();
    const current = vi.fn();
    const error = shallowRef<(event: Event) => void>(previous);
    const Host = defineComponent({
      setup: () => () =>
        h(
          Image,
          { preview: false, onError: error.value },
          {
            imageRender: (info: ImageRenderInfo) =>
              h('figure', null, [
                info.originNode,
                h('input', { 'aria-label': 'Event image draft' }),
              ]),
          },
        ),
    });
    const wrapper = mount(Host, mountOptions);
    const img = wrapper.get('img').element;
    const input = wrapper.get('input').element;
    if (!(input instanceof HTMLInputElement)) throw new Error('Expected rich slot input');
    input.value = 'Keep this draft';
    input.focus();
    const event = new Event('error');
    img.dispatchEvent(event);
    error.value = current;
    await settle();
    const currentEvent = new Event('error');
    img.dispatchEvent(currentEvent);
    await settle();
    expect(previous).toHaveBeenCalledExactlyOnceWith(event);
    expect(current).toHaveBeenCalledExactlyOnceWith(currentEvent);
    expect(wrapper.get('img').element).toBe(img);
    expect(wrapper.get('input').element).toBe(input);
    expect(input.value).toBe('Keep this draft');
    expect(document.activeElement).toBe(input);
  });

  const placeholders = [
    { name: 'percent', value: { progress: { percent: 50 } } },
    { name: 'busy', value: { progress: true } },
    { name: 'plain', value: 'Loading image' },
  ];
  for (const placeholder of placeholders) {
    it(`${placeholder.name} placeholder emits click/keydown once and never opens a latent preview`, async () => {
      const click = vi.fn();
      const clickOnce = vi.fn();
      const keydown = vi.fn();
      const keydownOnce = vi.fn();
      const error = vi.fn();
      const errorOnce = vi.fn();
      const open = vi.fn();
      const wrapper = mount(Image, {
        ...mountOptions,
        props: { placeholder: placeholder.value, preview: { onOpenChange: open } },
        attrs: {
          onClick: [click],
          onClickOnce: clickOnce,
          onKeydown: [keydown],
          onKeydownOnce: keydownOnce,
          onError: error,
          onErrorOnce: errorOnce,
        },
      });
      const clickEvent = new MouseEvent('click', { bubbles: true });
      const keyEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      wrapper.element.dispatchEvent(clickEvent);
      wrapper.element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      wrapper.element.dispatchEvent(keyEvent);
      wrapper.element.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      wrapper.element.dispatchEvent(new Event('error'));
      await settle();
      expect(click).toHaveBeenCalledTimes(2);
      expect(clickOnce).toHaveBeenCalledExactlyOnceWith(clickEvent);
      expect(keydown).toHaveBeenCalledTimes(2);
      expect(keydownOnce).toHaveBeenCalledExactlyOnceWith(keyEvent);
      expect(wrapper.emitted('click')?.[0]).toEqual([clickEvent]);
      expect(wrapper.emitted('keydown')?.[0]).toEqual([keyEvent]);
      expect(error).not.toHaveBeenCalled();
      expect(errorOnce).not.toHaveBeenCalled();
      expect(open).not.toHaveBeenCalled();
      expect(wrapper.emitted('update:open')).toBeUndefined();
      expect(document.querySelector('[role="dialog"]')).toBeNull();
      await wrapper.setProps({ placeholder: undefined });
      await settle();
      expect(document.querySelector('[role="dialog"]')).toBeNull();
      wrapper.element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      const imgError = new Event('error');
      wrapper.get('img').element.dispatchEvent(imgError);
      await settle();
      expect(click).toHaveBeenCalledTimes(3);
      expect(clickOnce).toHaveBeenCalledTimes(1);
      expect(error).toHaveBeenCalledExactlyOnceWith(imgError);
      expect(errorOnce).toHaveBeenCalledExactlyOnceWith(imgError);
      expect(open).toHaveBeenCalledTimes(1);
      expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    });
  }
});
