/** Native ancestor mutations must update autoSize without synthesizing an input event. */
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { MockMutationObserver } from '../../../../../vitest.setup';
import { TextArea } from '../index';

let sheet: HTMLStyleElement;
const cleanups: (() => void)[] = [];

beforeEach(() => {
  sheet = document.createElement('style');
  sheet.textContent = `
    .autosize-test-host textarea {font-size:14px;line-height:20px;padding:4px;border:1px solid;box-sizing:border-box;width:200px;}
    .autosize-test-host.large textarea {font-size:24px;line-height:30px;padding:12px;}
  `;
  document.head.append(sheet);
  // JSDOM has no layout; emulate the shadow textarea's scroll measurement only.
  vi.spyOn(Element.prototype, 'scrollHeight', 'get').mockImplementation(function (this: Element) {
    if (!(this instanceof HTMLTextAreaElement)) return 0;
    const style = window.getComputedStyle(this);
    const line = Number.parseFloat(style.lineHeight) || 20;
    return Math.ceil(
      line * this.value.split('\n').length +
        (Number.parseFloat(style.paddingTop) || 0) +
        (Number.parseFloat(style.paddingBottom) || 0),
    );
  });
});

afterEach(() => {
  for (const cleanup of cleanups.splice(0)) cleanup();
  sheet.remove();
  vi.restoreAllMocks();
});

function field(autoSize: () => boolean = () => true) {
  const onResize = vi.fn();
  const wrapper = mount(
    defineComponent({
      setup: () => () =>
        h('div', { class: 'autosize-test-host' }, [
          h(TextArea, { autoSize: autoSize(), defaultValue: 'First\nSecond', onResize }),
        ]),
    }),
    { attachTo: document.body },
  );
  cleanups.push(() => {
    if (wrapper.exists()) wrapper.unmount();
  });
  const input = wrapper.get('textarea').element;
  if (!(input instanceof HTMLTextAreaElement)) throw new Error('Expected native TextArea');
  return { wrapper, input, onResize };
}

// The repository deliberately replaces JSDOM's native observer with a manual stub.
// Real automatic delivery is covered by the companion browser contract.
function deliverMutation(target: Element): void {
  for (const observer of [...MockMutationObserver.instances]) {
    if (observer.targets.has(target)) observer.trigger();
  }
}

describe('TextArea autoSize · native style changes', () => {
  it.each(['control', 'ancestor'])(
    'remeasures final styling when a %s transition settles',
    async (target) => {
      const { wrapper, input } = field();
      await vi.waitFor(() => expect(input.style.height).toBe('50px'));
      wrapper.element.classList.add('large');
      (target === 'control' ? input : wrapper.element).dispatchEvent(
        new Event('transitionend', { bubbles: true }),
      );
      await vi.waitFor(() => expect(input.style.height).toBe('86px'));
    },
  );
  it('remeasures ancestor class changes at the same width and preserves the native draft', async () => {
    const { wrapper, input } = field();
    await vi.waitFor(() => expect(input.style.height).toBe('50px'));
    input.focus();
    input.setSelectionRange(2, 7);
    wrapper.element.classList.add('large');
    deliverMutation(wrapper.element);
    await vi.waitFor(() => expect(input.style.height).toBe('86px'));
    expect(wrapper.get('textarea').element).toBe(input);
    expect([
      input.value,
      document.activeElement === input,
      input.selectionStart,
      input.selectionEnd,
    ]).toEqual(['First\nSecond', true, 2, 7]);
  });

  it('does not measure or emit resize again for unrelated ancestor mutations', async () => {
    const { wrapper, input, onResize } = field();
    await vi.waitFor(() => expect(input.style.height).toBe('50px'));
    const getter = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollHeight')?.get;
    if (!getter) throw new Error('Expected the shadow measurement getter');
    const measurements = vi.mocked(getter);
    const measured = measurements.mock.calls.length;
    const emitted = onResize.mock.calls.length;
    wrapper.element.classList.add('unrelated');
    wrapper.element.setAttribute('data-selection', 'first');
    wrapper.element.style.color = 'rgb(120, 80, 40)';
    deliverMutation(wrapper.element);
    await new Promise((resolve) => setTimeout(resolve, 0));
    await nextTick();
    expect(input.style.height).toBe('50px');
    expect(measurements.mock.calls.length).toBe(measured);
    expect(onResize).toHaveBeenCalledTimes(emitted);
  });

  it('disconnects native observation when disabled and observes again when re-enabled', async () => {
    const enabled = ref(true);
    const disconnect = vi.spyOn(MutationObserver.prototype, 'disconnect');
    const removeEvent = vi.spyOn(document, 'removeEventListener');
    const { wrapper, input } = field(() => enabled.value);
    await vi.waitFor(() => expect(input.style.height).toBe('50px'));
    enabled.value = false;
    await nextTick();
    await nextTick();
    expect(disconnect).toHaveBeenCalled();
    expect(
      removeEvent.mock.calls.some(
        ([name, , capture]) => name === 'transitionend' && capture === true,
      ),
    ).toBe(true);
    await vi.waitFor(() => expect(input.style.height).toBe(''));
    enabled.value = true;
    await vi.waitFor(() => expect(input.style.height).toBe('50px'));
    wrapper.element.classList.add('large');
    deliverMutation(wrapper.element);
    await vi.waitFor(() => expect(input.style.height).toBe('86px'));
  });

  it('keeps instances independent and disconnects on unmount', async () => {
    const first = field();
    const second = field();
    const disconnect = vi.spyOn(MutationObserver.prototype, 'disconnect');
    await vi.waitFor(() => expect(first.input.style.height).toBe('50px'));
    await vi.waitFor(() => expect(second.input.style.height).toBe('50px'));
    const secondEvents = second.onResize.mock.calls.length;
    first.wrapper.element.classList.add('large');
    deliverMutation(first.wrapper.element);
    await vi.waitFor(() => expect(first.input.style.height).toBe('86px'));
    expect(second.input.style.height).toBe('50px');
    expect(second.onResize).toHaveBeenCalledTimes(secondEvents);
    first.wrapper.unmount();
    expect(disconnect).toHaveBeenCalled();
    second.wrapper.element.classList.add('large');
    deliverMutation(second.wrapper.element);
    await vi.waitFor(() => expect(second.input.style.height).toBe('86px'));
  });
});
