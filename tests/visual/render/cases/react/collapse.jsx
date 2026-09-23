/**
 * React 侧（antd 6.6.4）的 Collapse 视觉用例。与 vue/collapse.js 逐条对应。
 */

import { Collapse } from 'antd';

const box = (children) => <div style={{ minHeight: 240, padding: 16 }}>{children}</div>;

const items = [
  { key: '1', label: 'Header 1', children: 'Content 1' },
  { key: '2', label: 'Header 2', children: 'Content 2' },
  { key: '3', label: 'Header 3', children: 'Content 3' },
];

export default {
  basic: () =>
    box(
      <div style={{ width: 480 }}>
        <Collapse items={items} defaultActiveKey="1" />
      </div>,
    ),

  accordion: () =>
    box(
      <div style={{ width: 480 }}>
        <Collapse items={items} accordion defaultActiveKey="1" />
      </div>,
    ),

  borderless: () =>
    box(
      <div style={{ width: 480 }}>
        <Collapse items={items} bordered={false} defaultActiveKey={['1', '2']} />
      </div>,
    ),
};
