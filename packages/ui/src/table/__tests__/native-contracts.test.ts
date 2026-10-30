import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, mergeProps, nextTick, ref } from 'vue';
import ConfigProvider from '../../config-provider/ConfigProvider';
import type { ColumnsType, TableExpandedRowSlotProps } from '../interface';
import Table from '../Table';

const RecordTable = Table<Record<string, unknown>>;

const wrappers: VueWrapper[] = [];
const options = { attachTo: document.body, global: { stubs: { teleport: false } } };
const data = [
  { key: 'a', name: 'Alpha', age: 10 },
  { key: 'b', name: 'Beta', age: 20 },
];
const columns: ColumnsType = [
  { key: 'name', dataIndex: 'name', title: 'Name' },
  { key: 'age', dataIndex: 'age', title: 'Age', sorter: (a, b) => Number(a.age) - Number(b.age) },
];
afterEach(() => {
  for (const w of wrappers.splice(0)) w.unmount();
  vi.restoreAllMocks();
});
const settle = async () => {
  await nextTick();
  await nextTick();
};
describe('Table current Vue contracts', () => {
  it('owns change with merged/once listeners while preserving its four-part payload', async () => {
    const first = vi.fn();
    const second = vi.fn();
    const once = vi.fn();
    const w = mount(
      defineComponent({
        setup: () => () =>
          h(
            RecordTable,
            mergeProps(
              { columns, dataSource: data, pagination: false, onChange: first },
              { onChange: second, onChangeOnce: once },
            ),
          ),
      }),
      options,
    );
    wrappers.push(w);
    await w.get('.apollo-table-column-has-sorters').trigger('click');
    await w.get('.apollo-table-column-has-sorters').trigger('click');
    expect(first).toHaveBeenCalledTimes(2);
    expect(second).toHaveBeenCalledTimes(2);
    expect(once).toHaveBeenCalledTimes(1);
    expect(first.mock.calls[0]).toHaveLength(4);
    expect(first.mock.calls[0]?.[3]).toMatchObject({ action: 'sort' });
    expect(w.getComponent({ name: 'ATable' }).emitted('change')).toHaveLength(2);
  });
  it.each([false, true])(
    'updates same-key row records and current index with retained controls (virtual=%s)',
    async (virtual) => {
      const rows = ref(data);
      const seen = vi.fn();
      const w = mount(
        defineComponent({
          setup: () => () =>
            h(RecordTable, {
              virtual,
              scroll: virtual ? { x: 200, y: 150 } : undefined,
              columns: [
                {
                  key: 'name',
                  dataIndex: 'name',
                  title: 'Name',
                  render: (_value: unknown, record: Record<string, unknown>, index: number) =>
                    h('input', {
                      'aria-label': String(record.key),
                      placeholder: `${record.name}:${index}`,
                    }),
                },
              ],
              dataSource: rows.value,
              pagination: false,
              onRow: (record: Record<string, unknown>, index?: number) => ({
                'data-current-index': index,
                onClick: () => seen(record.name, index),
              }),
            }),
        }),
        options,
      );
      wrappers.push(w);
      const input = w.get<HTMLInputElement>('input[aria-label="a"]');
      input.element.value = 'Draft';
      input.element.focus();
      rows.value = [
        { key: 'b', name: 'New Beta', age: 30 },
        { key: 'a', name: 'New Alpha', age: 40 },
      ];
      await settle();
      const current = w.get<HTMLInputElement>('input[aria-label="a"]');
      expect(current.element).toBe(input.element);
      expect(current.attributes('placeholder')).toBe('New Alpha:1');
      expect(current.element.value).toBe('Draft');
      expect(document.activeElement).toBe(input.element);
      await w.get('[data-row-key="a"]').trigger('click');
      expect(seen).toHaveBeenLastCalledWith('New Alpha', 1);
    },
  );
  it.each(['checkbox', 'radio'] as const)(
    'does not retain a rejected controlled row-selection proposal on withdrawal (%s)',
    async (type) => {
      const change = vi.fn();
      const w = mount(RecordTable, {
        ...options,
        props: {
          columns,
          dataSource: data,
          pagination: false,
          rowSelection: { type, selectedRowKeys: ['a'], onChange: change },
        },
      });
      wrappers.push(w);
      await w.get(`tr[data-row-key="b"] input[type="${type}"]`).setValue(true);
      expect(change).toHaveBeenCalledTimes(1);
      expect(w.get<HTMLInputElement>('tr[data-row-key="b"] input').element.checked).toBe(false);
      await w.setProps({ rowSelection: { type, onChange: change } });
      expect(w.get<HTMLInputElement>('tr[data-row-key="a"] input').element.checked).toBe(true);
      expect(w.get<HTMLInputElement>('tr[data-row-key="b"] input').element.checked).toBe(false);
    },
  );
  it('does not retain a rejected controlled expansion proposal on withdrawal', async () => {
    const changed = vi.fn();
    const expandedRowRender = (record: Record<string, unknown>) => `Detail ${record.name}`;
    const w = mount(RecordTable, {
      ...options,
      props: {
        columns,
        dataSource: data,
        pagination: false,
        expandable: { expandedRowKeys: ['a'], onExpandedRowsChange: changed },
      },
      slots: {
        expandedRow: ({ record }: TableExpandedRowSlotProps<Record<string, unknown>>) =>
          expandedRowRender(record),
      },
    });
    wrappers.push(w);
    await w.get('tr[data-row-key="b"] .apollo-table-row-expand-icon').trigger('click');
    expect(changed).toHaveBeenCalledTimes(1);
    await w.setProps({ expandable: { onExpandedRowsChange: changed } });
    expect(
      w.get('tr[data-row-key="a"] .apollo-table-row-expand-icon').attributes('aria-expanded'),
    ).toBe('true');
    expect(
      w.get('tr[data-row-key="b"] .apollo-table-row-expand-icon').attributes('aria-expanded'),
    ).toBe('false');
  });
  it('does not retain a rejected controlled pagination proposal on withdrawal', async () => {
    const change = vi.fn();
    const w = mount(RecordTable, {
      ...options,
      props: {
        columns,
        dataSource: data,
        pagination: { current: 1, pageSize: 1, onChange: change },
      },
    });
    wrappers.push(w);
    await w.get('.apollo-pagination-next').trigger('click');
    expect(change).toHaveBeenCalledTimes(1);
    expect(w.get('tr[data-row-key]').attributes('data-row-key')).toBe('a');
    await w.setProps({ pagination: { pageSize: 1, onChange: change } });
    expect(w.get('tr[data-row-key]').attributes('data-row-key')).toBe('a');
  });
  it.each([false, true])(
    'accepts native Vue row/cell attrs and merged listeners from data services (virtual=%s)',
    async (virtual) => {
      const first = vi.fn();
      const second = vi.fn();
      const cell = vi.fn();
      const w = mount(RecordTable, {
        ...options,
        props: {
          virtual,
          scroll: virtual ? { x: 200, y: 150 } : undefined,
          columns: [
            {
              key: 'name',
              dataIndex: 'name',
              title: 'Name',
              onCell: () => ({
                class: ['cell-native', { active: true }],
                style: ['color:rgb(1, 2, 3)', { fontWeight: 600 }],
                onClick: cell,
              }),
            },
          ],
          dataSource: data,
          pagination: false,
          onRow: () =>
            mergeProps(
              {
                class: ['row-native', { active: true }],
                style: ['letter-spacing:2px', { fontSize: '18px' }],
                onClick: first,
              },
              { onClick: second },
            ),
        },
      });
      wrappers.push(w);
      const row = w.get<HTMLElement>('[data-row-key="a"]');
      const td = row.get<HTMLElement>('.apollo-table-cell');
      expect(row.classes()).toEqual(expect.arrayContaining(['row-native', 'active']));
      expect(row.element.style.letterSpacing).toBe('2px');
      expect(td.classes()).toContain('cell-native');
      expect(td.element.style.color).toBe('rgb(1, 2, 3)');
      await td.trigger('click');
      expect(first).toHaveBeenCalledTimes(1);
      expect(second).toHaveBeenCalledTimes(1);
      expect(cell).toHaveBeenCalledTimes(1);
    },
  );
  it('tracks Provider replacement for prefix, root and nested semantic styles', async () => {
    const changed = ref(false);
    const w = mount(
      defineComponent({
        setup: () => () =>
          h(
            ConfigProvider,
            {
              prefixCls: changed.value ? 'next' : 'apollo',
              components: changed.value
                ? {}
                : {
                    table: {
                      className: 'provided-table',
                      style: { letterSpacing: '2px' },
                      classNames: { body: { cell: 'provided-cell' } },
                      styles: { body: { cell: { color: 'rgb(3, 4, 5)' } } },
                    },
                  },
            },
            () => h(RecordTable, { columns, dataSource: data, pagination: false }),
          ),
      }),
      options,
    );
    wrappers.push(w);
    expect(w.get('.apollo-table-wrapper').classes()).toContain('provided-table');
    expect(w.get('tbody td').classes()).toContain('provided-cell');
    expect(w.get<HTMLElement>('tbody td').element.style.color).toBe('rgb(3, 4, 5)');
    changed.value = true;
    await settle();
    expect(w.find('.next-table-wrapper').exists()).toBe(true);
    expect(w.get('tbody td').classes()).not.toContain('provided-cell');
  });
});
it('supports actual template scopes, current full/empty content and retained row/expanded controls', async () => {
  const { default: NativeTable } = await import('./fixtures/NativeTable.vue');
  const w = mount(NativeTable, options);
  wrappers.push(w);
  await settle();
  expect(w.get('[data-title]').text()).toBe('2 users 0');
  expect(w.get('[data-column="name"]').text()).toBe('Name 0');
  expect(w.get('[data-summary]').text()).toBe('2 0');
  const input = w.get<HTMLInputElement>('input[aria-label="a"]');
  input.element.value = 'Draft';
  input.element.focus();
  const detail = w.get<HTMLInputElement>('input[aria-label="Detail a"]');
  detail.element.value = 'Detail draft';
  w.vm.replace();
  await settle();
  expect(w.get('input[aria-label="a"]').element).toBe(input.element);
  expect(input.attributes('placeholder')).toBe('New Alpha');
  expect(input.element.value).toBe('Draft');
  expect(document.activeElement).toBe(input.element);
  await w.get('[data-expand="a"]').trigger('click');
  await w.get('[data-expand="a"]').trigger('click');
  expect(w.get('input[aria-label="Detail a"]').element).toBe(detail.element);
  expect(detail.element.value).toBe('Detail draft');
  w.vm.patch();
  await settle();
  expect(w.get('[data-summary]').text()).toBe('2 1');
  expect(w.get('[data-column="name"]').text()).toBe('Name 1');
  w.vm.patch();
  await settle();
  expect(w.find('[data-expand="a"]').exists()).toBe(false);
  expect(w.get('tr[data-row-key="a"]').text()).not.toContain('40');
  expect(w.vm.native()).toBe(w.get('.apollo-table').element);
});
