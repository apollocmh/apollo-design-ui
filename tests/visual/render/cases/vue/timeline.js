/**
 * Vue 侧（@apollo-design/ui）的 Timeline 视觉用例。与 `react/timeline.jsx` **逐条对应**。
 *
 * ⚠️ 本文件**不需要 `getPopupContainer`** —— Timeline 没有浮层。
 * ⚠️ 它**也没有自己的 DOM**（是 `Steps` 的薄壳）⇒ 用例同时拍到 Steps 的产物（**有意**）。
 *
 * ⚠️ 两条必须与 React 侧逐字相同的约定（理由见 `react/timeline.jsx` 的文件头）：
 * **容器宽度 320px** + **字体在用例内钉住**。
 *
 * ⚠️ 所有 vnode **在用例函数内新建**（vnode 是一次性的 —— 复用同一个实例会撞
 * 「VNode is already mounted」）。
 */

import { ConfigProvider, Timeline } from '@apollo-design/ui';
import { h } from 'vue';
import {
  TIMELINE_BOX_STYLE,
  TIMELINE_ITEMS,
  TIMELINE_ITEMS_ALTERNATE,
  TIMELINE_ITEMS_NO_TITLE,
} from '../shared.mjs';

const box = (children) => h('div', { style: TIMELINE_BOX_STYLE }, children);

export default {
  /** 纵向 + 有 title ⇒ **交错**。 */
  basic: () => box(h(Timeline, { items: TIMELINE_ITEMS })),

  /** 纵向 + **无** title ⇒ 不交错。 */
  verticalSingle: () => box(h(Timeline, { items: TIMELINE_ITEMS_NO_TITLE })),

  /** 显式 `alternate`。 */
  alternate: () => box(h(Timeline, { mode: 'alternate', items: TIMELINE_ITEMS_ALTERNATE })),

  /** 横向。 */
  horizontal: () =>
    box(h(Timeline, { orientation: 'horizontal', items: TIMELINE_ITEMS_ALTERNATE })),

  /** `titleSpan` 的**数字**分支。 */
  titleSpanNumber: () => box(h(Timeline, { titleSpan: 8, items: TIMELINE_ITEMS })),

  /** `titleSpan` 的**字符串**分支。 */
  titleSpanString: () => box(h(Timeline, { titleSpan: '40%', items: TIMELINE_ITEMS })),

  /** 预设色（**三连类**）+ 任意色值（内联 CSS 变量）。 */
  colors: () =>
    box(
      h(Timeline, {
        items: [
          { key: 'a', title: 'blue', content: 'c', color: 'blue' },
          { key: 'b', title: 'red', content: 'c', color: 'red' },
          { key: 'c', title: 'green', content: 'c', color: 'green' },
          { key: 'd', title: 'gray', content: 'c', color: 'gray' },
          { key: 'e', title: 'custom', content: 'c', color: '#00f' },
        ],
      }),
    ),

  /** `loading`。 */
  loading: () =>
    box(
      h(Timeline, {
        items: [
          { key: 'a', title: 'loading', content: 'c', loading: true },
          { key: 'b', title: 'done', content: 'c' },
        ],
      }),
    ),

  /** `pending` 追加一项。 */
  pending: () => box(h(Timeline, { pending: 'Recording...', items: TIMELINE_ITEMS_NO_TITLE })),

  /** `reverse`。 */
  reverse: () => box(h(Timeline, { reverse: true, items: TIMELINE_ITEMS })),

  /** `variant="filled"`（透传给 Steps）。 */
  variantFilled: () => box(h(Timeline, { variant: 'filled', items: TIMELINE_ITEMS })),

  /** `rtl`（⚠️ 走 ConfigProvider，不是 Timeline 的 prop）。 */
  rtl: () =>
    h(
      ConfigProvider,
      { direction: 'rtl' },
      {
        default: () => box(h(Timeline, { items: TIMELINE_ITEMS })),
      },
    ),
};
