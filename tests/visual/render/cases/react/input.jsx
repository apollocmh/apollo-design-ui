/**
 * React 侧（antd 6.6.4）的 Input 视觉用例。与 vue/input.js 逐条对应。
 */

import { Input } from 'antd';

const box = (children) => <div style={{ minHeight: 240, padding: 16 }}>{children}</div>;

const col = { display: 'flex', flexDirection: 'column', gap: 8, width: 320 };

export default {
  basic: () =>
    box(
      <div style={col}>
        <Input placeholder="default" />
        <Input placeholder="large" size="large" />
        <Input placeholder="small" size="small" />
      </div>,
    ),

  variants: () =>
    box(
      <div style={col}>
        <Input placeholder="outlined" />
        <Input placeholder="filled" variant="filled" />
        <Input placeholder="borderless" variant="borderless" />
        <Input placeholder="underlined" variant="underlined" />
      </div>,
    ),

  states: () =>
    box(
      <div style={col}>
        <Input placeholder="disabled" disabled />
        <Input placeholder="readonly" readOnly />
        <Input placeholder="error" status="error" />
        <Input placeholder="warning" status="warning" />
        <Input placeholder="clear me" allowClear defaultValue="clear me" />
        <Input placeholder="count" showCount maxLength={20} defaultValue="abc" />
        <Input.Password placeholder="password" />
        <Input.TextArea placeholder="textarea" rows={2} />
      </div>,
    ),
};
