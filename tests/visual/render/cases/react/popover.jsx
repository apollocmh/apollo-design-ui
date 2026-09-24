/**
 * React 侧（antd 6.6.4）的 Popover 视觉用例。与 vue/popover.js 逐条对应。
 *
 * ⚠️ open 受控静态帧 + placement="bottom" + autoAdjustOverflow=false 钉死落点
 *    （tooltip 期结论：autoAdjustOverflow 的翻转几何由 position 包 oracle 承担）。
 */

import { Button, Popover } from 'antd';

const box = (children) => <div style={{ minHeight: 280, padding: 16, width: 420 }}>{children}</div>;

const PurePanel = Popover._InternalPanelDoNotUseOrYouWillBeFired;

const content = (
  <div>
    <p style={{ margin: 0 }}>Content</p>
    <p style={{ margin: 0 }}>Content</p>
  </div>
);

export default {
  basicOpen: () =>
    box(
      <Popover title="Title" content={content} open placement="bottom" autoAdjustOverflow={false}>
        <Button type="primary">Hover me</Button>
      </Popover>,
    ),

  purePanel: () =>
    box(
      <div style={{ padding: 16 }}>
        <PurePanel title="Title" content={content} />
        <PurePanel
          title="Title"
          content={content}
          placement="bottomLeft"
          style={{ marginTop: 16, width: 250 }}
        />
      </div>,
    ),
};
