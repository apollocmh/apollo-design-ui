/**
 * Vue 侧（@apollo-design/ui）的 Table 视觉用例。与 react/table.jsx 逐条对应。
 * basic / bordered-size / empty / expand / selection（checkbox+radio）/ sorter-filter。
 *
 * ⚠️ 全部为静态形态（无固定列/滚动联动）—— T1 分片只比骨架；
 *    固定列/汇总/粘性条随 T5 补变体。
 */

import { Table } from '@apollo-design/ui';
import { h } from 'vue';

const DATA = [
  { key: '1', name: 'John Brown', age: 32, address: 'New York No. 1 Lake Park' },
  { key: '2', name: 'Jim Green', age: 42, address: 'London No. 1 Lake Park' },
  { key: '3', name: 'Joe Black', age: 28, address: 'Sydney No. 1 Lake Park' },
];

const NEST_DATA = [
  {
    key: '1',
    name: 'John Brown',
    age: 32,
    children: [
      { key: '1-1', name: 'Jim Green', age: 40 },
      {
        key: '1-2',
        name: 'Joe Black',
        age: 36,
        children: [{ key: '1-2-1', name: 'Jim Red', age: 32 }],
      },
    ],
  },
  { key: '2', name: 'Johnny Green', age: 28 },
];

const SORT_COLUMNS = [
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
    filters: [
      { text: 'Joe', value: 'Joe' },
      { text: 'John', value: 'John' },
    ],
    onFilter: (value, record) => record.name.includes(value),
    defaultFilteredValue: ['John'],
  },
  {
    title: 'Age',
    dataIndex: 'age',
    key: 'age',
    sorter: (a, b) => a.age - b.age,
    defaultSortOrder: 'descend',
  },
  { title: 'Address', dataIndex: 'address', key: 'address' },
];

const FIXED_COLUMNS = [
  { title: 'Name', dataIndex: 'name', key: 'name', width: 120, fixed: 'left' },
  { title: 'Age', dataIndex: 'age', key: 'age', width: 100 },
  { title: 'Column 1', dataIndex: 'address', key: 'a1', width: 150 },
  { title: 'Column 2', dataIndex: 'address', key: 'a2', width: 150 },
  { title: 'Column 3', dataIndex: 'address', key: 'a3', width: 150 },
  { title: 'Address', dataIndex: 'address', key: 'a4', width: 120, fixed: 'right' },
];

const COLUMNS = [
  { title: 'Name', dataIndex: 'name', key: 'name' },
  { title: 'Age', dataIndex: 'age', key: 'age' },
  { title: 'Address', dataIndex: 'address', key: 'address' },
];

// T6 虚拟滚动：对齐 antd `demo/virtual-list.tsx` 的静态形态（固定列 + rowSpan/colSpan + 横向 2000）
const VIRTUAL_DATA = Array.from({ length: 100 }).map((_, index) => ({
  id: index,
  firstName: `First_${index.toString(16)}`,
  lastName: `Last_${index.toString(16)}`,
  age: 25 + (index % 10),
  address1: `New York No. ${index} Lake Park`,
  address2: `London No. ${index} Lake Park`,
  address3: `Sydney No. ${index} Lake Park`,
}));

const VIRTUAL_COLUMNS = [
  { title: 'ID', dataIndex: 'id', width: 100, fixed: 'start' },
  { title: 'FistName', dataIndex: 'firstName', width: 120, fixed: 'start' },
  { title: 'LastName', dataIndex: 'lastName', width: 120, fixed: 'start' },
  {
    title: 'Group',
    width: 120,
    render: (_value, record) => `Group ${Math.floor(record.id / 4)}`,
    onCell: (record) => ({ rowSpan: record.id % 4 === 0 ? 4 : 0 }),
  },
  {
    title: 'Age',
    dataIndex: 'age',
    width: 100,
    onCell: (record) => ({ colSpan: record.id % 4 === 0 ? 2 : 1 }),
  },
  {
    title: 'Address 1',
    dataIndex: 'address1',
    onCell: (record) => ({ colSpan: record.id % 4 === 0 ? 0 : 1 }),
  },
  { title: 'Address 2', dataIndex: 'address2' },
  { title: 'Address 3', dataIndex: 'address3' },
  { title: 'Action', width: 150, fixed: 'end', render: () => 'Action' },
];

const box = (children) => h('div', { style: { padding: '16px', width: '640px' } }, children);

export default {
  basic: () =>
    box(
      h(Table, {
        columns: COLUMNS,
        dataSource: DATA,
      }),
    ),

  'bordered-size': () =>
    box([
      h(Table, {
        columns: COLUMNS,
        dataSource: DATA,
        bordered: true,
        size: 'small',
        style: { marginBottom: '24px' },
      }),
      h(Table, {
        columns: COLUMNS,
        dataSource: DATA,
        bordered: true,
        size: 'middle',
      }),
    ]),

  empty: () => box(h(Table, { columns: COLUMNS, dataSource: [] })),

  expand: () =>
    box([
      h(Table, {
        columns: COLUMNS,
        dataSource: DATA,
        expandable: {
          expandedRowRender: (r) => r.address,
          defaultExpandAllRows: true,
        },
        style: { marginBottom: '24px' },
      }),
      h(Table, {
        columns: COLUMNS,
        dataSource: NEST_DATA,
      }),
    ]),

  selection: () =>
    box([
      h(Table, {
        columns: COLUMNS,
        dataSource: DATA,
        rowSelection: { selectedRowKeys: ['1'] },
        style: { marginBottom: '24px' },
      }),
      h(Table, {
        columns: COLUMNS,
        dataSource: DATA,
        rowSelection: { type: 'radio', selectedRowKeys: ['2'] },
      }),
    ]),

  'fixed-summary': () =>
    box([
      h(Table, {
        columns: FIXED_COLUMNS,
        dataSource: DATA,
        scroll: { x: 790 },
        style: { width: '480px', marginBottom: '24px' },
      }),
      h(Table, {
        columns: COLUMNS,
        dataSource: DATA,
        summary: () =>
          h(Table.Summary, null, {
            default: () =>
              h(Table.Summary.Row, null, {
                default: () => [
                  h(Table.Summary.Cell, { index: 0, colSpan: 2 }, { default: () => 'Total' }),
                  h(Table.Summary.Cell, { index: 2 }, { default: () => '102' }),
                ],
              }),
          }),
      }),
    ]),

  'sorter-filter': () =>
    box(
      h(Table, {
        columns: SORT_COLUMNS,
        dataSource: DATA,
      }),
    ),

  virtual: () =>
    box(
      h(Table, {
        bordered: true,
        virtual: true,
        columns: VIRTUAL_COLUMNS,
        dataSource: VIRTUAL_DATA,
        scroll: { x: 2000, y: 400 },
        rowKey: 'id',
        pagination: false,
      }),
    ),
};
