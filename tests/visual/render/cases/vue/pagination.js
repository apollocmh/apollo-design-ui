/**
 * Vue 侧（@apollo-design/ui）的 Pagination 视觉用例。与 react/pagination.jsx 逐条对应。
 */

import { Pagination } from '@apollo-design/ui';
import { h } from 'vue';

// ⚠️ 本文件是 `.js`（rolldown 按**纯 JS** 解析）⇒ 不能写 TS 类型标注，
//    否则构建期直接 `PARSE_ERROR: Expected ',' or ')' but found ':'`（实测）。
const box = (children) =>
  h('div', { style: { padding: '16px', background: '#fff', width: '640px' } }, children);

export default {
  basic: () => box(h(Pagination, { defaultCurrent: 3, total: 50 })),

  totalText: () =>
    box(
      h(Pagination, {
        defaultCurrent: 3,
        total: 500,
        showTotal: (t) => `共 ${t} 条`,
      }),
    ),

  simple: () => box(h(Pagination, { defaultCurrent: 3, total: 500, simple: true })),

  quickJumper: () => box(h(Pagination, { defaultCurrent: 3, total: 500, showQuickJumper: true })),

  quickJumperButton: () =>
    box(h(Pagination, { defaultCurrent: 3, total: 500, showQuickJumper: { goButton: true } })),

  sizeChanger: () => box(h(Pagination, { defaultCurrent: 3, total: 500, showSizeChanger: true })),

  disabled: () => box(h(Pagination, { defaultCurrent: 3, total: 500, disabled: true })),

  large: () =>
    box(
      h(Pagination, {
        defaultCurrent: 3,
        total: 500,
        size: 'large',
        showQuickJumper: true,
      }),
    ),

  alignCenter: () =>
    box(
      h(Pagination, {
        defaultCurrent: 3,
        total: 500,
        align: 'center',
        showTotal: (t) => `${t} items`,
      }),
    ),

  lessItems: () => box(h(Pagination, { defaultCurrent: 10, total: 500, showLessItems: true })),
};
