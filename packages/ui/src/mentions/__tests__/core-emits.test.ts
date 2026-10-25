import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import Mentions from '../index';
import CoreEvents from './fixtures/CoreEvents.vue';

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});
async function typeValue(editor: HTMLTextAreaElement, value: string) {
  editor.value = value;
  editor.setSelectionRange(value.length, value.length);
  editor.dispatchEvent(new Event('input', { bubbles: true }));
  await nextTick();
  editor.dispatchEvent(new KeyboardEvent('keyup', { key: value.slice(-1), bubbles: true }));
  await nextTick();
  await nextTick();
}
const enter = (editor: HTMLTextAreaElement) =>
  editor.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Enter', which: 13, bubbles: true, cancelable: true }),
  );

describe('F09 Mentions core typed emits', () => {
  for (const allowClear of [false, true]) {
    it(`one native input sends one semantic change and model update (clear=${allowClear})`, async () => {
      const input = vi.fn<(event: Event) => void>();
      const wrapper = mount(Mentions, {
        props: { allowClear },
        attrs: { onInput: input },
        attachTo: document.body,
      });
      const editor = wrapper.get('textarea').element;
      if (!(editor instanceof HTMLTextAreaElement)) throw new Error('Expected editor');
      await typeValue(editor, 'abc');
      expect(wrapper.emitted('update:value')).toEqual([['abc']]);
      expect(wrapper.emitted('change')).toEqual([['abc']]);
      expect(input).toHaveBeenCalledExactlyOnceWith(expect.any(Event));
      expect(input.mock.calls[0]?.[0].target).toBe(editor);
      editor.dispatchEvent(new Event('change', { bubbles: true }));
      expect(wrapper.emitted('change')).toEqual([['abc']]);
      wrapper.unmount();
    });
  }

  it('real template once listeners receive semantic payloads and ignore native change/select', async () => {
    const changeOnce = vi.fn();
    const selectOnce = vi.fn();
    const searchOnce = vi.fn();
    const wrapper = mount(CoreEvents, {
      props: { changeOnce, selectOnce, searchOnce },
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    const editor = wrapper.get('textarea').element;
    if (!(editor instanceof HTMLTextAreaElement)) throw new Error('Expected editor');
    editor.dispatchEvent(new Event('change', { bubbles: true }));
    editor.dispatchEvent(new Event('select', { bubbles: true }));
    expect(changeOnce).not.toHaveBeenCalled();
    expect(selectOnce).not.toHaveBeenCalled();
    await typeValue(editor, '@');
    await typeValue(editor, '@a');
    expect(changeOnce).toHaveBeenCalledExactlyOnceWith('@');
    expect(searchOnce).toHaveBeenCalledExactlyOnceWith('', '@');
    enter(editor);
    await nextTick();
    expect(editor.value).toBe('@alpha ');
    expect(selectOnce).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ value: 'alpha' }),
      '@',
    );
    await typeValue(editor, '@b');
    enter(editor);
    await nextTick();
    expect(editor.value).toBe('@beta ');
    expect(changeOnce).toHaveBeenCalledTimes(1);
    expect(selectOnce).toHaveBeenCalledTimes(1);
    expect(searchOnce).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  });

  it('Vue listener arrays and current handler replacement each receive one event', async () => {
    const first = vi.fn();
    const second = vi.fn();
    const selection = vi.fn();
    const search = vi.fn();
    const warnings = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const wrapper = mount(Mentions, {
      props: { options: [{ value: 'alpha', label: 'Alpha' }] },
      attrs: { onChange: [first, second], onSelect: [selection], onSearch: [search] },
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    const editor = wrapper.get('textarea').element;
    if (!(editor instanceof HTMLTextAreaElement)) throw new Error('Expected editor');
    await typeValue(editor, '@');
    expect(first).toHaveBeenCalledExactlyOnceWith('@');
    expect(second).toHaveBeenCalledExactlyOnceWith('@');
    expect(search).toHaveBeenCalledExactlyOnceWith('', '@');
    enter(editor);
    await nextTick();
    expect(selection).toHaveBeenCalledTimes(1);
    expect(first).toHaveBeenCalledTimes(2);
    const current = vi.fn();
    await wrapper.setProps({ onChange: current });
    await typeValue(editor, 'current');
    expect(current).toHaveBeenCalledExactlyOnceWith('current');
    expect(first).toHaveBeenCalledTimes(2);
    expect(warnings).not.toHaveBeenCalled();
    wrapper.unmount();
  });
});
