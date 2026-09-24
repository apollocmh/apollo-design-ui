/**
 * React 侧（antd 6.6.4）的 Tooltip 视觉用例。与 vue/tooltip.js 逐条对应。
 *
 * ⚠️ 全部用 `open` 受控静态帧（不走 hover 时序）。basicOpen / colorful 的浮层
 *    经 portal 挂 body —— 用 placement="bottom" + autoAdjustOverflow=false 钉死
 *    落点（autoAdjustOverflow 的翻转几何由 position 包的 oracle 差分测试承担，
 *    这里的截图等价于把「翻转决策」排除出像素比对，只留「对齐执行 + 箭头 + 样式」）。
 * ⚠️ 触发区用**两侧各自的 Button 组件**（原生 <button> 会引入 reset.css 差异，
 *    见 react/upload.jsx 文件头同款说明）。
 */

import { Button, Tooltip } from 'antd';

const box = (children) => <div style={{ minHeight: 280, padding: 16, width: 420 }}>{children}</div>;

const PurePanel = Tooltip._InternalPanelDoNotUseOrYouWillBeFired;

export default {
  basicOpen: () =>
    box(
      <Tooltip title="prompt text" open placement="bottom" autoAdjustOverflow={false}>
        <Button>Hover me</Button>
      </Tooltip>,
    ),

  colorful: () =>
    box(
      <div style={{ display: 'flex', gap: 8 }}>
        <Tooltip title="preset" color="blue" open placement="bottom" autoAdjustOverflow={false}>
          <Button>blue</Button>
        </Tooltip>
        <Tooltip title="custom" color="#f50" open placement="top">
          <Button>#f50</Button>
        </Tooltip>
      </div>,
    ),

  purePanel: () =>
    box(
      <div style={{ padding: 16 }}>
        <PurePanel title="Hello Pure Panel!" />
        <PurePanel title="Hello Pink!" color="pink" style={{ marginTop: 16 }} />
      </div>,
    ),
};
