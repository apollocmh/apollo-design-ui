/**
 * Vue 侧（@apollo-design/ui）的 Message 视觉用例。与 react/message.jsx 逐条对应。
 *
 * ⚠️ 命令式路径（`message.success(...)`）是 portal + 自动消失 ⇒ 静态截图拿不到，
 *    所以三个 variant 都用**静态面板**（`_InternalPanel*` / `_InternalList*`），
 *    这也是 L4 的目标形态。
 */

import { message } from '@apollo-design/ui';
import { h } from 'vue';

const Panel = message._InternalPanelDoNotUseOrYouWillBeFired;
const List = message._InternalListDoNotUseOrYouWillBeFired;

const stage = (children) =>
  h('div', { style: { minHeight: '240px', padding: '16px', width: '420px' } }, children);

export default {
  // 单条（success 类型 + 图标 + 文案）
  single: () => stage([h(Panel, { type: 'success', content: 'This is a success message' })]),

  // 四种类型（列表形态：几何 + 图标着色 + 行距）
  types: () =>
    stage([
      h(List, {
        items: [
          { key: '1', type: 'info', content: 'This is an info message' },
          { key: '2', type: 'success', content: 'This is a success message' },
          { key: '3', type: 'warning', content: 'This is a warning message' },
          { key: '4', type: 'error', content: 'This is an error message' },
        ],
      }),
    ]),

  // 语义槽样式（root / icon / title 三层都改）
  custom: () =>
    stage([
      h(Panel, {
        type: 'success',
        content: 'Custom semantic styles',
        styles: {
          root: {
            backgroundColor: '#f6ffed',
            border: '2px solid #95de64',
            borderRadius: '16px',
            boxShadow: '4px 4px 0 #d9f7be',
          },
          icon: { color: '#237804' },
          title: { color: '#237804', fontWeight: 600 },
        },
      }),
    ]),
};
