/**
 * React 侧（antd 6.6.4）的 Breadcrumb 视觉用例。与 `vue/breadcrumb.js` 逐条对应。
 *
 * ── 与其它组件的差异 ─────────────────────────────────────────────────────────
 *
 * Breadcrumb **没有浮层**（`menu` 项虽然用 `Dropdown`，但静态帧里浮层不展开、不 portal）
 * ⇒ 不需要 `getPopupContainer`。它的视觉面是**一行文字 + 分隔符 + 可选图标**。
 *
 * ── 两条必须钉住的东西 ───────────────────────────────────────────────────────
 *
 * 1. **字体**（`BREADCRUMB_BOX_STYLE`）：`.{p}-link` 是文字，两侧页面的 `html`
 *    字体栈不同 ⇒ 不钉的话差异全落在文字上。
 * 2. **容器宽度 320px**（比最小视口 375px 窄）：三个视口下容器宽度一致；同时内容
 *    **不会换行** —— `ol` 是 `flex-wrap: wrap`，而换行位置取决于文字度量，
 *    一旦换行差异会从「一个字」放大成「整段错位」。
 *
 * ── 三个必须命中的「非显然」样式面 ───────────────────────────────────────────
 *
 * | 变体 | 命中的规则 |
 * |---|---|
 * | `with-icon` | `.{p}-link > svg`（裸 svg）+ `.{p}-link > svg + span` |
 * | `overlay` | `.{p}-overlay-link` 三件套 + `> .apollo-icon` 的字号/间距 |
 * | `rtl` | `.{p}.{p}-rtl { direction: rtl }` —— **与 anchor 不同：这里有真实 CSS** |
 *
 * ⚠️ **图标用「两侧同一份内联 `<svg>` 替身」**（`BREADCRUMB_ICON_*`）：
 * 视觉层只链接 `theme` + `ui` 两个 workspace 包 ⇒ **用例文件**里
 * import `@apollo-design/icons` 解析不到。裸 `<svg>` 正好命中 `-link > svg` 那条
 * 「第三方图标」规则（`.apollo-icon` 的 reset 够不到它）。
 */

import { Breadcrumb, ConfigProvider } from 'antd';
import {
  BREADCRUMB_BOX_STYLE,
  BREADCRUMB_ICON_ITEMS,
  BREADCRUMB_ICON_PATH,
  BREADCRUMB_ICON_SVG_PROPS,
  BREADCRUMB_ITEMS,
  BREADCRUMB_MENU_ITEMS,
  BREADCRUMB_PARAMS,
  BREADCRUMB_PATH_ITEMS,
  BREADCRUMB_SEPARATOR_ITEMS,
} from '../shared.mjs';

const box = (children) => <div style={BREADCRUMB_BOX_STYLE}>{children}</div>;

/** 「图标 + 文字」的 title（两侧同一份结构）。 */
const iconTitle = (text) => (
  <>
    <svg aria-hidden="true" {...BREADCRUMB_ICON_SVG_PROPS}>
      <path d={BREADCRUMB_ICON_PATH} />
    </svg>
    <span>{text}</span>
  </>
);

export default {
  /** 3 项：前两项 `<a href>`、末项 `<span>`；默认分隔符 `/`。 */
  basic: () => box(<Breadcrumb items={BREADCRUMB_ITEMS} />),

  /** 每项「裸 svg + span」⇒ 命中 `-link > svg` 与 `> svg + span` 两条规则。 */
  'with-icon': () =>
    box(
      <Breadcrumb
        items={BREADCRUMB_ICON_ITEMS.map((item) => ({ ...item, title: iconTitle(item.title) }))}
      />,
    ),

  /** `separator` prop 覆盖默认值。 */
  separator: () => box(<Breadcrumb separator=">" items={BREADCRUMB_ITEMS} />),

  /** `type: 'separator'` 的显式分隔符 ⇒ 与「注入的分隔符」并存。 */
  'separator-item': () => box(<Breadcrumb items={BREADCRUMB_SEPARATOR_ITEMS} />),

  /** `params`：`title` 里的 `:id` 被替换成 `7`（`List :id` → `List 7`，**像素可见**）。 */
  'with-params': () => box(<Breadcrumb params={BREADCRUMB_PARAMS} items={BREADCRUMB_PATH_ITEMS} />),

  /** 带 `menu` 的项 ⇒ Dropdown 包一层 `-overlay-link` + 渲染 `dropdownIcon`。 */
  overlay: () => box(<Breadcrumb items={BREADCRUMB_MENU_ITEMS} />),

  /** 语义化三槽（`root` / `item` / `separator`）。 */
  semantic: () => (
    <div style={{ ...BREADCRUMB_BOX_STYLE, minHeight: '40px' }}>
      <Breadcrumb
        items={BREADCRUMB_ITEMS}
        classNames={{
          root: 'demo-breadcrumb-root',
          item: 'demo-breadcrumb-item',
          separator: 'demo-breadcrumb-separator',
        }}
        styles={{ root: { background: '#fafafa' } }}
      />
    </div>
  ),

  /** RTL：根上会多 `-rtl` 类，样式里**真的**有 `direction: rtl`（与 anchor 不同）。 */
  rtl: () => (
    <ConfigProvider direction="rtl">{box(<Breadcrumb items={BREADCRUMB_ITEMS} />)}</ConfigProvider>
  ),
};
