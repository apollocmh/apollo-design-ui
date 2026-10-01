/**
 * Vue 侧（@apollo-design/ui）的 Masonry 视觉用例。与 `react/masonry.jsx` 逐条对应。
 *
 * ⚠️ 与其它组件不同，本文件**不需要 `getPopupContainer`** —— Masonry 没有浮层，
 * 它的视觉面就是容器与条目的几何。
 *
 * ⚠️ 两条必须与 React 侧逐字相同的约定（理由见 `react/masonry.jsx` 的文件头）：
 * 固定宽度的盒子 + 钉住的字体 + 字面量高度。
 */

import { ConfigProvider, Masonry } from '@apollo-design/ui';
import { h } from 'vue';
import { MASONRY_BOX_STYLE, MASONRY_CARD_STYLE, MASONRY_HEIGHTS } from '../shared.mjs';

/** 与 React 侧逐字相同。 */
const buildItems = (heights = MASONRY_HEIGHTS) =>
  heights.map((height, index) => ({ key: `item-${index}`, data: height }));

const card = ({ data, index }) =>
  h('div', { style: { ...MASONRY_CARD_STYLE, height: `${data}px` } }, String(index + 1));

const box = (children) => h('div', { style: MASONRY_BOX_STYLE }, [children]);

const picker = (props) => box(h(Masonry, { itemRender: card, items: buildItems(), ...props }));

export default {
  /** 默认列数（3）+ gutter 16。 */
  basic: () => picker({ gutter: 16 }),

  /** 非对称间距：`[水平, 纵向]`。 */
  gutter: () => picker({ columns: 3, gutter: [8, 24] }),

  /** 四列。 */
  columns: () => picker({ columns: 4, gutter: 16 }),

  /** 响应式列数：**按视口**解析（mobile 1 / tablet 2 / desktop 3）。 */
  responsive: () => picker({ columns: { xs: 1, sm: 2, md: 3 }, gutter: 16 }),

  /** `fresh`：每个条目各自挂 `ResizeObserver`（不改变 DOM 结构）。 */
  fresh: () => picker({ columns: 3, gutter: 16, fresh: true }),

  /** 语义化：`classNames` / `styles` 两个槽。 */
  semantic: () =>
    picker({
      columns: 3,
      gutter: 16,
      classNames: { root: 'masonry-root-cls', item: 'masonry-item-cls' },
      styles: { root: { background: '#fafafa' }, item: { opacity: 0.8 } },
    }),

  /** RTL：根加 `-rtl` 类。 */
  rtl: () =>
    box(
      h(
        ConfigProvider,
        { direction: 'rtl' },
        {
          default: () =>
            h(Masonry, { columns: 3, gutter: 16, items: buildItems(), itemRender: card }),
        },
      ),
    ),
};
