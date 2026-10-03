/**
 * React 侧（antd）的 Table 视觉用例。与 vue/table.js 逐条对应。
 * basic（3×3 + 链接列）/ bordered-size（bordered × 2 size）/ empty（空数据 placeholder）。
 */

import { Table } from 'antd';

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

const box = (children) => <div style={{ padding: '16px', width: '640px' }}>{children}</div>;

export default {
  basic: () => box(<Table columns={COLUMNS} dataSource={DATA} />),

  'bordered-size': () =>
    box([
      <Table
        key="s"
        columns={COLUMNS}
        dataSource={DATA}
        bordered
        size="small"
        style={{ marginBottom: '24px' }}
      />,
      <Table key="m" columns={COLUMNS} dataSource={DATA} bordered size="middle" />,
    ]),

  empty: () => box(<Table columns={COLUMNS} dataSource={[]} />),

  expand: () =>
    box([
      <Table
        key="row"
        columns={COLUMNS}
        dataSource={DATA}
        expandable={{ expandedRowRender: (r) => r.address, defaultExpandAllRows: true }}
        style={{ marginBottom: '24px' }}
      />,
      <Table key="nest" columns={COLUMNS} dataSource={NEST_DATA} />,
    ]),

  selection: () =>
    box([
      <Table
        key="cb"
        columns={COLUMNS}
        dataSource={DATA}
        rowSelection={{ selectedRowKeys: ['1'] }}
        style={{ marginBottom: '24px' }}
      />,
      <Table
        key="rd"
        columns={COLUMNS}
        dataSource={DATA}
        rowSelection={{ type: 'radio', selectedRowKeys: ['2'] }}
      />,
    ]),

  'fixed-summary': () =>
    box([
      <Table
        key="fx"
        columns={FIXED_COLUMNS}
        dataSource={DATA}
        scroll={{ x: 790 }}
        style={{ width: '480px', marginBottom: '24px' }}
      />,
      <Table
        key="sm"
        columns={COLUMNS}
        dataSource={DATA}
        summary={() => (
          <Table.Summary>
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={2}>
                Total
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2}>102</Table.Summary.Cell>
            </Table.Summary.Row>
          </Table.Summary>
        )}
      />,
    ]),

  'sorter-filter': () => box(<Table columns={SORT_COLUMNS} dataSource={DATA} />),
};
