import { mount } from '@vue/test-utils';
import { afterEach, expect, it, vi } from 'vitest';
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue';
import { renderToString } from 'vue/server-renderer';
import Masonry from '../Masonry.vue';

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

it('F10: native root id/title and string styles survive SSR', async () => {
  const html = await renderToString(
    createSSRApp({
      render: () => h(Masonry, { id: 'native-masonry', title: 'Tiles', style: 'color:red' }),
    }),
  );
  expect(html).toContain('id="native-masonry"');
  expect(html).toContain('title="Tiles"');
  expect(html).toContain('color:red');
});

it('F10: attrs-only class/style/event updates use the current render and preserve the root', async () => {
  const changed = ref(false);
  const first = vi.fn();
  const second = vi.fn();
  const w = mount(
    defineComponent({
      setup: () => () =>
        h(Masonry, {
          id: changed.value ? 'second-root' : 'first-root',
          class: changed.value ? ['second', { active: true }] : 'first',
          style: changed.value ? ['color:blue', { marginTop: '3px' }] : 'color:red',
          onClick: changed.value ? second : first,
        }),
    }),
  );
  const root = w.element;
  expect(w.attributes('id')).toBe('first-root');
  await w.trigger('click');
  expect(first).toHaveBeenCalledTimes(1);
  changed.value = true;
  await nextTick();
  expect(w.element).toBe(root);
  expect(w.attributes('id')).toBe('second-root');
  expect(w.classes()).toContain('second');
  expect(w.classes()).toContain('active');
  expect(w.classes()).not.toContain('first');
  expect(w.attributes('style')).toContain('color: blue');
  expect(w.attributes('style')).toContain('margin-top: 3px');
  await w.trigger('click');
  expect(first).toHaveBeenCalledTimes(1);
  expect(second).toHaveBeenCalledTimes(1);
});

it('F10: non-bubbling image load/error remeasure without fresh and notify each layout once', async () => {
  vi.useFakeTimers();
  const heights = [20, 60, 20];
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    const row = this.querySelector('img')?.getAttribute('data-row');
    return new DOMRect(
      0,
      0,
      300,
      row === null || row === undefined ? 0 : (heights[Number(row)] ?? 0),
    );
  });
  const loadCapture = vi.fn();
  const loadBubble = vi.fn();
  const errorCapture = vi.fn();
  const layout = vi.fn();
  const w = mount(Masonry, {
    props: {
      columns: 2,
      fresh: false,
      items: [0, 1, 2].map((index) => ({ key: String(index), data: index })),
      itemRender: ({ index }) => h('img', { 'data-row': index, alt: `Tile ${index}` }),
      onLayoutChange: layout,
    },
    attrs: { onLoadCapture: loadCapture, onLoad: loadBubble, onErrorCapture: errorCapture },
  });
  await flush();
  const third = w.findAll('.apollo-masonry-item')[2];
  expect(third?.attributes('style')).toContain('top: 20px');
  layout.mockClear();
  heights[0] = 100;
  const load = new Event('load', { bubbles: false });
  w.get('img[data-row="0"]').element.dispatchEvent(load);
  await flush();
  expect(third?.attributes('style')).toContain('top: 60px');
  expect(third?.attributes('style')).toContain('* 1)');
  expect(loadCapture).toHaveBeenCalledExactlyOnceWith(load);
  expect(loadBubble).not.toHaveBeenCalled();
  expect(layout).toHaveBeenCalledTimes(1);
  heights[0] = 10;
  const error = new Event('error', { bubbles: false });
  w.get('img[data-row="0"]').element.dispatchEvent(error);
  await flush();
  expect(third?.attributes('style')).toContain('top: 10px');
  expect(third?.attributes('style')).toContain('* 0)');
  expect(errorCapture).toHaveBeenCalledExactlyOnceWith(error);
  expect(layout).toHaveBeenCalledTimes(2);
});
