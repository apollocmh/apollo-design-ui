import { mount } from '@vue/test-utils';
import { expect, it, vi } from 'vitest';
import { createSSRApp, defineComponent, h, nextTick, ref, type VNodeChild } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { List, ListItem } from '../../list';
import { Table } from '../../table';
import type { PaginationItemType, PaginationRange, PaginationSizeChangerInfo } from '../interface';
import Pagination from '../Pagination.vue';

it('F11: itemRender receives one named object for page, previous/next and both jump types', () => {
  const render = vi.fn(
    ({ page, type, element }: { page: number; type: PaginationItemType; element: VNodeChild }) =>
      h('b', { 'data-page-type': type, 'data-page': page }, [element]),
  );
  const w = mount(Pagination, {
    props: { total: 500, current: 6, showSizeChanger: false },
    slots: { itemRender: render },
  });
  const types = w.findAll('[data-page-type]').map((node) => node.attributes('data-page-type'));
  expect(new Set(types)).toEqual(new Set(['page', 'prev', 'next', 'jump-prev', 'jump-next']));
  expect(render.mock.calls.every((args) => args.length === 1)).toBe(true);
  expect(w.get('[data-page-type="prev"]').attributes('data-page')).toBe('5');
});

it('F11: total receives current total/range in a single object', async () => {
  const w = mount(Pagination, {
    props: { total: 85, showSizeChanger: false },
    slots: {
      total: ({ total, range }: { total: number; range: PaginationRange }) =>
        h('output', `${total}:${range?.join('-')}`),
    },
  });
  expect(w.get('output').text()).toBe('85:1-10');
  await w.setProps({ current: 3 });
  expect(w.get('output').text()).toBe('85:21-30');
});

it('F11: conditional item slots update, empty content suppresses fallback and removal restores it', async () => {
  const show = ref(false);
  const empty = ref(false);
  const label = ref('first');
  const w = mount(
    defineComponent({
      setup: () => () =>
        h(
          Pagination,
          { total: 80, showSizeChanger: false },
          show.value
            ? {
                itemRender: () =>
                  empty.value ? [] : h('b', { 'data-current-item': '' }, label.value),
              }
            : {},
        ),
    }),
  );
  expect(w.find('.apollo-pagination-item-1 a').exists()).toBe(true);
  show.value = true;
  await nextTick();
  expect(w.get('[data-current-item]').text()).toBe('first');
  label.value = 'second';
  await nextTick();
  expect(w.get('[data-current-item]').text()).toBe('second');
  empty.value = true;
  await nextTick();
  expect(w.find('[data-current-item]').exists()).toBe(false);
  expect(w.find('.apollo-pagination-prev button').exists()).toBe(false);
  show.value = false;
  await nextTick();
  expect(w.find('.apollo-pagination-item-1 a').exists()).toBe(true);
});

it('F11: a sizeChanger slot added after mount uses current state and emits one size change', async () => {
  const show = ref(false);
  const w = mount(
    defineComponent({
      setup: () => () =>
        h(
          Pagination,
          { total: 100, showSizeChanger: true },
          show.value
            ? {
                sizeChanger: ({ value, onSizeChange, disabled }: PaginationSizeChangerInfo) =>
                  h(
                    'button',
                    {
                      'data-custom-size': '',
                      disabled,
                      onClick: () => onSizeChange(20),
                    },
                    String(value),
                  ),
              }
            : {},
        ),
    }),
  );
  show.value = true;
  await nextTick();
  expect(w.get('[data-custom-size]').text()).toBe('10');
  await w.get('[data-custom-size]').trigger('click');
  expect(w.get('[data-custom-size]').text()).toBe('20');
  expect(w.getComponent(Pagination).emitted('update:pageSize')).toEqual([[20]]);
});

it('F10: native root attrs/events and string/array styles work in SSR and current updates', async () => {
  const html = await renderToString(
    createSSRApp({ render: () => h(Pagination, { style: 'color:red' }) }),
  );
  expect(html).toContain('color:red');
  const hit = vi.fn();
  const changed = ref(false);
  const w = mount(
    defineComponent({
      setup: () => () =>
        h(Pagination, {
          id: changed.value ? 'updated-pagination' : 'native-pagination',
          title: 'Pages',
          style: changed.value ? ['color:blue', { marginTop: '3px' }] : 'color:red',
          onClick: hit,
        }),
    }),
  );
  const root = w.element;
  expect(w.attributes('id')).toBe('native-pagination');
  expect(w.attributes('title')).toBe('Pages');
  await w.trigger('click');
  expect(hit).toHaveBeenCalledTimes(1);
  changed.value = true;
  await nextTick();
  expect(w.element).toBe(root);
  expect(w.attributes('style')).toContain('color: blue');
  expect(w.attributes('style')).toContain('margin-top: 3px');
  expect(w.attributes('id')).toBe('updated-pagination');
});

it('F11: List and Table forward native paginationTotal slots with current ranges', async () => {
  const total = ({ total, range }: { total: number; range: PaginationRange }) =>
    h('output', `${total}:${range?.join('-')}`);
  const list = mount(List, {
    props: {
      dataSource: Array.from({ length: 7 }, (_, i) => String(i)),
      pagination: { pageSize: 5 },
    },
    slots: {
      paginationTotal: total,
      item: ({ item }: { item: unknown }) => h(ListItem, null, () => String(item)),
    },
  });
  expect(list.get('output').text()).toBe('7:1-5');
  await list.get('.apollo-pagination-item-2').trigger('click');
  expect(list.get('output').text()).toBe('7:6-7');
  const table = mount(Table, {
    props: {
      dataSource: Array.from({ length: 12 }, (_, i) => ({ key: String(i), name: `Row ${i}` })),
      columns: [{ title: 'Name', dataIndex: 'name' }],
      pagination: { pageSize: 5 },
    },
    slots: { paginationTotal: total },
  });
  expect(table.get('output').text()).toBe('12:1-5');
  await table.get('.apollo-pagination-item-2').trigger('click');
  expect(table.get('output').text()).toBe('12:6-10');
});
