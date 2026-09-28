/**
 * Vue 侧（@apollo-design/ui）的 Popconfirm 视觉用例。与 react/popconfirm.jsx 逐条对应。
 */

import { Button, Popconfirm, PopconfirmPurePanel } from '@apollo-design/ui';
import { h } from 'vue';

const box = (children) =>
  h(
    'div',
    { style: { minHeight: '200px', padding: '24px', display: 'flex', alignItems: 'flex-end' } },
    children,
  );

export default {
  basic: () =>
    box(
      h(
        Popconfirm,
        {
          open: true,
          placement: 'top',
          title: 'Delete the task',
          description: 'Are you sure to delete this task?',
          okText: 'Yes',
          cancelText: 'No',
        },
        { default: () => h(Button, { danger: true }, { default: () => 'Delete' }) },
      ),
    ),

  'no-cancel': () =>
    box(
      h(
        Popconfirm,
        {
          open: true,
          placement: 'top',
          title: 'Delete the task',
          description: 'Are you sure to delete this task?',
          okText: 'Yes',
          showCancel: false,
        },
        { default: () => h(Button, { danger: true }, { default: () => 'Delete' }) },
      ),
    ),

  'render-panel': () =>
    box(
      h(PopconfirmPurePanel, {
        title: 'Delete the task',
        description: 'Are you sure to delete this task?',
        okText: 'Yes',
        cancelText: 'No',
      }),
    ),
};
