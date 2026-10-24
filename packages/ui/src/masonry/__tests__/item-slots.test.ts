import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref, shallowRef } from 'vue';
import type { MasonryKey, MasonryProps } from '../interface';
import Masonry from '../Masonry.vue';

interface ItemScope {
  key: MasonryKey;
  data: unknown;
  index: number;
  column: number;
}

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

async function flush() {
  for (let i = 0; i < 3; i++) {
    await nextTick();
    await vi.advanceTimersByTimeAsync(50);
  }
  await nextTick();
}

it('F11: item slots receive current data/key/index/column and override item children', async () => {
  const w = mount(Masonry, {
    props: { items: [{ key: 'a', data: 'Alpha', children: h('i', 'fallback') }] },
    slots: {
      item: ({ key, data, index, column }: ItemScope) =>
        h('b', { 'data-key': key }, `${String(data)}:${index}:${column}`),
    },
  });
  await flush();
  expect(w.get('b').text()).toBe('Alpha:0:0');
  expect(w.get('b').attributes('data-key')).toBe('a');
  expect(w.find('i').exists()).toBe(false);
});

it('F11: conditional, current and empty slots suppress fallback; removal restores it', async () => {
  const show = ref(false);
  const empty = ref(false);
  const label = ref('first');
  const items = [{ key: 'a', data: 1, children: h('i', 'fallback') }];
  const w = mount(
    defineComponent({
      setup: () => () =>
        h(
          Masonry,
          { items },
          show.value
            ? {
                item: () => (empty.value ? [] : h('b', label.value)),
              }
            : {},
        ),
    }),
  );
  await flush();
  expect(w.get('i').text()).toBe('fallback');
  show.value = true;
  await flush();
  expect(w.get('b').text()).toBe('first');
  label.value = 'second';
  await flush();
  expect(w.get('b').text()).toBe('second');
  empty.value = true;
  await flush();
  expect(w.find('b').exists()).toBe(false);
  expect(w.find('i').exists()).toBe(false);
  show.value = false;
  await flush();
  expect(w.get('i').text()).toBe('fallback');
});

it('F11: replacing items with the same key updates fallback children', async () => {
  const items = shallowRef([{ key: 'a', data: 1, children: h('b', 'first') }]);
  const w = mount(defineComponent({ setup: () => () => h(Masonry, { items: items.value }) }));
  await flush();
  const tile = w.get('.apollo-masonry-item').element;
  items.value = [{ key: 'a', data: 2, children: h('b', 'second') }];
  await flush();
  expect(w.get('b').text()).toBe('second');
  expect(w.get('.apollo-masonry-item').element).toBe(tile);
});

it('F11: semantic functions receive current data and fresh state', async () => {
  const items = ref([{ key: 'a', data: 1, children: 'Tile' }]);
  const fresh = ref(false);
  const classNames: MasonryProps['classNames'] = ({ props }) => ({
    root: `data-${String(props.items?.[0]?.data)}`,
  });
  const styles: MasonryProps['styles'] = ({ props }) => ({
    root: { opacity: props.fresh ? 0.5 : 1 },
  });
  const w = mount(
    defineComponent({
      setup: () => () => h(Masonry, { items: items.value, fresh: fresh.value, classNames, styles }),
    }),
  );
  await flush();
  expect(w.classes()).toContain('data-1');
  fresh.value = true;
  items.value = [{ key: 'a', data: 2, children: 'Tile' }];
  await flush();
  expect(w.classes()).toContain('data-2');
  expect(w.attributes('style')).toContain('opacity: 0.5');
});

it('F11: keyed slot input state follows its item when reordered', async () => {
  const items = ref([
    { key: 'a', data: 'Alpha' },
    { key: 'b', data: 'Beta' },
  ]);
  const w = mount(
    defineComponent({
      setup: () => () =>
        h(
          Masonry,
          { items: items.value },
          {
            item: ({ key, data, index }: ItemScope) =>
              h('div', [
                h('b', `${String(data)}:${index}`),
                h('input', { 'data-item-input': key }),
              ]),
          },
        ),
    }),
  );
  await flush();
  const input = w.get('input[data-item-input="a"]');
  await input.setValue('kept');
  const node = input.element;
  items.value = [...items.value].reverse();
  await flush();
  expect(w.findAll('b').map((node) => node.text())).toEqual(['Beta:0', 'Alpha:1']);
  expect(w.get('input[data-item-input="a"]').element).toBe(node);
  expect(w.get<HTMLInputElement>('input[data-item-input="a"]').element.value).toBe('kept');
});

it('F11: changing the item slot schedules a measured layout pass without fresh', async () => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    return new DOMRect(
      0,
      0,
      300,
      Number(this.querySelector('[data-height]')?.getAttribute('data-height') ?? 0),
    );
  });
  const show = ref(false);
  const items = [20, 60, 20].map((height, index) => ({
    key: String(index),
    data: height,
    children: h('div', { 'data-height': height }, 'fallback'),
  }));
  const w = mount(
    defineComponent({
      setup: () => () =>
        h(
          Masonry,
          { items, columns: 2, fresh: false },
          show.value
            ? {
                item: ({ index, data }: ItemScope) =>
                  h('div', { 'data-height': index === 0 ? 100 : Number(data) }, 'slot'),
              }
            : {},
        ),
    }),
  );
  await flush();
  expect(w.findAll('.apollo-masonry-item')[2]?.attributes('style')).toContain('top: 20px');
  show.value = true;
  await flush();
  expect(w.findAll('.apollo-masonry-item')[2]?.text()).toBe('slot');
  expect(w.findAll('.apollo-masonry-item')[2]?.attributes('style')).toContain('top: 60px');
});
