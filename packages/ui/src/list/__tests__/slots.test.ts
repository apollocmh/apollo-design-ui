import { mount } from '@vue/test-utils';
import { expect, it, vi } from 'vitest';
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { List, ListItem } from '../index';
import type { ListRef } from '../interface';

it('F11: item receives the current page item/index; changing pages preserves the list root', async () => {
  const item = vi.fn(({ item, index }: { item: unknown; index: number }) =>
    h(ListItem, null, () => `${index}:${String(item)}`),
  );
  const w = mount(List, {
    props: { dataSource: ['Alpha', 'Beta', 'Gamma'], pagination: { pageSize: 2 } },
    slots: { item },
  });
  const root = w.element;
  expect(w.findAll('.apollo-list-items > li').map((n) => n.text())).toEqual(['0:Alpha', '1:Beta']);
  expect(item).toHaveBeenNthCalledWith(1, { item: 'Alpha', index: 0 });
  await w.get('.apollo-pagination-item-2').trigger('click');
  expect(w.findAll('.apollo-list-items > li').map((n) => n.text())).toEqual(['0:Gamma']);
  expect(w.element).toBe(root);
  w.unmount();
});

it('F11: conditional header/footer/loadMore slots update and take precedence over content props', async () => {
  const show = ref(false);
  const text = ref('first');
  const w = mount(
    defineComponent({
      setup: () => () =>
        h(
          List,
          {
            header: 'prop header',
            footer: 'prop footer',
            loadMore: 'prop more',
          },
          show.value
            ? {
                header: () => h('b', text.value),
                footer: () => h('small', text.value),
                loadMore: () => h('button', text.value),
              }
            : {},
        ),
    }),
  );
  const root = w.element;
  expect(w.get('.apollo-list-header').text()).toBe('prop header');
  show.value = true;
  await nextTick();
  expect(w.get('.apollo-list-header b').text()).toBe('first');
  expect(w.get('.apollo-list-footer small').text()).toBe('first');
  expect(w.get('button').text()).toBe('first');
  expect(w.text()).not.toContain('prop');
  text.value = 'second';
  await nextTick();
  expect(w.get('b').text()).toBe('second');
  expect(w.get('small').text()).toBe('second');
  show.value = false;
  await nextTick();
  expect(w.get('.apollo-list-footer').text()).toBe('prop footer');
  expect(w.element).toBe(root);
  w.unmount();
});

it('F11: empty content slots suppress fallback props and wrappers; loadMore presence replaces bottom pagination', () => {
  const w = mount(List, {
    props: { header: 'H', footer: 'F', loadMore: 'M' },
    slots: { header: () => [], footer: () => [], loadMore: () => [] },
  });
  expect(w.find('.apollo-list-header').exists()).toBe(false);
  expect(w.find('.apollo-list-footer').exists()).toBe(false);
  expect(w.classes()).not.toContain('apollo-list-something-after-last-item');
  expect(w.text()).not.toMatch(/[HFM]/);
  w.unmount();
  const paginated = mount(List, {
    props: { dataSource: ['A', 'B'], pagination: { pageSize: 1, position: 'both' } },
    slots: {
      loadMore: () => [],
      item: ({ item }: { item: unknown }) => h(ListItem, null, () => String(item)),
    },
  });
  expect(paginated.findAll('.apollo-list-pagination')).toHaveLength(1);
  paginated.unmount();
});

it('F11: rowKey preserves native item DOM on reorder, including zero and empty string keys', async () => {
  const dataSource = [
    { id: 0, label: 'zero' },
    { id: '', label: 'empty' },
  ];
  const w = mount(List<(typeof dataSource)[number]>, {
    props: { dataSource, rowKey: 'id' },
    slots: {
      item: ({ item }: { item: { label: string } }) =>
        h(ListItem, null, () => h('input', { value: item.label })),
    },
  });
  const before = w.findAll('input').map((n) => n.element);
  expect(before).toHaveLength(2);
  await w.setProps({ dataSource: [...dataSource].reverse() });
  expect(w.findAll('input').map((n) => n.element)).toEqual([...before].reverse());
  w.unmount();
});

it('F11: SSR renders item/header/footer/loadMore slots with grid layout', async () => {
  const html = await renderToString(
    h(
      List,
      { dataSource: ['Alpha'], grid: { column: 2 } },
      {
        item: ({ item }: { item: unknown }) => h(ListItem, null, () => String(item)),
        header: () => h('b', 'Header'),
        footer: () => h('small', 'Footer'),
        loadMore: () => h('button', 'More'),
      },
    ),
  );
  expect(html).toContain('width:50%');
  expect(html).toContain('Alpha');
  expect(html).toContain('<b>Header</b>');
  expect(html).toContain('<small>Footer</small>');
  expect(html).toContain('<button>More</button>');
});

it('List follows Apollo lifecycle decisions without an inherited upstream deprecation warning', () => {
  const warning = vi.spyOn(console, 'error').mockImplementation(() => {});
  const w = mount(List);
  expect(warning).not.toHaveBeenCalled();
  w.unmount();
  warning.mockRestore();
});

it('F11: hydration preserves the root and keyed item while slot content updates', async () => {
  const label = ref('first');
  const list = ref<ListRef>();
  const header = vi.fn(() => h('b', label.value));
  const App = defineComponent({
    setup: () => () =>
      h(
        List,
        { ref: list, dataSource: [{ key: 0, title: 'Alpha' }] },
        {
          header,
          item: ({ item }: { item: { title: string } }) =>
            h(ListItem, null, () => h('input', { value: `${item.title}:${label.value}` })),
        },
      ),
  });
  const container = document.createElement('div');
  container.innerHTML = await renderToString(createSSRApp(App));
  document.body.appendChild(container);
  const root = container.firstElementChild;
  const input = container.querySelector('input');
  header.mockClear();
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  const app = createSSRApp(App);
  try {
    app.mount(container);
    await nextTick();
    expect(header).toHaveBeenCalledTimes(1);
    expect(list.value?.nativeElement).toBe(root);
    label.value = 'second';
    await nextTick();
    expect(header).toHaveBeenCalledTimes(2);
    expect(container.firstElementChild).toBe(root);
    expect(container.querySelector('input')).toBe(input);
    expect(input?.value).toBe('Alpha:second');
    expect(container.querySelector('b')?.textContent).toBe('second');
    expect(warn).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  } finally {
    app.unmount();
    container.remove();
    warn.mockRestore();
    error.mockRestore();
  }
});

it('F11: declared id and native attrs update on the same root, including string styles in SSR', async () => {
  const w = mount(List, { props: { id: 'first', style: 'color:red', 'aria-label': 'first' } });
  const root = w.element;
  expect(w.attributes('id')).toBe('first');
  expect(w.attributes('aria-label')).toBe('first');
  expect(w.attributes('style')).toContain('color: red');
  await w.setProps({ id: 'second', style: 'color:blue', 'aria-label': 'second' });
  expect(w.element).toBe(root);
  expect(w.attributes('id')).toBe('second');
  expect(w.attributes('aria-label')).toBe('second');
  expect(w.attributes('style')).toContain('color: blue');
  w.unmount();
});

it('F11: SSR forwards id and native string style without treating characters as CSS properties', async () => {
  const html = await renderToString(h(List, { id: 'server-list', style: 'color:red' }));
  expect(html).toContain('id="server-list"');
  expect(html).toContain('color:red');
});
