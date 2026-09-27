/**
 * React 侧（antd 6.6.4）的 Select 视觉用例。与 vue/select.js 逐条对应。
 * ⚠️ open 受控静态帧钉住下拉（与 dropdown 同判）；closed 用 value + allowClear
 *    展示回填与清除位。
 */

import { Select } from 'antd';

const box = (children) => <div style={{ minHeight: 280, padding: 16, width: 420 }}>{children}</div>;

const options = [
  { value: 'jack', label: 'Jack' },
  { value: 'lucy', label: 'Lucy', disabled: true },
  { value: 'tom', label: 'Tom' },
];

export default {
  basic: () =>
    box(<Select options={options} defaultValue="jack" allowClear style={{ width: 220 }} />),

  multiple: () =>
    box(
      <Select
        options={options}
        mode="multiple"
        defaultValue={['jack', 'tom']}
        style={{ width: 320 }}
      />,
    ),

  open: () =>
    box(
      <div style={{ height: 300 }}>
        <Select options={options} open style={{ width: 220 }} />
      </div>,
    ),
};
