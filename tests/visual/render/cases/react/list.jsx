/**
 * React 侧（antd 6.6.4）的 List 视觉用例。与 `vue/list.js` **逐条对应**。
 *
 * ── 与其它组件的差异 ─────────────────────────────────────────────────────────
 *
 * List **没有浮层**（分页不带下拉时不开浮层；`-item-action` 是行内 `<ul>`）
 * ⇒ 不需要 `getPopupContainer`。它的视觉面是**结构 + 间距**：
 * `-items` / `-item` / `-item-meta` / `-item-action` 的 padding、分割线、`-bordered` 的圆角。
 *
 * ── 两条硬约定（见 `cases/shared.mjs` 的 `LIST_BOX_STYLE`）────────────────────
 *
 * 1. **字体在用例内钉住**；2. **容器宽度 320px**。
 *
 * ── 每个变体命中的「非显然」样式面 ───────────────────────────────────────────
 *
 * | 变体 | 命中的规则 |
 * |---|---|
 * | `bordered` | `-bordered` 的 `border` + `-header`/`-footer` 的 **`calc(borderRadiusLG - lineWidth)`** 内圆角 |
 * | `vertical` | `-vertical` 的 `align-items:initial` + `-item-main` / `-item-extra` 两段式 |
 * | `grid` | `-grid .{antCls}-col > -item`（`antCls` 是 `.ant-col`！） |
 * | `pagination` | `-pagination` 的 margin + `-something-after-last-item` 的 `:last-child` 下边框 |
 * | `size` | `-lg` / `-sm` 的 item padding |
 * | `rtl` | 根 `-rtl`（逻辑属性 `margin-inline-start` 随之翻转） |
 *
 * ⚠️ **`List` 在 antd 6.6.4 里整体 deprecated** ⇒ 本用例会在控制台发一条 `console.error`。
 *    那是**上游行为**，不是本仓引入的噪音。
 * ⚠️ **每个变体都必须非空转**：写完后先
 *    `md5 tests/visual/baselines/react/list/*.png | sort` 查同哈希（PITFALLS 276）。
 */

import { ConfigProvider, List } from 'antd';
import {
  LIST_AVATAR_STYLE,
  LIST_BOX_STYLE,
  LIST_DATA,
  LIST_DATA_LONG,
  LIST_DESC,
} from '../shared.mjs';

const box = (children) => <div style={LIST_BOX_STYLE}>{children}</div>;

const avatar = () => <span style={LIST_AVATAR_STYLE} />;

/** 最简的字符项。 */
const textItem = (item) => <List.Item key={item}>{item}</List.Item>;

/** 带 Meta 的项（avatar + title + description）。 */
const metaItem = (item) => (
  <List.Item key={item}>
    <List.Item.Meta avatar={avatar()} title={item} description={LIST_DESC} />
  </List.Item>
);

/** 带 actions 的项（`<ul>` + 每项 `<li>` + 项间 `-item-action-split`）。 */
const actionItem = (item) => (
  <List.Item
    key={item}
    actions={[
      <a key="edit" href="#edit">
        edit
      </a>,
      <a key="more" href="#more">
        more
      </a>,
    ]}
  >
    {item}
  </List.Item>
);

export default {
  /** `-split` 的默认分割线 + item padding。 */
  basic: () => box(<List dataSource={LIST_DATA} renderItem={textItem} />),

  /** `Item.Meta` 的三段（avatar / title / description）+ `h4` 标题。 */
  meta: () => box(<List dataSource={LIST_DATA} renderItem={metaItem} />),

  /** `-item-action` 的 `<ul>` + `<li>` + 中间那条 `-item-action-split`。 */
  actions: () => box(<List dataSource={LIST_DATA} renderItem={actionItem} />),

  /** `-bordered` 的外框 + header/footer 的**内圆角** + `padding-inline`。 */
  bordered: () =>
    box(
      <List
        bordered
        header="Header"
        footer="Footer"
        dataSource={LIST_DATA}
        renderItem={textItem}
      />,
    ),

  /** `-vertical` + `-item-main` / `-item-extra` 两段式 + `-item-extra` 的 margin。 */
  vertical: () =>
    box(
      <List
        itemLayout="vertical"
        dataSource={LIST_DATA}
        renderItem={(item) => (
          <List.Item key={item} extra={<span>extra</span>}>
            <List.Item.Meta title={item} description={LIST_DESC} />
          </List.Item>
        )}
      />,
    ),

  /** grid：`Row` + `Col` + `-grid .ant-col > -item` 的 `margin-block-end`。 */
  grid: () =>
    box(
      <List grid={{ column: 2, gutter: 16 }} dataSource={LIST_DATA_LONG} renderItem={textItem} />,
    ),

  /** 分页 + `-something-after-last-item` 的 `:last-child` 下边框。 */
  pagination: () =>
    box(<List pagination={{ pageSize: 2 }} dataSource={LIST_DATA_LONG} renderItem={textItem} />),

  /** `-loading` + Spin 的嵌套容器 + 53px 占位块。 */
  loading: () => box(<List loading dataSource={LIST_DATA} renderItem={textItem} />),

  /** `-empty-text`（三级回退的第一级之外 —— 默认空态）。 */
  empty: () => box(<List />),

  /** `-lg` / `-sm` 的 item padding。 */
  size: () =>
    box(
      <>
        <List size="large" dataSource={LIST_DATA} renderItem={textItem} />
        <List size="small" dataSource={LIST_DATA} renderItem={textItem} />
      </>,
    ),

  /** `-rtl`（逻辑属性 `margin-inline-start` 随之翻转）。 */
  rtl: () => (
    <ConfigProvider direction="rtl">
      {box(
        <List
          itemLayout="vertical"
          dataSource={LIST_DATA}
          renderItem={(item) => (
            <List.Item
              key={item}
              actions={[
                <a key="edit" href="#edit">
                  edit
                </a>,
              ]}
              extra={<span>extra</span>}
            >
              {item}
            </List.Item>
          )}
        />,
      )}
    </ConfigProvider>
  ),
};
