/**
 * React 侧（antd 6.6.4）的 Anchor 视觉用例。与 `vue/anchor.js` 逐条对应。
 *
 * ── 与其它组件的差异 ─────────────────────────────────────────────────────────
 *
 * Anchor **没有浮层**（不 portal、不需要 `getPopupContainer`）—— 它的视觉面是
 * **链接列表 + ink 指示条**，而 ink 的位置来自「当前锚点」（滚动侦测的结果）。
 *
 * 🚨 **`active` 用例必须同时满足两个条件**，否则 ink 永远不显示、用例是空转的
 * （2026-10-01 实测踩过：旧写法只满足了第 1 条，基线与 `basic` 逐字节相同）：
 *
 *   1. **必须有锚点目标**：`getInternalCurrentAnchor` 靠 `document.getElementById`
 *      找目标，再用 `getOffsetTop(target, window)` 取它的**视口** `top`，判据是
 *      `targetTop <= offsetTop + bounds`（`offsetTop` 默认 0、`bounds` 默认 5）。
 *      视觉用例**不滚动页面**，所以把目标放在锚点**下方**时它们的 top 全都大于阈值
 *      ⇒ 没有任何链接是 active。
 *      对策：用 `bounds` 把阈值抬高（目标由 `ANCHOR_TARGET_*` 夹具提供，见下）。
 *   2. **`affix` 不能是 `false`（除非同时给 `showInkInFixed`）**：
 *      `.{p}-fixed` 的条件是 `!affix && !showInkInFixed`，而 CSS 里
 *      `.{p}-fixed .{p}-ink.{p}-ink { display: none }` 是 **3 个类**，
 *      压得过 `.{p}-ink-visible`（2 个类）⇒ 带 `-fixed` 时 ink 恒被隐藏。
 *
 * ── 锚点目标夹具 ─────────────────────────────────────────────────────────────
 *
 * 目标只用来**驱动滚动侦测**，本身不该出现在截图里（它的像素会淹没真正要比的 ink）。
 * 所以目标放在一个 `height: 0; overflow: hidden` 的容器里、用 `position: absolute`
 * 拉开 600px（见 `shared.mjs` 的 `ANCHOR_TARGET_*`）——容器不占高度、目标被裁掉，
 * 而 `getBoundingClientRect()` 照样给出真实 top。这样：
 *
 *   目标的 top ≈ 106 / 706 / 1306  ⇒  `bounds: 400` 只命中第 1 条（margin 294px），
 *   `bounds: 2000` 三条全命中、`reduce` 取 top 最大者 ⇒ 第 3 条 active。
 *   阈值与实测值差得远 ⇒ 布局小漂移不会让「谁 active」悄悄换人。
 *
 * ── 一条必须钉住的东西 ───────────────────────────────────────────────────────
 *
 * **字体**（`ANCHOR_BOX_STYLE`）：链接文字两侧页面的 `html` 字体栈不同。
 */

import { Anchor, ConfigProvider } from 'antd';
import {
  ANCHOR_BOUNDS_FIRST,
  ANCHOR_BOUNDS_LAST,
  ANCHOR_BOX_STYLE,
  ANCHOR_ITEMS,
  ANCHOR_NESTED_ITEMS,
  ANCHOR_TARGET_ABS_STYLE,
  ANCHOR_TARGET_FIXTURE_STYLE,
  ANCHOR_TARGET_OFFSETS,
} from '../shared.mjs';

const box = (children, height = 220) => (
  <div style={{ ...ANCHOR_BOX_STYLE, minHeight: `${height}px` }}>{children}</div>
);

/**
 * 锚点目标夹具：零高度容器 + 绝对定位目标（见文件头）。
 *
 * ⚠️ `width` 必须非 0 —— `getOffsetTop` 里有 `if (rect.width || rect.height)` 分支，
 * 两者都为 0 时它直接返回 `rect.top`（行为不同）。
 */
const targets = () => (
  <div style={ANCHOR_TARGET_FIXTURE_STYLE}>
    {ANCHOR_TARGET_OFFSETS.map(([id, top]) => (
      <div key={id} id={`section-${id}`} style={{ ...ANCHOR_TARGET_ABS_STYLE, top: `${top}px` }} />
    ))}
  </div>
);

/**
 * 「有当前锚点」的用例。
 *
 * 🚨 `affix` **不给**（走默认 `true`）—— 这是让 ink 显示出来的前提（见文件头第 2 条）。
 * 想要「不包 Affix」的形态看 `basic` / `nested` / `semantic`。
 */
const activeBox = ({ bounds, direction = 'vertical' }) => (
  <div style={{ ...ANCHOR_BOX_STYLE, minHeight: '220px' }}>
    <Anchor bounds={bounds} direction={direction} items={ANCHOR_ITEMS} />
    {targets()}
  </div>
);

export default {
  /** 基本形态：`affix: false`（不包 Affix ⇒ 结构最干净）。 */
  basic: () => box(<Anchor affix={false} items={ANCHOR_ITEMS} />),

  /** 第 1 条链接 active ⇒ `-link-active` / `-link-title-active`（变蓝）+ ink 竖条。 */
  active: () => activeBox({ bounds: ANCHOR_BOUNDS_FIRST }),

  /** 第 3 条链接 active ⇒ 验证 ink 的 `top` 跟着链接走（不是钉在开头）。 */
  'active-last': () => activeBox({ bounds: ANCHOR_BOUNDS_LAST }),

  /** 水平方向（无 active）：`-wrapper-horizontal`，ink 是底部横条。 */
  horizontal: () => box(<Anchor affix={false} direction="horizontal" items={ANCHOR_ITEMS} />),

  /** 水平 + active：ink 走**另一条代码路径**（`left` / `width` 由 JS 实测后写死）。 */
  'horizontal-active': () => activeBox({ bounds: ANCHOR_BOUNDS_FIRST, direction: 'horizontal' }),

  /** 嵌套 items（垂直才展开）。 */
  nested: () => box(<Anchor affix={false} items={ANCHOR_NESTED_ITEMS} />, 260),

  /** 语义化：两个槽都给。 */
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

  /**
   * RTL + active。
   *
   * 🚨 **它与 `active` 逐字节相同，这是预期、不是 bug**（2026-10-01 用 `md5` 核对过）：
   * antd 对 Anchor 的 RTL 支持**只有 wrapper 上的 `-rtl` 类**，`style/index.ts` 里
   * **没有任何** `direction: 'rtl'` 规则（对比 typography / input-number / masonry
   * 都有 `direction: 'rtl'` 样式块）⇒ 像素上必然是 no-op。
   *
   * ⚠️ **那为什么还留着**：它是 L6 里**唯一**渲染 `-rtl` 态的用例，守的是
   * 「**不许擅自加 antd 没有的 RTL CSS**」—— 加一条 `.{p}-rtl { direction: rtl }`
   * 会让本用例偏离自己的基线，而 L4 的 `anchor:rtl` 只钉类名、钉不住 CSS。
   * 所以**别因为「看起来重复」删掉它**（`PITFALLS 276` 的第三种情形）。
   *
   * ⚠️ 也不要单独立一个「RTL 无 active」的用例：那种用例与 `basic` 逐字节相同，
   * 且**没有任何**独有信号（`-rtl` 类在 L4 已被钉住）⇒ 那才是真空转，已删。
   */
  'rtl-active': () => (
    <ConfigProvider direction="rtl">{activeBox({ bounds: ANCHOR_BOUNDS_FIRST })}</ConfigProvider>
  ),
};
