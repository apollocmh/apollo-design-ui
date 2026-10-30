/** Native table, row headers, sort/filter actions, selection names and expansion state. */
import { a11yDemoTest } from '@apollo-design/test-utils';
import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { Table } from '../index';
import type { ColumnsType, ColumnType } from '../interface';

interface Row {
  key: string;
  name: string;
  age: number;
}
const columns: [ColumnType<Row>, ColumnType<Row>] = [
  { title: 'Name', dataIndex: 'name', key: 'name' },
  { title: 'Age', dataIndex: 'age', key: 'age', sorter: (a, b) => a.age - b.age },
];
const dataSource: Row[] = [
  { key: '1', name: 'Alice', age: 30 },
  { key: '2', name: 'Bob', age: 25 },
];
const wrappers: VueWrapper[] = [];
afterEach(() => {
  for (const wrapper of wrappers.splice(0)) wrapper.unmount();
});
a11yDemoTest('Table', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 44,
});

describe('Table · a11y', () => {
  it('renders column headers and actual row headers from the column rowScope contract', async () => {
    const wrapper = mount(Table<Row>, {
      props: { columns: [{ ...columns[0], rowScope: 'row' }, columns[1]], dataSource },
    });
    wrappers.push(wrapper);
    await nextTick();
    expect(wrapper.findAll('thead th').length).toBeGreaterThan(0);
    for (const header of wrapper.findAll('thead th'))
      expect(header.attributes('scope')).toBeTruthy();
    const rowHeaders = wrapper.findAll('tbody th[scope=row]');
    expect(rowHeaders).toHaveLength(2);
    expect(rowHeaders[0]?.text()).toBe('Alice');
  });
  it('reports the active sort direction and omits aria-sort before sorting', async () => {
    const sorted: ColumnsType<Row> = [columns[0], { ...columns[1], defaultSortOrder: 'ascend' }];
    const wrapper = mount(Table<Row>, { props: { columns: sorted, dataSource } });
    wrappers.push(wrapper);
    await nextTick();
    expect(wrapper.get('thead th[aria-sort]').attributes('aria-sort')).toBe('ascending');
    const plain = mount(Table<Row>, { props: { columns, dataSource } });
    wrappers.push(plain);
    await nextTick();
    expect(plain.find('thead th[aria-sort]').exists()).toBe(false);
  });
  it('gives the select-all checkbox an accessible name', async () => {
    const wrapper = mount(Table<Row>, { props: { columns, dataSource, rowSelection: {} } });
    wrappers.push(wrapper);
    await nextTick();
    expect(wrapper.findAll('input[type=checkbox]').length).toBeGreaterThan(0);
    expect(wrapper.find('thead input[type=checkbox][aria-label]').exists()).toBe(true);
  });
  it('gives available expansion controls an accessible name and expanded state', async () => {
    const wrapper = mount(Table<Row>, {
      props: { columns, dataSource },
      slots: { expandedRow: () => 'detail' },
    });
    wrappers.push(wrapper);
    await nextTick();
    const icon = wrapper.get('button[aria-expanded]');
    expect(icon.attributes('aria-label')).toBeTruthy();
    expect(icon.attributes('aria-expanded')).toBe('false');
  });
  it('exposes the filter trigger as a button', async () => {
    const filterColumns: ColumnsType<Row> = [
      {
        title: 'Name',
        dataIndex: 'name',
        key: 'name',
        filters: [{ text: 'Alice', value: 'Alice' }],
        onFilter: (value, record) => record.name === value,
      },
    ];
    const wrapper = mount(Table<Row>, { props: { columns: filterColumns, dataSource } });
    wrappers.push(wrapper);
    await nextTick();
    expect(wrapper.find('.apollo-table-filter-trigger[role=button]').exists()).toBe(true);
  });
});
