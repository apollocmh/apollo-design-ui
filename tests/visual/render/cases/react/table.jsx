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
};
