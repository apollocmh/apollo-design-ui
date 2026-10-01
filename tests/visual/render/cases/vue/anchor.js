/**
 * Vue 侧（@apollo-design/ui）的 Anchor 视觉用例。与 `react/anchor.jsx` 逐条对应。
 *
 * ⚠️ 与其它组件不同，本文件**不需要 `getPopupContainer`** —— Anchor 没有浮层。
 *
 * ⚠️ 三条必须与 React 侧逐字相同的约定（理由见 `react/anchor.jsx` 的文件头）：
 * 固定宽度的盒子 + 钉住的字体 + 固定高度的锚点目标。
 * 🚨 `active` 用例**必须连锚点目标一起渲染**（否则永远没有 active、ink 也不显示）。
 */

import { Anchor, ConfigProvider } from '@apollo-design/ui';
import { h } from 'vue';
import {
  ANCHOR_BOX_STYLE,
  ANCHOR_ITEMS,
  ANCHOR_NESTED_ITEMS,
  ANCHOR_TARGET_STYLE,
} from '../shared.mjs';

const box = (children, height = 220) =>
  h('div', { style: { ...ANCHOR_BOX_STYLE, minHeight: `${height}px` } }, [children]);

/** 锚点目标（`id` 与 `items` 的 `href` 对应）。 */
const targets = () =>
  ['a', 'b', 'c'].map((id) =>
    h('div', { key: id, id: `section-${id}`, style: ANCHOR_TARGET_STYLE }),
  );

export default {
  /** 基本形态：`affix: false`。 */
  basic: () => box(h(Anchor, { affix: false, items: ANCHOR_ITEMS })),

  /** 默认固钉。 */
  affix: () => box(h(Anchor, { items: ANCHOR_ITEMS })),

  /** 水平方向。 */
  horizontal: () => box(h(Anchor, { affix: false, direction: 'horizontal', items: ANCHOR_ITEMS })),

  /** 嵌套 items。 */
  nested: () => box(h(Anchor, { affix: false, items: ANCHOR_NESTED_ITEMS }), 260),

  /** 有当前锚点（连目标一起渲染）。 */
  active: () =>
    h('div', { style: { ...ANCHOR_BOX_STYLE, minHeight: '480px' } }, [
      h(Anchor, { affix: false, items: ANCHOR_ITEMS }),
      ...targets(),
    ]),

  /** 语义化：四个槽都给。 */
  semantic: () =>
    h('div', { style: { ...ANCHOR_BOX_STYLE, minHeight: '240px' } }, [
      h(Anchor, {
        affix: false,
        items: ANCHOR_ITEMS,
        classNames: { root: 'anchor-root-cls', item: 'anchor-item-cls' },
        styles: { root: { background: '#fafafa' }, item: { opacity: 0.9 } },
      }),
    ]),

  /** RTL。 */
  rtl: () =>
    h(
      ConfigProvider,
      { direction: 'rtl' },
      { default: () => box(h(Anchor, { affix: false, items: ANCHOR_ITEMS })) },
    ),
};
