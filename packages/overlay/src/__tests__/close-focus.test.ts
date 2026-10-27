import { mount } from '@vue/test-utils';
import { afterEach, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref, Teleport } from 'vue';
import { createEscStack } from '../esc-stack';
import { type UseOverlayOptions, type UseOverlayReturn, useOverlay } from '../use-overlay';

const wrappers: { unmount(): void }[] = [];
afterEach(() => {
  for (const w of wrappers.splice(0)) w.unmount();
  document.body.innerHTML = '';
});
function rig(
  options: UseOverlayOptions = {},
  host: HTMLElement = document.body,
  popupTarget?: Element,
) {
  let api: UseOverlayReturn | undefined;
  const App = defineComponent({
    setup() {
      const state = useOverlay({ ...options, escStack: createEscStack() });
      api = state;
      return () =>
        h('section', [
          h('button', { type: 'button', ref: state.targetRef, ...state.targetProps.value }, 'Open'),
          state.open.value
            ? popupTarget
              ? h(Teleport, { to: popupTarget }, [
                  h('div', { ref: state.popupRef }, [h('input', { 'aria-label': 'Popup editor' })]),
                ])
              : h('div', { ref: state.popupRef }, [h('input', { 'aria-label': 'Popup editor' })])
            : null,
        ]);
    },
  });
  const w = mount(App, { attachTo: host, global: { stubs: { teleport: false } } });
  wrappers.push(w);
  if (!api) throw Error('Missing overlay setup');
  return { w, api };
}
it('actual uncontrolled closing returns owned editor focus to its trigger', async () => {
  const { api, w } = rig({ defaultOpen: true });
  const input = w.get<HTMLInputElement>('input').element;
  input.focus();
  api.setOpen(false);
  await nextTick();
  expect(document.activeElement).toBe(w.get('button').element);
});
it('refused controlled close leaves focus inside; accepted close restores it once', async () => {
  const open = ref(true),
    change = vi.fn();
  const { api, w } = rig({ open: () => open.value, onOpenChange: change });
  const input = w.get<HTMLInputElement>('input').element;
  input.focus();
  api.setOpen(false);
  await nextTick();
  expect(document.activeElement).toBe(input);
  expect(change).toHaveBeenCalledExactlyOnceWith(false);
  open.value = false;
  await nextTick();
  expect(document.activeElement).toBe(w.get('button').element);
});
it('closing does not take focus from another control', async () => {
  const { api } = rig({ defaultOpen: true });
  const outside = document.createElement('input');
  document.body.append(outside);
  outside.focus();
  api.setOpen(false);
  await nextTick();
  expect(document.activeElement).toBe(outside);
});
it('owned focus is resolved in the actual ShadowRoot', async () => {
  const owner = document.createElement('div');
  document.body.append(owner);
  const shadow = owner.attachShadow({ mode: 'open' }),
    host = document.createElement('div');
  shadow.append(host);
  const { api, w } = rig({ defaultOpen: true }, host);
  const input = w.get<HTMLInputElement>('input').element;
  input.focus();
  api.setOpen(false);
  await nextTick();
  expect(shadow.activeElement).toBe(w.get('button').element);
});
it('owned focus follows a popup in another same-origin document', async () => {
  const frame = document.createElement('iframe');
  document.body.append(frame);
  const doc = frame.contentDocument;
  if (!doc) throw Error('Missing frame document');
  const { api, w } = rig({ defaultOpen: true }, document.body, doc.body);
  await nextTick();
  const input = doc.querySelector('input');
  if (!input) throw Error('Missing popup editor');
  input.focus();
  api.setOpen(false);
  await nextTick();
  expect(document.activeElement).toBe(w.get('button').element);
});
it.each([false, true])(
  'returning focus does not reopen a focus-trigger overlay (controlled=%s)',
  async (controlled) => {
    const open = ref<boolean | undefined>(controlled ? true : undefined),
      change = vi.fn((next: boolean) => {
        if (controlled) open.value = next;
      });
    const { api, w } = rig({
      action: 'focus',
      focusDelay: 0,
      defaultOpen: true,
      open: () => open.value,
      onOpenChange: change,
    });
    w.get<HTMLInputElement>('input').element.focus();
    api.setOpen(false);
    await nextTick();
    expect(api.open.value).toBe(false);
    expect(document.activeElement).toBe(w.get('button').element);
    expect(change.mock.calls.map((args) => args[0])).toEqual([false]);
  },
);
it('closing a cross-document popup does not steal focus from its parent document', async () => {
  const frame = document.createElement('iframe');
  document.body.append(frame);
  const doc = frame.contentDocument;
  if (!doc) throw Error('Missing frame document');
  const { api } = rig({ defaultOpen: true }, document.body, doc.body);
  await nextTick();
  const input = doc.querySelector('input');
  if (!input) throw Error('Missing popup editor');
  input.focus();
  const outside = document.createElement('input');
  document.body.append(outside);
  outside.focus();
  api.setOpen(false);
  await nextTick();
  expect(document.activeElement).toBe(outside);
});
