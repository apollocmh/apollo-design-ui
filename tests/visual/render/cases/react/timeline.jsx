/**
 * React 侧（antd 6.6.4）的 Timeline 视觉用例。与 `vue/timeline.js` **逐条对应**。
 *
 * ── 与其它组件的差异 ─────────────────────────────────────────────────────────
 *
 * Timeline **没有浮层**（没有 dropdown / tooltip / popover 的静态帧）⇒ 不需要
 * `getPopupContainer`。⚠️ 它**也没有自己的 DOM** —— 渲染体是 `<Steps type="dot" />`，
 * 所以本用例同时拍到 Steps 的产物（这是**有意**的：Timeline 的视觉面就是
 * 「Steps 的 DOM + Timeline 的样式覆盖」）。
 *
 * ── 两条硬约定（见 `cases/shared.mjs` 的 `TIMELINE_BOX_STYLE`）────────────────
 *
 * 1. **字体在用例内钉住**；2. **容器宽度 320px**。
 *
 * ── 每个变体命中的「非显然」样式面 ───────────────────────────────────────────
 *
 * | 变体 | 命中的规则 |
 * |---|---|
 * | `alternate` | `-layout-alternate` 的**左右分栏**（`head-span-ptg` + `alternate-gap`） |
 * | `horizontal` | `-horizontal` 的**绝对定位体系**（`left:50%` + `translateX(-50%)`） |
 * | `title-span` | 内联 `--{root}-timeline-head-span`（24 栅格制） |
 * | `colors` | 预设色的**三连类**（`-item.-item.-item-color-x`）与任意色值的内联变量 |
 * | `loading` | `status: process` + `LoadingOutlined` |
 * | `pending` | 追加项的 `status: process` + 默认加载图标 |
 *
 * ⚠️ **每个变体都必须非空转**：写完后先
 *    `md5 tests/visual/baselines/react/timeline/*.png | sort` 查同哈希（PITFALLS 276）。
 */

import { ConfigProvider, Timeline } from 'antd';
import {
  TIMELINE_BOX_STYLE,
  TIMELINE_ITEMS,
  TIMELINE_ITEMS_ALTERNATE,
  TIMELINE_ITEMS_NO_TITLE,
} from '../shared.mjs';

const box = (children) => <div style={TIMELINE_BOX_STYLE}>{children}</div>;

export default {
  /** 纵向 + 有 title ⇒ **交错**（默认 `mode` 兜底 `start`，但纵向有 title 就交错）。 */
  basic: () => box(<Timeline items={TIMELINE_ITEMS} />),

  /** 纵向 + **无** title ⇒ 不交错（`layoutAlternate` 的第二条判据为假）。 */
  verticalSingle: () => box(<Timeline items={TIMELINE_ITEMS_NO_TITLE} />),

  /** 显式 `alternate`（4 条 ⇒ 奇偶各半）。 */
  alternate: () => box(<Timeline mode="alternate" items={TIMELINE_ITEMS_ALTERNATE} />),

  /** 横向：一整套绝对定位（`left:50%` + `translateX(-50%)`）。 */
  horizontal: () => box(<Timeline orientation="horizontal" items={TIMELINE_ITEMS_ALTERNATE} />),

  /** `titleSpan` 的**数字**分支（24 栅格制 ⇒ `head-span` 内联变量）。 */
  titleSpanNumber: () => box(<Timeline titleSpan={8} items={TIMELINE_ITEMS} />),

  /** `titleSpan` 的**字符串**分支（百分比 ⇒ `head-span-ptg` 内联变量）。 */
  titleSpanString: () => box(<Timeline titleSpan="40%" items={TIMELINE_ITEMS} />),

  /** 预设色（**三连类**）+ 任意色值（内联 CSS 变量）。 */
  colors: () =>
    box(
      <Timeline
        items={[
          { key: 'a', title: 'blue', content: 'c', color: 'blue' },
          { key: 'b', title: 'red', content: 'c', color: 'red' },
          { key: 'c', title: 'green', content: 'c', color: 'green' },
          { key: 'd', title: 'gray', content: 'c', color: 'gray' },
          { key: 'e', title: 'custom', content: 'c', color: '#00f' },
        ]}
      />,
    ),

  /** `loading` ⇒ `status: process` + `LoadingOutlined`。 */
  loading: () =>
    box(
      <Timeline
        items={[
          { key: 'a', title: 'loading', content: 'c', loading: true },
          { key: 'b', title: 'done', content: 'c' },
        ]}
      />,
    ),

  /** `pending` 追加一项（默认加载图标）。 */
  pending: () => box(<Timeline pending="Recording..." items={TIMELINE_ITEMS_NO_TITLE} />),

  /** `reverse` ⇒ 项顺序反转（rail 的 status 也随之改跟当前项）。 */
  reverse: () => box(<Timeline reverse items={TIMELINE_ITEMS} />),

  /** `variant` 的另一个取值（透传给 Steps）。 */
  variantFilled: () => box(<Timeline variant="filled" items={TIMELINE_ITEMS} />),

  /** `rtl`（逻辑属性随之翻转）。⚠️ `direction` 走 ConfigProvider，不是 Timeline 的 prop。 */
  rtl: () => (
    <ConfigProvider direction="rtl">{box(<Timeline items={TIMELINE_ITEMS} />)}</ConfigProvider>
  ),
};
