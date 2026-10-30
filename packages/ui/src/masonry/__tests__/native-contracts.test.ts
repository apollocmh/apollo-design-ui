import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, reactive, ref } from 'vue';
import { MockResizeObserver } from '../../../../../vitest.setup';
import { ConfigProvider } from '../../config-provider';
import type { MasonryExpose } from '../interface';
import Masonry from '../Masonry.vue';
import MasonryOnce from './fixtures/MasonryOnce.vue';

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    return new DOMRect(0, 0, 100, 20);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

async function flush(): Promise<void> {
  for (let i = 0; i < 3; i += 1) {
    await nextTick();
    await vi.advanceTimersByTimeAsync(50);
  }
  await nextTick();
}

it('emits measured layout changes without requiring a callback prop', async () => {
  const wrapper = mount(Masonry, { props: { items: [{ key: 'a', data: 20 }] } });
  await flush();
  expect(wrapper.emitted('layoutChange')).toEqual([[[{ key: 'a', data: 20, column: 0 }]]]);
  await flush();
  expect(wrapper.emitted('layoutChange')).toHaveLength(1);
  await wrapper.setProps({ items: [] });
  await flush();
  expect(wrapper.emitted('layoutChange')?.at(-1)).toEqual([[]]);
  wrapper.unmount();
});

it('supports a real template once listener while continuing to emit later changes', async () => {
  const wrapper = mount(MasonryOnce, {
    props: {
      items: [
        { key: 'a', data: 20 },
        { key: 'b', data: 40 },
      ],
    },
  });
  await flush();
  expect(wrapper.get('output').text()).toBe('1');
  expect(wrapper.getComponent({ name: 'AMasonry' }).emitted('layoutChange')).toHaveLength(1);
  await wrapper.setProps({ items: [{ key: 'a', data: 20 }] });
  await flush();
  expect(wrapper.get('output').text()).toBe('1');
  expect(wrapper.getComponent({ name: 'AMasonry' }).emitted('layoutChange')).toHaveLength(2);
  wrapper.unmount();
});

it('exposes the documented root getter through a Vue component ref and clears it on unmount', async () => {
  const instance = ref<MasonryExpose | null>(null);
  const wrapper = mount(defineComponent({ setup: () => () => h(Masonry, { ref: instance }) }));
  await flush();
  const exposed = instance.value;
  expect(exposed?.nativeElement()).toBe(wrapper.element);
  wrapper.unmount();
  expect(instance.value).toBeNull();
  expect(exposed?.nativeElement()).toBeNull();
});

it('reacts to fresh changes and releases item and root observations on unmount', async () => {
  const wrapper = mount(Masonry, {
    props: { items: [{ key: 'a', data: 20 }], fresh: false },
  });
  await flush();
  const item = wrapper.get('.apollo-masonry-item').element;
  const observed = (): boolean =>
    [...MockResizeObserver.instances].some((entry) => entry.targets.has(item));
  expect(observed()).toBe(false);
  await wrapper.setProps({ fresh: true });
  await flush();
  expect(observed()).toBe(true);
  await wrapper.setProps({ fresh: false });
  await flush();
  expect(observed()).toBe(false);
  await wrapper.setProps({ fresh: true });
  await flush();
  wrapper.unmount();
  expect([...MockResizeObserver.instances].every((entry) => entry.targets.size === 0)).toBe(true);
});

it('retains removed content and its last position until the leave transition completes', async () => {
  const wrapper = mount(Masonry<string>, {
    props: {
      columns: 1,
      items: [
        { key: 'a', data: 'Alpha' },
        { key: 'b', data: 'Beta' },
      ],
    },
    slots: { item: ({ data }) => h('span', { 'data-tile': data }, data) },
  });
  await flush();
  const leaving = wrapper.get('[data-tile="Beta"]').element.parentElement;
  expect(leaving?.style.top).toBe('20px');
  await wrapper.setProps({ items: [{ key: 'a', data: 'Alpha' }] });
  await flush();
  expect(wrapper.get('[data-tile="Beta"]').text()).toBe('Beta');
  expect(leaving?.style.top).toBe('20px');
  leaving?.dispatchEvent(new Event('transitionend', { bubbles: true }));
  await flush();
  expect(wrapper.find('[data-tile="Beta"]').exists()).toBe(false);
  wrapper.unmount();
});

it('uses same-key replacement objects in a reactive array for slots and event data', async () => {
  const items = reactive([
    { key: 'a', data: 'Alpha' },
    { key: 'b', data: 'Beta' },
  ]);
  const onLayoutChange = vi.fn();
  const wrapper = mount(Masonry<string>, {
    props: { columns: 1, items, onLayoutChange },
    slots: { item: ({ data }) => h('span', data) },
  });
  await flush();
  expect(wrapper.findAll('.apollo-masonry-item').map((item) => item.text())).toEqual([
    'Alpha',
    'Beta',
  ]);
  items[0] = { key: 'a', data: 'ALPHA!' };
  await flush();
  expect(wrapper.findAll('.apollo-masonry-item').map((item) => item.text())).toEqual([
    'ALPHA!',
    'Beta',
  ]);
  expect(onLayoutChange).toHaveBeenLastCalledWith([
    { key: 'a', data: 'ALPHA!', column: 0 },
    { key: 'b', data: 'Beta', column: 0 },
  ]);
  wrapper.unmount();
});

it('releases CSS-gutter observations and measurement nodes when switching to numbers or unmounting', async () => {
  const wrapper = mount(Masonry, {
    props: { items: [{ key: 'a', data: 20 }], gutter: '12px' },
  });
  await flush();
  const probe = wrapper.element.querySelector(':scope > [aria-hidden="true"]');
  const size = probe?.firstElementChild;
  expect(size).toBeTruthy();
  expect([...MockResizeObserver.instances].some((entry) => size && entry.targets.has(size))).toBe(
    true,
  );
  await wrapper.setProps({ gutter: 12 });
  await flush();
  expect(wrapper.element.contains(probe)).toBe(false);
  expect([...MockResizeObserver.instances].some((entry) => size && entry.targets.has(size))).toBe(
    false,
  );
  await wrapper.setProps({ gutter: '1rem' });
  await flush();
  wrapper.unmount();
  expect([...MockResizeObserver.instances].every((entry) => entry.targets.size === 0)).toBe(true);
});

it('reads current Provider prefixes, direction and semantic styles after replacement and removal', async () => {
  const phase = ref(0);
  const wrapper = mount(
    defineComponent({
      setup: () => () =>
        h(
          ConfigProvider,
          {
            prefixCls: phase.value === 0 ? 'first' : 'apollo',
            direction: phase.value === 0 ? 'rtl' : 'ltr',
            components:
              phase.value < 2
                ? {
                    masonry: {
                      className: phase.value === 0 ? 'before-provider' : 'after-provider',
                      styles: { item: { color: phase.value === 0 ? 'red' : 'green' } },
                    },
                  }
                : undefined,
          },
          { default: () => h(Masonry, { items: [{ key: 'a', data: 20 }] }) },
        ),
    }),
  );
  await flush();
  expect(wrapper.get('.first-masonry').classes()).toContain('before-provider');
  expect(wrapper.get('.first-masonry').classes()).toContain('first-masonry-rtl');
  expect(wrapper.get('.first-masonry-item').attributes('style')).toContain('color: red');
  phase.value = 1;
  await flush();
  expect(wrapper.get('.apollo-masonry').classes()).toContain('after-provider');
  expect(wrapper.get('.apollo-masonry').classes()).not.toContain('before-provider');
  expect(wrapper.get('.apollo-masonry').classes()).not.toContain('apollo-masonry-rtl');
  expect(wrapper.get('.apollo-masonry-item').attributes('style')).toContain('color: green');
  phase.value = 2;
  await flush();
  expect(wrapper.get('.apollo-masonry').classes()).not.toContain('after-provider');
  expect(wrapper.get('.apollo-masonry-item').attributes('style')).not.toContain('color: green');
  wrapper.unmount();
});
