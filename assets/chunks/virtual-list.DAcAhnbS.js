const n=`<script setup lang="ts">
import type { TableColumnsType } from '@apollo-design/ui';
import { Table } from '@apollo-design/ui';

/**
 * 对齐 antd \`components/table/demo/virtual-list.tsx\` 的**静态形态**：
 * 固定列（左 3 / 右 1）+ rowSpan/colSpan + 横向 2000px + 纵向 400px 视口。
 * 交互开关（bordered / fixed / expandable / empty / count）不进静态帧。
 *
 * ⚠️ 数据用 \`Record<string, unknown>\`（不是自定义 interface）—— 本仓 \`TableColumnsType\`
 * 的 \`onCell\` 签名要求 \`Record<string, unknown>\`，自定义 interface 缺索引签名会不兼容。
 */
const columns: TableColumnsType = [
  { title: 'ID', dataIndex: 'id', width: 100, fixed: 'left' },
  { title: 'FistName', dataIndex: 'firstName', width: 120, fixed: 'left' },
  { title: 'LastName', dataIndex: 'lastName', width: 120, fixed: 'left' },
  {
    title: 'Group',
    width: 120,
    render: (_value: unknown, record: Record<string, unknown>) =>
      \`Group \${Math.floor(Number(record.id) / 4)}\`,
    onCell: (record: Record<string, unknown>) => ({ rowSpan: Number(record.id) % 4 === 0 ? 4 : 0 }),
  },
  {
    title: 'Age',
    dataIndex: 'age',
    width: 100,
    onCell: (record: Record<string, unknown>) => ({ colSpan: Number(record.id) % 4 === 0 ? 2 : 1 }),
  },
  {
    title: 'Address 1',
    dataIndex: 'address1',
    onCell: (record: Record<string, unknown>) => ({ colSpan: Number(record.id) % 4 === 0 ? 0 : 1 }),
  },
  { title: 'Address 2', dataIndex: 'address2' },
  { title: 'Address 3', dataIndex: 'address3' },
  { title: 'Action', width: 150, fixed: 'right', render: () => 'Action' },
];

const data: Record<string, unknown>[] = Array.from({ length: 200 }).map((_, index) => ({
  id: index,
  firstName: \`First_\${index.toString(16)}\`,
  lastName: \`Last_\${index.toString(16)}\`,
  age: 25 + (index % 10),
  address1: \`New York No. \${index} Lake Park\`,
  address2: \`London No. \${index} Lake Park\`,
  address3: \`Sydney No. \${index} Lake Park\`,
}));
<\/script>

<template>
  <Table
    bordered
    virtual
    :columns="columns"
    :scroll="{ x: 2000, y: 400 }"
    :data-source="data"
    row-key="id"
    :pagination="false"
  />
</template>
`;export{n as default};
