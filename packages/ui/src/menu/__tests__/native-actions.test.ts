import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, expect, it, vi } from 'vitest';
import { h, nextTick, type VNodeChild } from 'vue';
import type { ItemType, MenuInfo } from '../interface';
import Menu from '../Menu';

const wrappers: VueWrapper[] = [];
afterEach(() => {
  for (const wrapper of wrappers.splice(0)) wrapper.unmount();
  vi.useRealTimers();
});

function rig(label: VNodeChild, disabled = false, menuDisabled = false) {
  const click = vi.fn<(info: MenuInfo) => void>();
  const open = vi.fn();
  const items: ItemType[] = [{ key: 'action', label, disabled }];
  const wrapper = mount(Menu, {
    props: { items, disabled: menuDisabled, onClick: click, onOpenChange: open },
    attachTo: document.body,
  });
  wrappers.push(wrapper);
  return { wrapper, click, open, item: wrapper.get<HTMLElement>('[role="menuitem"]') };
}

function key(node: HTMLElement, value = 'Enter', code = 13) {
  const event = new KeyboardEvent('keydown', {
    key: value,
    keyCode: code,
    bubbles: true,
    cancelable: true,
  });
  node.dispatchEvent(event);
  return event;
}

it('container Enter activates its single owned link through one native click', async () => {
  const native = vi.fn((event: MouseEvent) => event.preventDefault());
  const { item, click, open } = rig(
    h('a', { href: '#owned-link', onClick: native }, 'Destination'),
  );
  item.element.focus();
  key(item.element);
  await nextTick();
  expect(native).toHaveBeenCalledTimes(1);
  expect(click).toHaveBeenCalledTimes(1);
  expect(click.mock.calls[0]?.[0].domEvent).toBeInstanceOf(MouseEvent);
  expect(open).not.toHaveBeenCalled();
});

it.each(['a', 'button'] as const)(
  'a focused native %s owns Enter and does not double emit',
  async (tag) => {
    const native = vi.fn((event: MouseEvent) => event.preventDefault());
    const { wrapper, click, open, item } = rig(
      h(
        tag,
        {
          href: tag === 'a' ? '#direct' : undefined,
          type: tag === 'button' ? 'button' : undefined,
          onClick: native,
        },
        'Action',
      ),
    );
    const control = wrapper.get<HTMLElement>(tag);
    control.element.focus();
    await nextTick();
    expect(item.classes()).toContain('apollo-menu-item-active');
    const event = key(control.element);
    expect(event.defaultPrevented).toBe(false);
    expect(click).not.toHaveBeenCalled();
    control.element.click(); // jsdom does not synthesize the browser's default click.
    expect(native).toHaveBeenCalledTimes(1);
    expect(click).toHaveBeenCalledTimes(1);
    expect(open).not.toHaveBeenCalled();
  },
);

it('container Enter activates a single owned button once', () => {
  const native = vi.fn();
  const { item, click } = rig(h('button', { type: 'button', onClick: native }, 'Action'));
  key(item.element);
  expect(native).toHaveBeenCalledTimes(1);
  expect(click).toHaveBeenCalledTimes(1);
});

it('a native control can cancel its key before the menu sees it', () => {
  const { wrapper, click } = rig(
    h(
      'a',
      { href: '#cancel', onKeydown: (event: KeyboardEvent) => event.preventDefault() },
      'Cancel',
    ),
  );
  const event = key(wrapper.get<HTMLElement>('a').element);
  expect(event.defaultPrevented).toBe(true);
  expect(click).not.toHaveBeenCalled();
});

it.each([false, true])(
  'disabled item or menu blocks owned native click (menu=%s)',
  (menuDisabled) => {
    const native = vi.fn();
    const { wrapper, click, item } = rig(
      h('a', { href: '#disabled', onClick: native }, 'Disabled'),
      !menuDisabled,
      menuDisabled,
    );
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    wrapper.get('a').element.dispatchEvent(event);
    expect(item.attributes('aria-disabled')).toBe('true');
    expect(event.defaultPrevented).toBe(true);
    expect(native).not.toHaveBeenCalled();
    expect(click).not.toHaveBeenCalled();
  },
);

it('a sole disabled native button cannot become a menu action', () => {
  const native = vi.fn();
  const { item, click } = rig(
    h('button', { type: 'button', disabled: true, onClick: native }, 'Disabled'),
  );
  key(item.element);
  expect(native).not.toHaveBeenCalled();
  expect(click).not.toHaveBeenCalled();
});

it.each(['Enter', ' '])(
  'plain menuitem %j emits once without phantom submenu opening',
  async (value) => {
    const { item, click, open } = rig('Plain');
    item.element.focus();
    const event = key(item.element, value, value === 'Enter' ? 13 : 32);
    await nextTick();
    expect(event.defaultPrevented).toBe(true);
    expect(click).toHaveBeenCalledTimes(1);
    expect(open).not.toHaveBeenCalled();
  },
);

it.each(['input', 'textarea', 'select'] as const)(
  'native %s retains Enter and arrow keys',
  async (tag) => {
    const { wrapper, click, open } = rig(h(tag, { 'aria-label': 'Editor' }));
    const editor = wrapper.get<HTMLElement>(tag).element;
    editor.focus();
    expect(key(editor).defaultPrevented).toBe(false);
    expect(key(editor, 'ArrowDown', 40).defaultPrevented).toBe(false);
    await nextTick();
    expect(click).not.toHaveBeenCalled();
    expect(open).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(editor);
  },
);

it('a container does not guess between multiple owned controls', () => {
  const native = vi.fn();
  const { item, click } = rig(
    h('span', [
      h('button', { onClick: native }, 'First'),
      h('button', { onClick: native }, 'Second'),
    ]),
  );
  key(item.element);
  expect(native).not.toHaveBeenCalled();
  expect(click).toHaveBeenCalledTimes(1);
});

it('standard key-only KeyboardEvents activate a plain item', () => {
  const { item, click } = rig('Plain');
  key(item.element, 'Enter', 0);
  expect(click).toHaveBeenCalledTimes(1);
});

it.each(['true', 'plaintext-only'])(
  'contenteditable=%s retains its editing keys',
  (contenteditable) => {
    const { wrapper, click, open } = rig(h('div', { contenteditable, tabindex: 0 }, 'Draft'));
    const editor = wrapper.get<HTMLElement>('[contenteditable]').element;
    editor.focus();
    expect(key(editor).defaultPrevented).toBe(false);
    expect(key(editor, 'ArrowDown', 40).defaultPrevented).toBe(false);
    expect(click).not.toHaveBeenCalled();
    expect(open).not.toHaveBeenCalled();
  },
);

it('pending roving focus is cancelled when the owning menu unmounts', async () => {
  vi.useFakeTimers();
  const items: ItemType[] = [
    { key: 'a', label: 'First' },
    { key: 'b', label: 'Second' },
  ];
  const wrapper = mount(Menu, { props: { items }, attachTo: document.body });
  wrappers.push(wrapper);
  const rows = wrapper.findAll<HTMLElement>('[role="menuitem"]');
  const first = rows[0]?.element,
    second = rows[1]?.element;
  if (!first || !second) throw Error('Missing menu rows');
  const focus = vi.spyOn(second, 'focus');
  first.focus();
  key(first, 'ArrowDown', 40);
  await nextTick();
  wrapper.unmount();
  await vi.advanceTimersByTimeAsync(30);
  expect(focus).not.toHaveBeenCalled();
});
