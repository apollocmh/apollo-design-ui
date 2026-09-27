/**
 * React 侧（antd 6.6.4）的 AutoComplete 视觉用例。与 vue/auto-complete.js 逐条对应。
 * basic（默认 + 受控值）/ status（校验状态）/ style-class（语义样式）。
 */

import { AutoComplete } from 'antd';

const box = (children) => <div style={{ minHeight: 80, padding: 16, width: 480 }}>{children}</div>;

const options = [{ value: 'Burnaby' }, { value: 'Seattle' }, { value: 'Los Angeles' }];

export default {
  basic: () =>
    box(
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <AutoComplete options={options} placeholder="input here" style={{ width: 200 }} />
        <AutoComplete value="abc" options={options} style={{ width: 200 }} />
      </div>,
    ),

  status: () =>
    box(
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <AutoComplete options={options} status="error" style={{ width: 200 }} />
        <AutoComplete options={options} status="warning" style={{ width: 200 }} />
      </div>,
    ),

  'style-class': () =>
    box(
      <AutoComplete
        options={options}
        placeholder="object styles"
        style={{ width: 200 }}
        styles={{
          popup: { root: { borderWidth: 1, borderColor: '#1890ff' } },
        }}
      />,
    ),
};
