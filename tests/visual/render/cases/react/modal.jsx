/**
 * React 侧（antd 6.6.4）的 Modal 视觉用例。与 vue/modal.js 逐条对应。
 *
 * ⚠️ 用例全部走**内联渲染**（受控 `open` + `getContainer={false}`）或 **PurePanel**：
 *    portal 出来的浮层会盖住别的组件、且动效相位不稳定（与 drawer 同判，PITFALLS 177）。
 */

import { Modal } from 'antd';

const PurePanel = Modal._InternalPanelDoNotUseOrYouWillBeFired;

const stage = (children) => (
  <div style={{ position: 'relative', minHeight: 420, width: 640, overflow: 'hidden' }}>
    {children}
  </div>
);

export default {
  // 基础：受控 open + 内联 + 标题/正文/页脚/关闭按钮
  basic: () =>
    stage(
      <Modal open getContainer={false} title="Modal Title" width={400}>
        <p>Some contents...</p>
        <p>Some contents...</p>
      </Modal>,
    ),

  // confirm 形态（静态面板：图标 + 标题 + 正文 + 两个按钮）
  // ⚠️ 正文走 **children** —— antd 的 PurePanel 在 type 分支里把 children 当 content
  //    （`content={children}`），`content` prop 被忽略
  confirm: () =>
    stage(
      <PurePanel type="confirm" title="Do you want to delete?">
        Some descriptions.
      </PurePanel>,
    ),

  // loading 骨架态（footer 强制不渲染）
  loading: () =>
    stage(
      <Modal open getContainer={false} loading title="Loading" width={400}>
        <p>Some contents...</p>
      </Modal>,
    ),
};
