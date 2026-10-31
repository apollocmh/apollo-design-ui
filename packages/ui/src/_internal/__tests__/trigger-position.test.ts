import { getPlacements } from '@apollo-design/position';
import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, expect, it, vi } from 'vitest';
import { h, nextTick } from 'vue';
import { Trigger } from '../trigger';

const wrappers: VueWrapper[] = [];
afterEach(() => {
  for (const wrapper of wrappers.splice(0)) wrapper.unmount();
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

const placements = getPlacements({ arrowWidth: 4, borderRadius: 6, offset: 4 });
function render(attachTo: HTMLElement, container: HTMLElement) {
  const wrapper = mount(Trigger, {
    attachTo,
    props: {
      prefixCls: 'position-trigger',
      open: true,
      builtinPlacements: placements,
      getPopupContainer: () => container,
      popup: 'Popup',
      motion: { supportMotion: false },
    },
    slots: { default: () => h('button', 'Target') },
    global: { stubs: { teleport: false } },
  });
  wrappers.push(wrapper);
  return wrapper;
}

it('binds and releases resize on the popup owner window', async () => {
  const frame = document.createElement('iframe');
  document.body.append(frame);
  const view = frame.contentWindow;
  const body = frame.contentDocument?.body;
  if (!view || !body) throw new Error('Expected a live same-origin frame');
  const add = vi.spyOn(view, 'addEventListener');
  const remove = vi.spyOn(view, 'removeEventListener');
  const wrapper = render(body, body);
  await vi.waitFor(() => expect(body.querySelector('.position-trigger')).not.toBeNull());
  await nextTick();
  const listeners = add.mock.calls.filter(([name]) => name === 'resize').map(([, fn]) => fn);
  expect(listeners.length).toBeGreaterThan(0);
  wrapper.unmount();
  wrappers.pop();
  const removed = remove.mock.calls.filter(([name]) => name === 'resize').map(([, fn]) => fn);
  for (const listener of listeners) expect(removed).toContain(listener);
});

it('observes the target scroll ancestor inside a ShadowRoot and releases it on close', async () => {
  const host = document.createElement('div');
  const scroller = document.createElement('section');
  scroller.style.overflow = 'auto';
  const attachment = document.createElement('div');
  scroller.append(attachment);
  host.attachShadow({ mode: 'open' }).append(scroller);
  document.body.append(host);
  const add = vi.spyOn(scroller, 'addEventListener');
  const remove = vi.spyOn(scroller, 'removeEventListener');
  const wrapper = render(attachment, document.body);
  await vi.waitFor(() => expect(document.querySelector('.position-trigger')).not.toBeNull());
  await nextTick();
  const listeners = add.mock.calls.filter(([name]) => name === 'scroll').map(([, fn]) => fn);
  expect(listeners.length).toBeGreaterThan(0);
  scroller.dispatchEvent(new Event('scroll', { bubbles: false, composed: false }));
  await nextTick();
  await wrapper.setProps({ open: false });
  const removed = remove.mock.calls.filter(([name]) => name === 'scroll').map(([, fn]) => fn);
  for (const listener of listeners) expect(removed).toContain(listener);
});

it('rebinds popup scroll ancestors after its container changes without replacing the popup', async () => {
  const first = document.createElement('section');
  const second = document.createElement('section');
  first.style.overflow = 'auto';
  second.style.overflow = 'auto';
  document.body.append(first, second);
  const addFirst = vi.spyOn(first, 'addEventListener');
  const removeFirst = vi.spyOn(first, 'removeEventListener');
  const addSecond = vi.spyOn(second, 'addEventListener');
  const wrapper = render(document.body, first);
  await vi.waitFor(() => expect(first.querySelector('.position-trigger')).not.toBeNull());
  await nextTick();
  const popup = first.querySelector('.position-trigger');
  const oldListeners = addFirst.mock.calls
    .filter(([name]) => name === 'scroll')
    .map(([, fn]) => fn);
  expect(oldListeners.length).toBeGreaterThan(0);
  await wrapper.setProps({ getPopupContainer: () => second });
  await vi.waitFor(() => expect(second.querySelector('.position-trigger')).toBe(popup));
  await nextTick();
  expect(addSecond.mock.calls.some(([name]) => name === 'scroll')).toBe(true);
  const removed = removeFirst.mock.calls.filter(([name]) => name === 'scroll').map(([, fn]) => fn);
  for (const listener of oldListeners) expect(removed).toContain(listener);
});

it.each<{ mode: 'visible' | 'scroll' | 'visibleFirst'; top: number }>([
  { mode: 'visible', top: 110 },
  { mode: 'scroll', top: 190 },
  { mode: 'visibleFirst', top: 110 },
])('keeps viewport shift separate from the $mode flip region', async ({ mode, top }) => {
  for (const [name, value] of [
    ['clientWidth', 400],
    ['clientHeight', 200],
    ['scrollWidth', 2000],
    ['scrollHeight', 2000],
  ] as const) {
    vi.spyOn(document.documentElement, name, 'get').mockReturnValue(value);
  }
  const wrapper = render(document.body, document.body);
  await vi.waitFor(() => expect(document.querySelector('.position-trigger')).not.toBeNull());
  await wrapper.setProps({
    placement: 'bottom',
    builtinPlacements: {
      bottom: { points: ['tl', 'bl'], overflow: { adjustY: true, shiftX: true } },
    },
    popupStyle: { width: '100px', height: '60px' },
  });
  const target = wrapper.get('button').element;
  const popup = document.querySelector<HTMLElement>('.position-trigger');
  if (!popup) throw new Error('Expected an actual popup');
  vi.spyOn(target, 'getBoundingClientRect').mockReturnValue(new DOMRect(380, 170, 10, 20));
  vi.spyOn(popup, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 100, 60));
  await wrapper.setProps({ popupAlign: { htmlRegion: mode } });
  await vi.waitFor(() => {
    expect(popup.style.left).toBe('300px');
    expect(popup.style.top).toBe(`${top}px`);
  });
});
