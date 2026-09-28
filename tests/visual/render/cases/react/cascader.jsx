/**
 * React 侧（antd 6.6.4）的 Cascader 视觉用例。与 vue/cascader.js 逐条对应。
 */

import { Cascader } from 'antd';

const PureCascader = Cascader._InternalPanelDoNotUseOrYouWillBeFired;

const OPTIONS = [
  {
    value: 'zhejiang',
    label: '浙江',
    children: [
      { value: 'hangzhou', label: '杭州', children: [{ value: 'xihu', label: '西湖' }] },
      { value: 'ningbo', label: '宁波' },
    ],
  },
  { value: 'jiangsu', label: '江苏', children: [{ value: 'nanjing', label: '南京' }] },
];

const box = (children) => (
  <div style={{ minHeight: 260, padding: 24, display: 'flex', alignItems: 'flex-end' }}>{children}</div>
);

export default {
  basic: () =>
    box(
      <div style={{ position: 'relative' }}>
        <Cascader options={OPTIONS} open placement="bottomLeft" defaultValue={['zhejiang', 'hangzhou']} />
        <div style={{ position: 'absolute', top: '100%', left: 0, minWidth: 480 }}>
          <PureCascader options={OPTIONS} />
        </div>
      </div>,
    ),

  multiple: () =>
    box(
      <div style={{ position: 'relative' }}>
        <Cascader multiple options={OPTIONS} open placement="bottomLeft" />
        <div style={{ position: 'absolute', top: '100%', left: 0, minWidth: 480 }}>
          <PureCascader options={OPTIONS} multiple />
        </div>
      </div>,
    ),

  panel: () => box(<PureCascader options={OPTIONS} />),
};
