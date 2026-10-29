import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { InternalMentions } from '../engine/Mentions';
import Mentions from '../index';
import NativeEvents from './fixtures/NativeEvents.vue';

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

function editorOf(wrapper: ReturnType<typeof mount>) {
  const node = wrapper.get('textarea').element;
  if (!(node instanceof HTMLTextAreaElement)) throw new Error('Expected textarea');
  return node;
}

describe('F09 Mentions native listeners and lifecycle', () => {
  for (const allowClear of [false, true]) {
    it(`focus/blur/input arrays receive actual events once (clear=${allowClear})`, async () => {
      const focus = vi.fn();
      const blur = vi.fn();
      const input = vi.fn();
      const wrapper = mount(Mentions, {
        props: { allowClear },
        attrs: { onFocus: [focus], onBlur: [blur], onInput: [input] },
        attachTo: document.body,
      });
      const editor = editorOf(wrapper);
      editor.focus();
      await nextTick();
      expect(focus).toHaveBeenCalledExactlyOnceWith(expect.any(FocusEvent));
      expect(focus.mock.calls[0]?.[0].target).toBe(editor);
      expect(wrapper.get('.apollo-mentions').classes()).toContain('apollo-mentions-focused');
      editor.value = 'text';
      editor.dispatchEvent(new Event('input', { bubbles: true }));
      await nextTick();
      expect(input).toHaveBeenCalledExactlyOnceWith(expect.any(Event));
      expect(wrapper.emitted('change')).toEqual([['text']]);
      editor.blur();
      await new Promise((resolve) => setTimeout(resolve, 5));
      await nextTick();
      expect(blur).toHaveBeenCalledExactlyOnceWith(expect.any(FocusEvent));
      expect(wrapper.get('.apollo-mentions').classes()).not.toContain('apollo-mentions-focused');
      const replacement = vi.fn();
      await wrapper.setProps({ onFocus: replacement });
      editor.focus();
      await nextTick();
      expect(replacement).toHaveBeenCalledTimes(1);
      expect(focus).toHaveBeenCalledTimes(1);
      wrapper.unmount();
    });
  }

  it('clear wrapper keeps its public focused class with ordinary handlers', async () => {
    const focus = vi.fn();
    const wrapper = mount(Mentions, {
      props: { allowClear: true },
      attrs: { onFocus: focus },
      attachTo: document.body,
    });
    editorOf(wrapper).focus();
    await nextTick();
    expect(focus).toHaveBeenCalledTimes(1);
    expect(wrapper.get('.apollo-mentions').classes()).toContain('apollo-mentions-focused');
    wrapper.unmount();
  });

  it('real template keyboard modifiers and once use actual native events', async () => {
    const down = vi.fn();
    const up = vi.fn();
    const focus = vi.fn();
    const blur = vi.fn();
    const bubble = vi.fn();
    const wrapper = mount(NativeEvents, {
      props: { down, up, focus, blur, bubble },
      attachTo: document.body,
    });
    const editor = editorOf(wrapper);
    editor.focus();
    await nextTick();
    const event = new KeyboardEvent('keydown', { key: 'x', bubbles: true, cancelable: true });
    editor.dispatchEvent(event);
    editor.dispatchEvent(new KeyboardEvent('keyup', { key: 'x', bubbles: true }));
    expect(down).toHaveBeenCalledExactlyOnceWith(event);
    expect(event.defaultPrevented).toBe(true);
    expect(up).toHaveBeenCalledExactlyOnceWith(expect.any(KeyboardEvent));
    expect(bubble).not.toHaveBeenCalled();
    editor.blur();
    await new Promise((resolve) => setTimeout(resolve, 5));
    await nextTick();
    editor.focus();
    await nextTick();
    editor.blur();
    await new Promise((resolve) => setTimeout(resolve, 5));
    expect(focus).toHaveBeenCalledTimes(1);
    expect(blur).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  });

  it('clear/pressEnter listener arrays and once are dispatched through Vue', async () => {
    const clear = vi.fn();
    const clearOnce = vi.fn();
    const enter = vi.fn();
    const enterOnce = vi.fn();
    const wrapper = mount(Mentions, {
      props: { allowClear: true, defaultValue: 'initial' },
      attrs: {
        onClear: [clear],
        onClearOnce: clearOnce,
        onPressEnter: [enter],
        onPressEnterOnce: enterOnce,
      },
      attachTo: document.body,
    });
    const editor = editorOf(wrapper);
    await wrapper.get('.apollo-mentions-clear-icon').trigger('click');
    editor.value = 'again';
    editor.dispatchEvent(new Event('input', { bubbles: true }));
    await nextTick();
    await wrapper.get('.apollo-mentions-clear-icon').trigger('click');
    editor.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    editor.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(clear).toHaveBeenCalledTimes(2);
    expect(clearOnce).toHaveBeenCalledTimes(1);
    expect(clear.mock.calls[0]).toEqual([]);
    expect(enter).toHaveBeenCalledTimes(2);
    expect(enterOnce).toHaveBeenCalledTimes(1);
    expect(enter.mock.calls[0]?.[0]).toBeInstanceOf(KeyboardEvent);
    wrapper.unmount();
  });

  it('popupScroll and resize accept listener arrays and once with current payloads', async () => {
    const scroll = vi.fn();
    const scrollOnce = vi.fn();
    const resize = vi.fn();
    const resizeOnce = vi.fn();
    const wrapper = mount(Mentions, {
      props: { autoSize: true, options: [{ value: 'alpha', label: 'Alpha' }] },
      attrs: {
        onPopupScroll: [scroll],
        onPopupScrollOnce: scrollOnce,
        onResize: [resize],
        onResizeOnce: resizeOnce,
      },
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    const editor = editorOf(wrapper);
    editor.value = '@';
    editor.setSelectionRange(1, 1);
    editor.dispatchEvent(new Event('input', { bubbles: true }));
    await nextTick();
    editor.dispatchEvent(new KeyboardEvent('keyup', { key: '@', bubbles: true }));
    await nextTick();
    await nextTick();
    const menu = document.body.querySelector('[role="menu"]');
    if (!menu) throw new Error('Expected popup menu');
    const event = new Event('scroll');
    menu.dispatchEvent(event);
    menu.dispatchEvent(new Event('scroll'));
    expect(scroll).toHaveBeenCalledTimes(2);
    expect(scrollOnce).toHaveBeenCalledExactlyOnceWith(event);
    expect(resize).toHaveBeenCalled();
    expect(resizeOnce).toHaveBeenCalledTimes(1);
    expect(resize.mock.calls[0]?.[0]).toEqual({
      width: expect.any(Number),
      height: expect.any(Number),
    });
    wrapper.unmount();
  });

  it('pending blur is cancelled on unmount before invoking consumers', async () => {
    vi.useFakeTimers();
    const blur = vi.fn();
    const wrapper = mount(InternalMentions, {
      props: { prefixCls: 'apollo-mentions', onBlur: blur },
      attachTo: document.body,
    });
    editorOf(wrapper).dispatchEvent(new FocusEvent('blur'));
    expect(vi.getTimerCount()).toBe(1);
    wrapper.unmount();
    expect(vi.getTimerCount()).toBe(0);
    vi.runAllTimers();
    expect(blur).not.toHaveBeenCalled();
  });
});
