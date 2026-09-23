/**
 * React 侧（antd 6.6.4）的 InputNumber 视觉用例。与 vue/input-number.js 逐条对应。
 */

import { InputNumber } from 'antd';

const box = (children) => <div style={{ minHeight: 240, padding: 16 }}>{children}</div>;

const col = { display: 'flex', flexDirection: 'column', gap: 8, width: 320 };

export default {
  basic: () =>
    box(
      <div style={col}>
        <InputNumber defaultValue={3} min={1} max={10} />
        <InputNumber defaultValue={3} size="large" />
        <InputNumber defaultValue={3} size="small" />
      </div>,
    ),

  variants: () =>
    box(
      <div style={col}>
        <InputNumber placeholder="outlined" />
        <InputNumber placeholder="filled" variant="filled" />
        <InputNumber placeholder="borderless" variant="borderless" />
        <InputNumber placeholder="underlined" variant="underlined" />
      </div>,
    ),

  states: () =>
    box(
      <div style={col}>
        <InputNumber defaultValue={3} disabled />
        <InputNumber defaultValue={3} readOnly />
        <InputNumber placeholder="error" status="error" />
        <InputNumber placeholder="warning" status="warning" />
        <InputNumber value={99} min={1} max={10} />
        <InputNumber mode="spinner" defaultValue={3} min={0} max={10} />
        <InputNumber prefix="$" suffix="USD" defaultValue={1} />
      </div>,
    ),
};
