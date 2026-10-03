/**
 * React 侧（antd 6.6.4）的 FloatButton 视觉用例。与 vue/float-button.js 逐条对应。
 * basic（icon-only + primary）/ shape-content（square + content）/ badge-tooltip。
 *
 * ⚠️ 三条**全部走 `_InternalPanelDoNotUseOrYouWillBeFired`（PurePanel）** —— 这是
 *    antd 自己为「在流渲染」准备的形态（`-pure`：`position: relative; inset: auto`，
 *    见 `es/float-button/style/button.js:51-54`，它排在 `-individual` 之后 ⇒ 覆盖之）。
 *
 *    原因：默认的 `-individual` 形态是 `position: fixed`（同文件 `:46-48`）
 *    ⇒ 定位到**视口**右下角，落在截图目标 `#stage` 的 boundingBox **之外**
 *    （`#stage` 只是内容高度的流式容器，见 `react.html`）⇒ 三张截图**全是空白**、
 *    md5 完全相同 ⇒ 变体空转（`KNOWN-ISSUES §1.10`）。
 *
 *    📌 与 `affix` 同判：视口级 `fixed` 的**真实定位**不进 L6（那需要真实滚动 / 整页
 *    截图），L6 比的是**外观**（尺寸 / 主色 / 形状 / badge / content）——
 *    `-pure` 相对 `-individual` 只改定位与 box-shadow，两**侧**受影响的量完全相同。
 */

import { FloatButton } from 'antd';

const Pure = FloatButton._InternalPanelDoNotUseOrYouWillBeFired;

const box = (children) => <div style={{ minHeight: 120, padding: 16, width: 480 }}>{children}</div>;

export default {
  basic: () =>
    box(
      <div style={{ display: 'flex', gap: 16 }}>
        <Pure />
        <Pure type="primary" />
        <Pure shape="square" />
      </div>,
    ),

  'shape-content': () =>
    box(
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <Pure shape="square" content="HELP INFO" />
        <Pure shape="square" icon={<span style={{ fontSize: 14 }}>?</span>} content="HELP" />
      </div>,
    ),

  'badge-tooltip': () =>
    box(
      <div style={{ display: 'flex', gap: 16 }}>
        <Pure badge={{ dot: true }} />
        <Pure badge={{ count: 5 }} />
        <Pure tooltip="title text" />
      </div>,
    ),
};
