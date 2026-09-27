/**
 * React 侧（antd 6.6.4）的 Rate 视觉用例。与 vue/rate.js 逐条对应。
 * basic（默认尺寸 + 状态）/ half（半星）/ character（自定义字符）。
 */

import { Rate } from 'antd';

const box = (children) => <div style={{ minHeight: 80, padding: 16, width: 480 }}>{children}</div>;

export default {
  basic: () =>
    box(
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Rate defaultValue={3} />
        <Rate defaultValue={5} disabled />
      </div>,
    ),

  half: () => box(<Rate defaultValue={2.5} allowHalf />),

  character: () =>
    box(
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Rate defaultValue={3} character="A" />
        <Rate defaultValue={2} character="好" />
      </div>,
    ),
};
