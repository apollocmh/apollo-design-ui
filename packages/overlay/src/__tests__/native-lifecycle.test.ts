import { mount } from '@vue/test-utils';
import { afterEach, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, reactive, ref, Teleport } from 'vue';
import { createEscStack } from '../esc-stack';
import {
  getGlobalEscStack,
  type UseOverlayOptions,
  type UseOverlayReturn,
  useOverlay,
} from '../use-overlay';

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function rig(options: UseOverlayOptions = {}, popupHost?: HTMLElement, keepPopup = false) {
  let state: UseOverlayReturn | undefined;
  const wrapper = mount(
    defineComponent({
      setup() {
        const api = useOverlay(options);
        state = api;
        return () => {
          const popup =
            keepPopup || api.open.value
              ? h('div', { ref: api.popupRef, ...api.popupProps.value }, 'Popup')
              : null;
          return h('section', [
            h('button', { ref: api.targetRef, ...api.targetProps.value }, 'Trigger'),
            popupHost ? h(Teleport, { to: popupHost }, [popup]) : popup,
          ]);
        };
      },
    }),
    { attachTo: document.body, global: { stubs: { teleport: false } } },
  );
  if (!state) throw Error('Missing overlay setup');
  return { api: state, wrapper };
}

function frameDocument() {
  const frame = document.createElement('iframe');
  document.body.append(frame);
  const doc = frame.contentDocument;
  const win = frame.contentWindow;
  if (!doc || !win) throw Error('Missing same-origin frame document');
  return { frame, doc, win };
}

function pressEsc(win: Window = window) {
  win.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
}

it.each([false, true])(
  'separate apps retain independent Esc entries (injected=%s)',
  async (injected) => {
    const stack = injected ? createEscStack({ win: window }) : getGlobalEscStack();
    const options = injected ? { escStack: stack } : {};
    const first = rig(options);
    const second = rig(options);
    first.api.setOpen(true);
    second.api.setOpen(true);
    await nextTick();

    expect(first.api.escId).not.toBe(second.api.escId);
    expect(stack.size).toBe(2);
    pressEsc();
    expect(first.api.open.value).toBe(true);
    expect(second.api.open.value).toBe(false);
    expect(stack.size).toBe(1);
    second.wrapper.unmount();
    expect(stack.attached).toBe(true);
    pressEsc();
    expect(first.api.open.value).toBe(false);
    expect(stack.size).toBe(0);
    expect(stack.attached).toBe(false);
  },
);

it('Esc follows the popup owner window and releases the previous window on replacement', async () => {
  const { doc, win } = frameDocument();
  const { api } = rig({ defaultOpen: true });
  expect(getGlobalEscStack().size).toBe(1);
  const popup = doc.createElement('div');
  doc.body.append(popup);
  api.popupRef.value = popup;
  expect(getGlobalEscStack().size).toBe(0);
  expect(getGlobalEscStack().attached).toBe(false);

  pressEsc();
  expect(api.open.value).toBe(true);
  pressEsc(win);
  expect(api.open.value).toBe(false);
  await nextTick();
});

it('a cross-document popup receives Esc in its own window', async () => {
  const { doc, win } = frameDocument();
  const { api } = rig({ defaultOpen: true }, doc.body);
  await nextTick();
  pressEsc(win);
  expect(api.open.value).toBe(false);
});

it('cross-realm popup descendants remain inside for native mousedown and contextmenu', async () => {
  const { doc } = frameDocument();
  const { api } = rig({ defaultOpen: true, action: 'click' }, doc.body);
  await nextTick();
  const child = doc.createElement('button');
  api.popupRef.value?.append(child);
  expect(child instanceof Node).toBe(false);

  child.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  expect(api.open.value).toBe(true);
  child.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true }));
  expect(api.open.value).toBe(true);
  doc.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  expect(api.open.value).toBe(false);
});

it('cross-realm popup hover cancels the pending trigger leave', async () => {
  vi.useFakeTimers();
  const { doc } = frameDocument();
  const { api, wrapper } = rig(
    { defaultOpen: true, action: 'hover', mouseEnterDelay: 0, mouseLeaveDelay: 0.1 },
    doc.body,
  );
  const child = doc.createElement('span');
  api.popupRef.value?.append(child);
  await wrapper.get('button').trigger('mouseleave');
  child.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
  await vi.advanceTimersByTimeAsync(150);
  expect(api.open.value).toBe(true);
});

it('outside clicks in the trigger document close a cross-document popup', async () => {
  const { doc } = frameDocument();
  const { api } = rig({ defaultOpen: true, action: 'click' }, doc.body);
  await nextTick();
  document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  expect(api.open.value).toBe(false);
});

it('retained popup listeners follow open, mask and hide-action configuration', async () => {
  const action = ref<'click' | 'hover'>('click');
  const mask = ref(true);
  const maskClosable = ref(false);
  const { api, wrapper } = rig({ defaultOpen: true, action, mask, maskClosable }, undefined, true);
  const remove = vi.spyOn(window, 'removeEventListener');
  document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  expect(api.open.value).toBe(true);
  maskClosable.value = true;
  api.setOpen(false);
  expect(remove).toHaveBeenCalledWith('mousedown', expect.any(Function), true);
  await nextTick();
  api.setOpen(true);
  action.value = 'hover';
  await nextTick();
  document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  expect(api.open.value).toBe(true);
  action.value = 'click';
  await nextTick();
  document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  expect(api.open.value).toBe(false);
  wrapper.unmount();
});

it('current callbacks and action/delay inputs remain reactive without changing native events', async () => {
  vi.useFakeTimers();
  const first = vi.fn();
  const second = vi.fn();
  const options = reactive<UseOverlayOptions>({
    action: 'hover',
    mouseEnterDelay: 0.1,
    onOpenChange: first,
  });
  const { api, wrapper } = rig(options);
  options.mouseEnterDelay = 0;
  options.onOpenChange = second;
  const event = new MouseEvent('mouseenter', { clientX: 12, clientY: 34 });
  wrapper.get('button').element.dispatchEvent(event);
  expect(api.open.value).toBe(true);
  expect(api.mousePos.value).toEqual([12, 34]);
  expect(first).not.toHaveBeenCalled();
  expect(second).toHaveBeenCalledExactlyOnceWith(true);
  options.action = 'focus';
  await nextTick();
  expect(api.targetProps.value.onMouseenter).toBeUndefined();
  expect(api.targetProps.value.onFocus).toBeTypeOf('function');
});

it('unmount releases default stack and every owner-window listener before remounting', async () => {
  const { doc, win } = frameDocument();
  const outerRemove = vi.spyOn(window, 'removeEventListener');
  const frameRemove = vi.spyOn(win, 'removeEventListener');
  const first = rig({ defaultOpen: true, action: 'click' }, doc.body);
  await nextTick();
  first.wrapper.unmount();
  for (const remove of [outerRemove, frameRemove]) {
    expect(remove).toHaveBeenCalledWith('mousedown', expect.any(Function), true);
  }
  expect(frameRemove).toHaveBeenCalledWith('keydown', expect.any(Function));
  const second = rig({ defaultOpen: true, action: 'click' }, doc.body);
  await nextTick();
  pressEsc(win);
  expect(second.api.open.value).toBe(false);
});

it('a refused controlled top keeps its stack position until accepted closing and withdrawal', async () => {
  const open = ref<boolean | undefined>(true);
  const change = vi.fn();
  const first = rig({ defaultOpen: true });
  const second = rig({ open, onOpenChange: change });
  await nextTick();
  pressEsc();
  pressEsc();
  expect(change.mock.calls).toEqual([[false], [false]]);
  expect(second.api.open.value).toBe(true);
  expect(first.api.open.value).toBe(true);
  expect(getGlobalEscStack().size).toBe(2);

  open.value = false;
  open.value = undefined;
  expect(second.api.rawOpen.value).toBe(false);
  expect(getGlobalEscStack().size).toBe(1);
  pressEsc();
  expect(first.api.open.value).toBe(false);
});

it('hover touch suppresses compatibility mouse events until click, then restores mouse actions', async () => {
  const change = vi.fn();
  const { api, wrapper } = rig({
    action: 'hover',
    mouseEnterDelay: 0,
    mouseLeaveDelay: 0,
    onOpenChange: change,
  });
  await wrapper.get('button').trigger('touchstart');
  await wrapper.get('button').trigger('mouseleave');
  expect(api.open.value).toBe(true);
  await wrapper.get('button').trigger('click');
  expect(api.open.value).toBe(true);
  await wrapper.get('button').trigger('mouseleave');
  expect(api.open.value).toBe(false);
  await wrapper.get('button').trigger('mouseenter');
  expect(api.open.value).toBe(true);
  expect(change.mock.calls).toEqual([[true], [false], [true]]);
});
