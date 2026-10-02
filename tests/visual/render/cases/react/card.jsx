/**
 * React 侧（antd 6.6.4）的 Card 视觉用例。与 `vue/card.js` 逐条对应。
 *
 * ── 与其它组件的差异 ─────────────────────────────────────────────────────────
 *
 * Card **没有浮层**（`tabs` 变体的页签浮层在静态帧里不展开、不 portal）
 * ⇒ 不需要 `getPopupContainer`。它的视觉面是**四段结构**：
 * head（含 tabs）/ cover / body / actions。
 *
 * ── 两条必须钉住的东西 ───────────────────────────────────────────────────────
 *
 * 1. **字体**（`CARD_BOX_STYLE`）：卡片正文是文字，两侧页面的 `html` 字体栈不同
 *    ⇒ 不钉的话差异全落在文字上。
 * 2. **容器宽度 320px**（比最小视口 375px 窄）：三个视口下容器宽度一致；同时正文
 *    **不会换行** —— 换行位置取决于文字度量，一旦换行差异会被放大。
 *
 * ── 每个变体命中的「非显然」样式面 ───────────────────────────────────────────
 *
 * | 变体 | 命中的规则 |
 * |---|---|
 * | `actions` | `.{p}-actions > li` 的 `margin` / `:not(:last-child)` 竖分隔线 + `li` 的**内联百分比宽度** |
 * | `small` | `.{p}-small > .{p}-head` 的 `min-height` / `padding` / `font-size` 三条覆盖 |
 * | `borderless` | `.{p}:not(.{p}-bordered)` 的 `box-shadow: boxShadowTertiary` |
 * | `inner` | `.{p}-type-inner` 的 `head` 背景 `colorFillAlter` + 两组 padding |
 * | `loading` | Skeleton 的 4 行段落（`title={false}` ⇒ **没有**标题行） |
 * | `grid` | `.{p}-contain-grid` 的 `border-radius` / `body` 的 `flex-wrap` / 负 margin + `.{p}-grid` 的**五段 box-shadow** |
 * | `meta` | `.{p}-cover > *` 的圆角 + `.{p}-meta` 的负 margin / `avatar` 的 `padding-inline-end` |
 * | `tabs` | `.{p}-head .ant-tabs-top` 的负 `margin-bottom` + `-contain-tabs` 的 `padding-top` |
 * | `rtl` | `.{p}-rtl { direction: rtl }`（**有真实 CSS**，与 anchor 不同） |
 *
 * ⚠️ `-hoverable` **没有独立变体**：`:hover` 在静态帧里不触发，它的可见面只有
 * `cursor` / `transition`（截图上不可见）⇒ 必然是空转。它归 L1（类名断言）与 L4。
 */

import { Card, ConfigProvider } from 'antd';
import {
  CARD_AVATAR_STYLE,
  CARD_BOX_STYLE,
  CARD_COVER_STYLE,
  CARD_GRID_STYLE,
  CARD_META_DESCRIPTION,
  CARD_META_TITLE,
  CARD_PARAGRAPH_STYLE,
  CARD_SEMANTIC_CLASS_NAMES,
  CARD_SEMANTIC_STYLES,
  CARD_TAB_LIST,
} from '../shared.mjs';

const box = (children) => <div style={CARD_BOX_STYLE}>{children}</div>;

const para = (text) => <p style={CARD_PARAGRAPH_STYLE}>{text}</p>;

/** 正文（两侧同一份文案与结构）。 */
const body = () => [para('Card content'), para('Card content')];

const more = () => <a href="#more">More</a>;

const gridStyle = CARD_GRID_STYLE;

export default {
  /** head（title + extra）+ body。 */
  basic: () =>
    box(
      <Card title="Card title" extra={more()}>
        {body()}
      </Card>,
    ),

  /** `actions` ⇒ `<ul>` + 每项 `<li><span>`，`li` 宽度是内联 `33.33…%`。 */
  actions: () =>
    box(
      <Card
        title="Card title"
        actions={[
          <span key="a">Action A</span>,
          <span key="b">Action B</span>,
          <span key="c">Action C</span>,
        ]}
      >
        {body()}
      </Card>,
    ),

  /** `size="small"` ⇒ head 的 min-height / padding / font-size 三条覆盖 + body padding。 */
  small: () =>
    box(
      <Card size="small" title="Card title" extra={more()}>
        {body()}
      </Card>,
    ),

  /** `variant="borderless"` ⇒ 没有 `-bordered`，改用 `boxShadowTertiary`。 */
  borderless: () =>
    box(
      <Card variant="borderless" title="Card title">
        {body()}
      </Card>,
    ),

  /** `type="inner"` ⇒ head 背景变 `colorFillAlter`、字号降一档。 */
  inner: () =>
    box(
      <Card title="Card title">
        <Card type="inner" title="Inner Card title" extra={more()}>
          Inner Card content
        </Card>
      </Card>,
    ),

  /** `loading` ⇒ body 里是 Skeleton（4 行段落，`title={false}`）。 */
  loading: () =>
    box(
      <Card loading title="Card title">
        {body()}
      </Card>,
    ),

  /** `Card.Grid` ⇒ `-contain-grid`（body 变 flex wrap + 负 margin）+ 网格的五段 box-shadow。 */
  grid: () =>
    box(
      <Card title="Card Title">
        {Array.from({ length: 6 }, (_, i) => (
          <Card.Grid key={i} style={gridStyle}>
            Content
          </Card.Grid>
        ))}
      </Card>,
    ),

  /** `cover` + `Card.Meta`（avatar / title / description）。 */
  meta: () =>
    box(
      <Card cover={<div style={CARD_COVER_STYLE} />}>
        <Card.Meta
          avatar={<div style={CARD_AVATAR_STYLE} />}
          title={CARD_META_TITLE}
          description={CARD_META_DESCRIPTION}
        />
      </Card>,
    ),

  /** `tabList` ⇒ head 里的 Tabs（**全局** `.ant-tabs-top` 规则 + `-contain-tabs` 的 padding）。 */
  tabs: () =>
    box(
      <Card title="Card title" extra={more()} tabList={CARD_TAB_LIST} tabBarExtraContent={more()}>
        {body()}
      </Card>,
    ),

  /** 语义化 7 槽（`styles` 用**肉眼可见**的值，否则与 `basic` 逐字节相同）。 */
  semantic: () =>
    box(
      <Card
        title="Card title"
        extra={more()}
        classNames={CARD_SEMANTIC_CLASS_NAMES}
        styles={CARD_SEMANTIC_STYLES}
      >
        {body()}
      </Card>,
    ),

  /** RTL：根上多 `-rtl` 类，样式里**真的**有 `direction: rtl`（与 anchor 不同）。 */
  rtl: () => (
    <ConfigProvider direction="rtl">
      {box(
        <Card title="Card title" extra={more()}>
          {body()}
        </Card>,
      )}
    </ConfigProvider>
  ),
};
