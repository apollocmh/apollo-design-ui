/**
 * React 侧（antd 6.6.4）的 Descriptions 视觉用例。与 vue/descriptions.js 逐条对应。
 *
 * ⚠️ 内容只用纯文本（L6 是像素比对，两侧必须逐字一致）。
 */

import { Descriptions } from 'antd';

const box = (children) => <div style={{ minHeight: 200, padding: 16 }}>{children}</div>;

const items = [
  { key: '1', label: 'Product', children: 'Cloud Database' },
  { key: '2', label: 'Billing', children: 'Prepaid' },
  { key: '3', label: 'time', children: '18:00:00' },
];

export default {
  basic: () =>
    box(
      <div style={{ width: 640 }}>
        <Descriptions items={items} />
      </div>,
    ),

  bordered: () =>
    box(
      <div style={{ width: 640 }}>
        <Descriptions bordered items={items} title="Bordered" />
      </div>,
    ),

  vertical: () =>
    box(
      <div style={{ width: 640 }}>
        <Descriptions layout="vertical" items={items} />
      </div>,
    ),

  size: () =>
    box(
      <div style={{ width: 640 }}>
        <Descriptions size="small" title="Small" items={items} style={{ marginBottom: 16 }} />
        <Descriptions title="Medium" items={items} />
      </div>,
    ),
};
