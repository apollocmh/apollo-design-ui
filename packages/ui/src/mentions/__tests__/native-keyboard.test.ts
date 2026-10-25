import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import Mentions from '../index';

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});
const options = [
  { value: 'alpha', label: 'Alpha' },
  { value: 'disabled', label: 'Disabled', disabled: true },
  { value: 'beta', label: 'Beta' },
];
async function open(allowClear = false) {
  const select = vi.fn();
  const search = vi.fn();
  const keydown = vi.fn();
  const wrapper = mount(Mentions, {
    props: { allowClear, options },
    attrs: { onSelect: select, onSearch: search, onKeydown: keydown },
    attachTo: document.body,
    global: { stubs: { teleport: false } },
  });
  const editor = wrapper.get('textarea').element;
  if (!(editor instanceof HTMLTextAreaElement)) throw new Error('Expected textarea');
  editor.focus();
  editor.value = '@';
  editor.setSelectionRange(1, 1);
  editor.dispatchEvent(new Event('input', { bubbles: true }));
  await nextTick();
  editor.dispatchEvent(new KeyboardEvent('keyup', { key: '@', bubbles: true }));
  await nextTick();
  await nextTick();
  return { wrapper, editor, select, search, keydown };
}
function key(
  editor: HTMLTextAreaElement,
  name: string,
  type = 'keydown',
  extra: KeyboardEventInit = {},
) {
  const event = new KeyboardEvent(type, { key: name, bubbles: true, cancelable: true, ...extra });
  editor.dispatchEvent(event);
  return event;
}
function active() {
  return document.body.querySelector('.apollo-mentions-dropdown-menu-item-active')?.textContent;
}

describe('F09 Mentions standard native keyboard', () => {
  for (const allowClear of [false, true]) {
    it(`key-only arrows skip disabled options and Enter selects once (clear=${allowClear})`, async () => {
      const { wrapper, editor, select, search } = await open(allowClear);
      expect(active()).toBe('Alpha');
      const down = key(editor, 'ArrowDown');
      await nextTick();
      expect(down.which).toBe(0);
      expect(down.defaultPrevented).toBe(true);
      expect(active()).toBe('Beta');
      key(editor, 'ArrowDown', 'keyup');
      await nextTick();
      expect(search).toHaveBeenCalledTimes(1);
      expect(active()).toBe('Beta');
      key(editor, 'ArrowUp');
      await nextTick();
      expect(active()).toBe('Alpha');
      key(editor, 'Enter');
      await nextTick();
      expect(editor.value).toBe('@alpha ');
      expect(select).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ value: 'alpha' }),
        '@',
      );
      expect(editor.selectionStart).toBe(7);
      wrapper.unmount();
    });
  }

  it('Escape closes and its keyup does not reopen or issue another search', async () => {
    const { wrapper, editor, search } = await open();
    key(editor, 'Escape');
    await nextTick();
    expect(document.body.querySelector('[role="menu"]')).toBeNull();
    key(editor, 'Escape', 'keyup');
    await nextTick();
    await nextTick();
    expect(document.body.querySelector('[role="menu"]')).toBeNull();
    expect(search).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  });

  it('standard key wins over a conflicting deprecated which value', async () => {
    const { wrapper, editor, select } = await open();
    key(editor, 'ArrowDown', 'keydown', { which: 13 });
    await nextTick();
    expect(active()).toBe('Beta');
    expect(select).not.toHaveBeenCalled();
    key(editor, 'F2', 'keydown', { which: 13 });
    await nextTick();
    expect(select).not.toHaveBeenCalled();
    expect(editor.value).toBe('@');
    key(editor, 'Enter');
    await nextTick();
    expect(editor.value).toBe('@beta ');
    expect(select).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  });

  for (const composingKey of [
    { name: 'ArrowDown', which: 40 },
    { name: 'Enter', which: 13 },
  ]) {
    it(`IME composing ${composingKey.name} stays with composition while listeners receive it`, async () => {
      const { wrapper, editor, select, keydown } = await open();
      const event = key(editor, composingKey.name, 'keydown', {
        which: composingKey.which,
        isComposing: true,
      });
      await nextTick();
      expect(event.defaultPrevented).toBe(false);
      expect(active()).toBe('Alpha');
      expect(editor.value).toBe('@');
      expect(select).not.toHaveBeenCalled();
      expect(keydown).toHaveBeenCalledExactlyOnceWith(event);
      key(editor, 'Enter');
      await nextTick();
      expect(editor.value).toBe('@alpha ');
      expect(select).toHaveBeenCalledTimes(1);
      wrapper.unmount();
    });
  }
});
