/**
 * React 侧（antd 6.6.4）的 Cascader 视觉用例。与 vue/cascader.js 逐条对应。
 *
 * ⚠️ 面板用 **`Cascader.Panel`**（公开 API，rc Panel = 只有列）。不要用
 * `Cascader._InternalPanelDoNotUseOrYouWillBeFired` —— 那是 `genPurePanel(Cascader)`
 * （**完整 Cascader** 外壳 + 浮层塞进 holder div），与 Vue 侧 `CascaderPanel` 不是同一个东西，
 * 两侧会比出结构性差异（L6 误判记录）。
 */

import { Cascader } from 'antd';

const CascaderPanel = Cascader.Panel;

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
  <div style={{ minHeight: 260, padding: 24, display: 'flex', alignItems: 'flex-end' }}>
    {children}
  </div>
);

export default {
  basic: () =>
    box(
      <div style={{ position: 'relative' }}>
        <Cascader
          options={OPTIONS}
          open
          placement="bottomLeft"
          defaultValue={['zhejiang', 'hangzhou']}
        />
        <div style={{ position: 'absolute', top: '100%', left: 0, minWidth: 480 }}>
          <CascaderPanel options={OPTIONS} />
        </div>
      </div>,
    ),

  multiple: () =>
    box(
      <div style={{ position: 'relative' }}>
        <Cascader multiple options={OPTIONS} open placement="bottomLeft" />
        <div style={{ position: 'absolute', top: '100%', left: 0, minWidth: 480 }}>
          <CascaderPanel options={OPTIONS} multiple />
        </div>
      </div>,
    ),

  panel: () => box(<CascaderPanel options={OPTIONS} />),
};
