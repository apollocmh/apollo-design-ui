/**
 * Vue 侧（@apollo-design/ui）的 Anchor 视觉用例。与 `react/anchor.jsx` 逐条对应。
 *
 * ⚠️ 与其它组件不同，本文件**不需要 `getPopupContainer`** —— Anchor 没有浮层。
 *
 * 🚨 **`active` 用例必须同时满足两个条件**（理由与全部细节见 `react/anchor.jsx` 的文件头，
 * 2026-10-01 实测：旧写法漏了第 2 条，基线与 `basic` 逐字节相同、用例是空转的）：
 *
 *   1. 目标元素的**视口** `top` 要 `<= offsetTop + bounds`（默认 0 / 5）——
 *      视觉用例不滚动页面，所以要用 `bounds` 把阈值抬高（目标由零高度夹具提供）；
 *   2. `affix` 不能是 `false`（除非同时给 `showInkInFixed`）—— 否则 `.{p}-fixed`
 *      上的 `display: none`（3 个类）压过 `-ink-visible`（2 个类），ink 恒被隐藏。
 *
 * ⚠️ 两条必须与 React 侧逐字相同的约定：**固定宽度的盒子 + 钉住的字体**。
 */

import { Anchor, ConfigProvider } from '@apollo-design/ui';
import { h } from 'vue';
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

const box = (children, height = 220) =>
  h('div', { style: { ...ANCHOR_BOX_STYLE, minHeight: `${height}px` } }, [children]);

/** 锚点目标夹具（零高度容器 + 绝对定位目标）。 */
const targets = () =>
  h(
    'div',
    { style: ANCHOR_TARGET_FIXTURE_STYLE },
    ANCHOR_TARGET_OFFSETS.map(([id, top]) =>
      h('div', {
        key: id,
        id: `section-${id}`,
        style: { ...ANCHOR_TARGET_ABS_STYLE, top: `${top}px` },
      }),
    ),
  );

/** 「有当前锚点」的用例：`affix` 走**默认 `true`**（ink 才显示得出来）。 */
const activeBox = ({ bounds, direction = 'vertical' }) =>
  h('div', { style: { ...ANCHOR_BOX_STYLE, minHeight: '220px' } }, [
    h(Anchor, { bounds, direction, items: ANCHOR_ITEMS }),
    targets(),
  ]);

export default {
  /** 基本形态：`affix: false`。 */
  basic: () => box(h(Anchor, { affix: false, items: ANCHOR_ITEMS })),

  /** 第 1 条链接 active。 */
  active: () => activeBox({ bounds: ANCHOR_BOUNDS_FIRST }),

  /** 第 3 条链接 active（验证 ink 的 `top` 跟着链接走）。 */
  'active-last': () => activeBox({ bounds: ANCHOR_BOUNDS_LAST }),

  /** 水平方向（无 active）。 */
  horizontal: () => box(h(Anchor, { affix: false, direction: 'horizontal', items: ANCHOR_ITEMS })),

  /** 水平 + active（ink 的 `left` / `width`）。 */
  'horizontal-active': () => activeBox({ bounds: ANCHOR_BOUNDS_FIRST, direction: 'horizontal' }),

  /** 嵌套 items。 */
  nested: () => box(h(Anchor, { affix: false, items: ANCHOR_NESTED_ITEMS }), 260),

  /** 语义化：两个槽都给。 */
  semantic: () =>
    h('div', { style: { ...ANCHOR_BOX_STYLE, minHeight: '240px' } }, [
      h(Anchor, {
        affix: false,
        items: ANCHOR_ITEMS,
        classNames: { root: 'anchor-root-cls', item: 'anchor-item-cls' },
        styles: { root: { background: '#fafafa' }, item: { opacity: 0.9 } },
      }),
    ]),

  /**
   * RTL + active。
   *
   * 🚨 **它与 `active` 逐字节相同，这是预期、不是 bug**（antd 对 Anchor 零 RTL CSS）。
   * 留着的理由与「别删」的告警见 `react/anchor.jsx` 的说明（`PITFALLS 276` 第三种情形）。
   */
  'rtl-active': () =>
    h(
      ConfigProvider,
      { direction: 'rtl' },
      { default: () => activeBox({ bounds: ANCHOR_BOUNDS_FIRST }) },
    ),
};
