/**
 * React 侧（antd 6.6.4）的 Anchor 视觉用例。与 `vue/anchor.js` 逐条对应。
 *
 * ── 与其它组件的差异 ─────────────────────────────────────────────────────────
 *
 * Anchor **没有浮层**（不 portal、不需要 `getPopupContainer`）—— 它的视觉面是
 * **链接列表 + ink 指示条**，而 ink 的位置来自「当前锚点」（滚动侦测的结果）。
 *
 * 🚨 所以 `active` 用例**必须把锚点目标一起渲染出来**（`<div id="section-a">`…）：
 * `getInternalCurrentAnchor` 靠 `document.getElementById` 找目标、再量它的 `top`
 * ⇒ 没有目标就永远没有 active、ink 也永远不显示（等于没测到核心视觉面）。
 *
 * ── 两条必须钉住的东西 ───────────────────────────────────────────────────────
 *
 * 1. **字体**（`ANCHOR_BOX_STYLE`）：链接文字两侧页面的 `html` 字体栈不同。
 * 2. **固定高度**（`ANCHOR_TARGET_STYLE`）：目标块高度决定 `top` 与 ink 位置。
 */

import { Anchor, ConfigProvider } from 'antd';
import {
  ANCHOR_BOX_STYLE,
  ANCHOR_ITEMS,
  ANCHOR_NESTED_ITEMS,
  ANCHOR_TARGET_STYLE,
} from '../shared.mjs';

const box = (children, height = 220) => (
  <div style={{ ...ANCHOR_BOX_STYLE, minHeight: `${height}px` }}>{children}</div>
);

/** 锚点目标（`id` 与 `items` 的 `href` 对应）。 */
const targets = () =>
  ['a', 'b', 'c'].map((id) => <div key={id} id={`section-${id}`} style={ANCHOR_TARGET_STYLE} />);

export default {
  /** 基本形态：`affix: false`（不包 Affix ⇒ 结构最干净）。 */
  basic: () => box(<Anchor affix={false} items={ANCHOR_ITEMS} />),

  /** 默认固钉（包一层 Affix；静态帧里不固钉，但占位层结构在）。 */
  affix: () => box(<Anchor items={ANCHOR_ITEMS} />),

  /** 水平方向（`-wrapper-horizontal`，ink 是底部横条）。 */
  horizontal: () => box(<Anchor affix={false} direction="horizontal" items={ANCHOR_ITEMS} />),

  /** 嵌套 items（垂直才展开）。 */
  nested: () => box(<Anchor affix={false} items={ANCHOR_NESTED_ITEMS} />, 260),

  /**
   * 有当前锚点：**连目标一起渲染** ⇒ `handleScroll` 能命中 `#section-a`
   * ⇒ `-link-active` / `-link-title-active` / `-ink-visible` 与 ink 的几何都会出现。
   */
  active: () => (
    <div style={{ ...ANCHOR_BOX_STYLE, minHeight: '480px' }}>
      <Anchor affix={false} items={ANCHOR_ITEMS} />
      {targets()}
    </div>
  ),

  /** 语义化：四个槽都给。 */
  semantic: () => (
    <div style={{ ...ANCHOR_BOX_STYLE, minHeight: '240px' }}>
      <Anchor
        affix={false}
        items={ANCHOR_ITEMS}
        classNames={{ root: 'anchor-root-cls', item: 'anchor-item-cls' }}
        styles={{ root: { background: '#fafafa' }, item: { opacity: 0.9 } }}
      />
    </div>
  ),

  /** RTL。 */
  rtl: () => (
    <ConfigProvider direction="rtl">
      {box(<Anchor affix={false} items={ANCHOR_ITEMS} />)}
    </ConfigProvider>
  ),
};
