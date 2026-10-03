/**
 * Vue 侧（@apollo-design/ui）的 Table 视觉用例。与 react/table.jsx 逐条对应。
 * basic（3×3 + 链接列）/ bordered-size（bordered × 3 size）/ empty（空数据 placeholder）。
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

const COLUMNS = [
  { title: 'Name', dataIndex: 'name', key: 'name' },
  { title: 'Age', dataIndex: 'age', key: 'age' },
  { title: 'Address', dataIndex: 'address', key: 'address' },
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
};
