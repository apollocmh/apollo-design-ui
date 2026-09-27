/**
 * React 侧（antd 6.6.4）的 FloatButton 视觉用例。与 vue/float-button.js 逐条对应。
 * basic（icon-only + primary）/ shape-content（square + content）/ badge-tooltip。
 */

import { FloatButton } from 'antd';

const box = (children) => <div style={{ minHeight: 120, padding: 16, width: 480 }}>{children}</div>;

export default {
  basic: () =>
    box(
      <div style={{ display: 'flex', gap: 16 }}>
        <FloatButton />
        <FloatButton type="primary" />
        <FloatButton shape="square" />
      </div>,
    ),

  'shape-content': () =>
    box(
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <FloatButton shape="square" content="HELP INFO" />
        <FloatButton shape="square" icon={<span style={{ fontSize: 14 }}>?</span>} content="HELP" />
      </div>,
    ),

  'badge-tooltip': () =>
    box(
      <div style={{ display: 'flex', gap: 16 }}>
        <FloatButton badge={{ dot: true }} />
        <FloatButton badge={{ count: 5 }} />
        <FloatButton tooltip="title text" />
      </div>,
    ),
};
