import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { h, nextTick, shallowRef } from 'vue';
import Affix from '../Affix.vue';

const wrappers: VueWrapper[] = [];
const cases: { edge: 'top' | 'bottom'; source: 'window' | 'ancestor' }[] = [
  { edge: 'top', source: 'window' },
  { edge: 'top', source: 'ancestor' },
  { edge: 'bottom', source: 'window' },
  { edge: 'bottom', source: 'ancestor' },
];
const settle = async () => {
  await nextTick();
  await vi.advanceTimersByTimeAsync(50);
  await nextTick();
};
const scroller = () => {
  const element = document.createElement('div');
  element.style.overflow = 'auto';
  document.body.append(element);
  return element;
};
const trackScroll = (target: EventTarget) => {
  const add = vi.spyOn(target, 'addEventListener');
  const remove = vi.spyOn(target, 'removeEventListener');
  return {
    adds: () => add.mock.calls.filter(([type]) => type === 'scroll').length,
    net: () =>
      add.mock.calls.filter(([type]) => type === 'scroll').length -
      remove.mock.calls.filter(([type]) => type === 'scroll').length,
  };
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('innerHeight', 800);
});
afterEach(() => {
  for (const wrapper of wrappers.splice(0)) wrapper.unmount();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.clearAllTimers();
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('Affix issue #72 outer scroll signals', () => {
  it.each(cases)('$edge follows a target moved by $source scrolling', async ({ edge, source }) => {
    const ancestor = scroller();
    const target = document.createElement('div');
    target.style.overflow = 'auto';
    ancestor.append(target);
    let top = 300;
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      return this === target
        ? new DOMRect(0, top, 480, 260)
        : new DOMRect(0, top + (edge === 'bottom' ? 280 : 0), 480, 44);
    });
    const wrapper = mount(Affix, {
      props: {
        target: () => target,
        ...(edge === 'top' ? { offsetTop: 10 } : { offsetBottom: 10 }),
      },
      slots: { default: () => h('input', { value: 'retained draft' }) },
      attachTo: target,
    });
    wrappers.push(wrapper);
    await settle();
    const fixed = wrapper.get<HTMLElement>('.apollo-affix');
    const input = wrapper.get('input').element;
    expect(fixed.element.style[edge]).toBe(edge === 'top' ? '310px' : '250px');

    // Only the outer source emits. Native element scroll events do not bubble
    // down into the custom target, and a translation does not resize its box.
    top = 180;
    (source === 'window' ? window : ancestor).dispatchEvent(new Event('scroll'));
    await settle();
    expect(fixed.element.style[edge]).toBe(edge === 'top' ? '190px' : '370px');
    expect(wrapper.get('input').element).toBe(input);
    expect(input.value).toBe('retained draft');
    expect(wrapper.emitted('change')).toEqual([[true]]);
  });

  it('keeps one binding per source and releases old ancestors, pending targets and queued frames', async () => {
    const ancestorA = scroller();
    const ancestorB = scroller();
    const elementA = document.createElement('div');
    const elementB = document.createElement('div');
    ancestorA.append(elementA);
    ancestorB.append(elementB);
    const target = shallowRef<HTMLElement | null>(elementA);
    const a = trackScroll(ancestorA);
    const b = trackScroll(ancestorB);
    const view = trackScroll(window);
    const rect = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockReturnValue(new DOMRect(0, 300, 480, 44));
    // The placeholder is outside both target ancestors, as in Anchor's layout.
    const wrapper = mount(Affix, {
      props: { target: () => target.value, offsetTop: 10 },
      attachTo: document.body,
    });
    wrappers.push(wrapper);
    await settle();
    expect(a.net()).toBe(1);
    expect(b.net()).toBe(0);
    expect(view.net()).toBe(1);

    wrapper.vm.updatePosition();
    await wrapper.setProps({ offsetTop: 20 });
    window.dispatchEvent(new Event('scroll'));
    await settle();
    expect(a.adds()).toBe(1);
    expect(view.adds()).toBe(1);

    target.value = elementB;
    await settle();
    expect(a.net()).toBe(0);
    expect(b.net()).toBe(1);
    expect(view.net()).toBe(1);
    rect.mockClear();
    ancestorA.dispatchEvent(new Event('scroll'));
    await settle();
    expect(rect).not.toHaveBeenCalled();

    target.value = null;
    await settle();
    expect(b.net()).toBe(0);
    expect(view.net()).toBe(0);
    expect(wrapper.find('.apollo-affix').exists()).toBe(false);

    target.value = elementB;
    await settle();
    ancestorB.dispatchEvent(new Event('scroll'));
    wrapper.vm.updatePosition();
    wrapper.unmount();
    wrappers.splice(wrappers.indexOf(wrapper), 1);
    rect.mockClear();
    await settle();
    expect(a.net()).toBe(0);
    expect(b.net()).toBe(0);
    expect(view.net()).toBe(0);
    expect(rect).not.toHaveBeenCalled();
  });
});
