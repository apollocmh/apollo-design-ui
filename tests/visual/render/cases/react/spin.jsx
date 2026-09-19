/**
 * React 侧（antd 6.6.4）的 Spin 视觉用例。
 *
 * 与 `render/cases/vue/spin.js` **逐条对应**：同名、同 props 语义、同文案、同数值。
 * 比出来的差异只能是实现差异，不能是用例差异。
 *
 * 这里允许 import antd —— `TESTING.md` A9 的唯一例外是测试目录（`tests/`）。
 * 发布包仍然零 React 依赖（门禁 E19）。
 *
 * ── 两条**不能**进比对的维度（与 `vue/spin.js` 同步登记）─────────────────────────
 *
 *   1. `percent="auto"` —— 时间驱动（200ms 一跳），截图时刻不确定 ⇒ 用定长
 *      `SPIN_PERCENT`（60）代替；`auto` 的语义由 L2 在假定时器下钉住。
 *   2. 四点旋转动画 —— `stabilize.mjs` 全局 `animation:none`，两侧都停在首帧，可比。
 */

import { Spin } from 'antd';

import {
  SPIN_CONTENT_STYLE,
  SPIN_FULLSCREEN_BOX_STYLE,
  SPIN_PERCENT,
  SPIN_ROW_STYLE,
  SPIN_SEMANTIC_CLASSNAMES,
  SPIN_SEMANTIC_STYLES,
  SPIN_TEXT,
} from '../shared.mjs';

/** 自定义指示器：内联 SVG（与 antd demo 的 `<LoadingOutlined />` 同形，不依赖图标库）。 */
const indicator = (
  <svg
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
    fill="none"
    focusable="false"
    aria-hidden="true"
  >
    <circle
      cx="12"
      cy="12"
      r="9"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeDasharray="42 14"
    />
  </svg>
);

const content = <div style={SPIN_CONTENT_STYLE}>{SPIN_TEXT.title}</div>;

/** 三尺寸并排的小工具。 */
const row = (children) => <div style={SPIN_ROW_STYLE}>{children}</div>;

export default {
  // ⚠️ 用 `<div>` 包一层：非嵌套 Spin 的根是 `display: inline-flex`，会让 `#stage`
  // 的高度依赖**行盒**（html 上的 `line-height`），而我们的 base CSS 与 antd 的
  // reset 在 `html { line-height }` 上不一致（antd 是 1.15，我们是 UA 默认 ≈ 1.2），
  // 于是 1px 高度漂移（实测 55 vs 56）。包一层 block div 后两边行盒都被吃成
  // 内容高度，stage 高度严格等于 inline-flex Spin 的内容高度。
  // 其它 variant（description / nested / percent …）本来就是嵌套或外面包了 row，
  // 行盒不影响，所以只在 basic 里包。
  basic: () => (
    <div style={{ lineHeight: 0 }}>
      <Spin />
    </div>
  ),

  size: () =>
    row([
      <Spin key="sm" size="small" />,
      <Spin key="md" size="medium" />,
      <Spin key="lg" size="large" />,
    ]),

  description: () =>
    row([
      <Spin key="sm" size="small" description={SPIN_TEXT.description}>
        {content}
      </Spin>,
      <Spin key="md" description={SPIN_TEXT.description}>
        {content}
      </Spin>,
      <Spin key="lg" size="large" description={SPIN_TEXT.description}>
        {content}
      </Spin>,
    ]),

  nested: () =>
    row([
      // 转（指示器 + 文案 + 被遮住的内容）
      <Spin key="on" description={SPIN_TEXT.description}>
        {content}
      </Spin>,
      // 不转（内容正常显示，指示器整体不渲染）
      <Spin key="off" spinning={false} description={SPIN_TEXT.description}>
        {content}
      </Spin>,
    ]),

  'custom-indicator': () =>
    row([
      <Spin key="sm" indicator={indicator} size="small" />,
      <Spin key="md" indicator={indicator} />,
      <Spin key="lg" indicator={indicator} size="large" />,
    ]),

  percent: () =>
    row([
      <Spin key="sm" percent={SPIN_PERCENT} size="small" />,
      <Spin key="md" percent={SPIN_PERCENT} />,
      <Spin key="lg" percent={SPIN_PERCENT} size="large" />,
    ]),

  // ⚠️ 外层盒子的 `transform` 给 fixed 的建立包含块 —— 理由见 shared.mjs
  fullscreen: () => (
    <div style={SPIN_FULLSCREEN_BOX_STYLE}>
      <Spin fullscreen description={SPIN_TEXT.description} />
    </div>
  ),

  semantic: () => (
    <Spin
      classNames={SPIN_SEMANTIC_CLASSNAMES}
      styles={SPIN_SEMANTIC_STYLES}
      description={SPIN_TEXT.semantic}
    >
      {content}
    </Spin>
  ),
};
