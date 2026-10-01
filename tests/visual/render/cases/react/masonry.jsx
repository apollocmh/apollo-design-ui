/**
 * React 侧（antd 6.6.4）的 Masonry 视觉用例。与 `vue/masonry.js` 逐条对应。
 *
 * ── 与其它浮层组件不同的一点 ─────────────────────────────────────────────────
 *
 * Masonry **没有浮层**（不 portal、不需要 `getPopupContainer`）—— 它的视觉面就是
 * 容器与条目的**几何**。所以这里只需要一个固定宽度的盒子 + 固定高度的条目。
 *
 * ── 两条必须钉住的东西 ───────────────────────────────────────────────────────
 *
 * 1. **字体**（`MASONRY_BOX_STYLE`）：条目内容是用户渲染的，两侧页面的 `html`
 *    字体栈不同 ⇒ 不钉会让差异全落在文字上。
 * 2. **高度是字面量**（`MASONRY_HEIGHTS`）：排布由实测高度决定 ⇒ 随机值 = 每天红。
 */

import { ConfigProvider, Masonry } from 'antd';
import { MASONRY_BOX_STYLE, MASONRY_CARD_STYLE, MASONRY_HEIGHTS } from '../shared.mjs';

/** 与 Vue 侧逐字相同。 */
const buildItems = (heights = MASONRY_HEIGHTS) =>
  heights.map((height, index) => ({ key: `item-${index}`, data: height }));

const card = ({ data, index }) => (
  <div style={{ ...MASONRY_CARD_STYLE, height: `${data}px` }}>{index + 1}</div>
);

const box = (children) => <div style={MASONRY_BOX_STYLE}>{children}</div>;

const picker = (props) => box(<Masonry itemRender={card} items={buildItems()} {...props} />);

export default {
  /** 默认列数（3）+ gutter 16。 */
  basic: () => picker({ gutter: 16 }),

  /** 非对称间距：`[水平, 纵向]` —— 纵向只影响 `top`，水平影响宽度与列偏移。 */
  gutter: () => picker({ columns: 3, gutter: [8, 24] }),

  /** 四列：列宽与偏移都变（`calc((100% + g) / 4)`）。 */
  columns: () => picker({ columns: 4, gutter: 16 }),

  /** 响应式列数：**按视口**解析（mobile 1 / tablet 2 / desktop 3）。 */
  responsive: () => picker({ columns: { xs: 1, sm: 2, md: 3 }, gutter: 16 }),

  /** `fresh`：每个条目各自挂 `ResizeObserver`（**不改变 DOM 结构**，视觉应与 basic 一致）。 */
  fresh: () => picker({ columns: 3, gutter: 16, fresh: true }),

  /** 语义化：`classNames` / `styles` 两个槽（`styles.item` 要给布局让位）。 */
  semantic: () =>
    picker({
      columns: 3,
      gutter: 16,
      classNames: { root: 'masonry-root-cls', item: 'masonry-item-cls' },
      styles: { root: { background: '#fafafa' }, item: { opacity: 0.8 } },
    }),

  /** RTL：根加 `-rtl` 类（`direction: rtl`），列偏移走 `inset-inline-start`。 */
  rtl: () =>
    box(
      <ConfigProvider direction="rtl">
        <Masonry columns={3} gutter={16} items={buildItems()} itemRender={card} />
      </ConfigProvider>,
    ),
};
