import { mount } from '@vue/test-utils';
import { afterEach, expect, it, vi } from 'vitest';
import { type Component, defineComponent, h, nextTick, shallowRef } from 'vue';
import Affix from '../../affix/Affix.vue';
import Anchor from '../../anchor';
import { ConfigProvider } from '../ConfigProvider';

const wrappers: Array<{ unmount(): void }> = [];
afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => {
    wrapper.unmount();
  });
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

it.each<{ name: string; component: Component; props: Record<string, unknown> }>([
  { name: 'Affix', component: Affix, props: { offsetTop: 0 } },
  {
    name: 'Anchor',
    component: Anchor,
    props: { affix: false, items: [{ key: 'a', href: '#scroll-target', title: 'Target' }] },
  },
])(
  '$name rebinds the actual current ConfigProvider scroll target and cleans up',
  async ({ component, props }) => {
    const first = document.createElement('section');
    const second = document.createElement('section');
    const target = document.createElement('article');
    target.id = 'scroll-target';
    const host = document.createElement('div');
    document.body.append(host, target);
    // Shadow DOM callers supply the actual scroll element, which has layout and offsets.
    host.attachShadow({ mode: 'open' }).append(first, second);
    target.getClientRects = () => DOMRectListFrom(new DOMRect(0, 0, 100, 20));
    target.getBoundingClientRect = () => new DOMRect(0, 0, 100, 20);
    const addFirst = vi.spyOn(first, 'addEventListener');
    const removeFirst = vi.spyOn(first, 'removeEventListener');
    const addSecond = vi.spyOn(second, 'addEventListener');
    const removeSecond = vi.spyOn(second, 'removeEventListener');
    const resolve = shallowRef(() => first);
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(ConfigProvider, { getTargetContainer: resolve.value }, () =>
            h(component, props, () => h('button', 'Content')),
          ),
      }),
      {
        attachTo: document.body,
        global: { stubs: { teleport: false } },
      },
    );
    wrappers.push(wrapper);
    await vi.waitFor(() =>
      expect(addFirst.mock.calls.some(([type]) => type === 'scroll')).toBe(true),
    );
    resolve.value = () => second;
    await nextTick();
    await nextTick();
    await vi.waitFor(() =>
      expect(addSecond.mock.calls.some(([type]) => type === 'scroll')).toBe(true),
    );
    expect(removeFirst.mock.calls.some(([type]) => type === 'scroll')).toBe(true);
    wrapper.unmount();
    wrappers.pop();
    expect(removeSecond.mock.calls.some(([type]) => type === 'scroll')).toBe(true);
  },
);

function DOMRectListFrom(rect: DOMRect): DOMRectList {
  return {
    0: rect,
    length: 1,
    item: (index) => (index === 0 ? rect : null),
    [Symbol.iterator]: () => [rect][Symbol.iterator](),
  };
}
