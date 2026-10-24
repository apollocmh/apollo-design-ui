import { afterEach, expect, it, vi } from 'vitest';
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue';
import { renderToString } from 'vue/server-renderer';
import Masonry from '../Masonry.vue';

afterEach(() => vi.restoreAllMocks());

it('SSR renders native item slots and fallback content in a measurable grid', async () => {
  const html = await renderToString(
    createSSRApp({
      render: () =>
        h(
          Masonry,
          { columns: 2, gutter: [12, 16], items: [{ key: 'a', data: 'Alpha' }] },
          {
            item: ({ data }: { data: unknown }) => h('article', String(data)),
          },
        ),
    }),
  );
  const container = document.createElement('div');
  container.innerHTML = html;
  expect(container.querySelector('article')?.textContent).toBe('Alpha');
  const root = container.firstElementChild;
  expect(root?.getAttribute('style')).toContain('display:grid');
  expect(root?.getAttribute('style')).toContain('align-items:start');
  expect(root?.getAttribute('style')).toContain('column-gap:12px');
  expect(root?.getAttribute('style')).toContain('row-gap:16px');
  expect(root?.getAttribute('style')).not.toContain('height:0');
  expect(container.querySelector('.apollo-masonry-item')?.getAttribute('style')).toContain(
    'position:relative',
  );
  const fallback = await renderToString(
    createSSRApp({
      render: () => h(Masonry, { items: [{ key: 'a', data: 1, children: h('b', 'Fallback') }] }),
    }),
  );
  expect(fallback).toContain('<b>Fallback</b>');
});

it('SSR empty item slot overrides fallback and keeps the item wrapper', async () => {
  const html = await renderToString(
    createSSRApp({
      render: () =>
        h(Masonry, { items: [{ key: 'a', data: 1, children: 'Fallback' }] }, { item: () => [] }),
    }),
  );
  expect(html).toContain('apollo-masonry-item');
  expect(html).not.toContain('Fallback');
});

it('hydrates server item/input identity and value, measures once, then updates current data', async () => {
  const data = ref('Alpha');
  const layout = vi.fn();
  const App = defineComponent({
    setup: () => () =>
      h(
        Masonry,
        { columns: 2, items: [{ key: 'a', data: data.value }], onLayoutChange: layout },
        {
          item: ({ data }: { data: unknown }) =>
            h('article', [h('b', String(data)), h('input', { 'data-hydrated-input': '' })]),
        },
      ),
  });
  const container = document.createElement('div');
  container.innerHTML = await renderToString(createSSRApp(App));
  document.body.appendChild(container);
  const input = container.querySelector('input');
  expect(input).not.toBeNull();
  if (!input) throw new Error('SSR must render the input');
  const item = container.querySelector('.apollo-masonry-item');
  input.value = 'before hydration';
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
    () => new DOMRect(0, 0, 160, 40),
  );
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  const app = createSSRApp(App);
  try {
    app.mount(container);
    await vi.waitFor(() => expect(layout).toHaveBeenCalledTimes(1));
    expect(container.querySelector('input')).toBe(input);
    expect(container.querySelector('.apollo-masonry-item')).toBe(item);
    expect(input.value).toBe('before hydration');
    expect(container.firstElementChild?.getAttribute('style')).toContain('height: 40px');
    data.value = 'Beta';
    await nextTick();
    await vi.waitFor(() => expect(container.querySelector('b')?.textContent).toBe('Beta'));
    expect(container.querySelector('input')).toBe(input);
    expect(input.value).toBe('before hydration');
    expect(warn).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  } finally {
    app.unmount();
    container.remove();
  }
});
