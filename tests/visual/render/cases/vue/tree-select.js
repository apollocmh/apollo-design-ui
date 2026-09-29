/**
 * Vue 侧（@apollo-design/ui）的 TreeSelect 视觉用例。与 react/tree-select.jsx 逐条对应。
 * basic / multiple / checkable。
 */

import { TreeSelect } from '@apollo-design/ui';
import { h } from 'vue';

const treeData = [
  {
    title: 'parent 1',
    value: '0-0',
    children: [
      { title: 'leaf 1', value: '0-0-0' },
      { title: 'leaf 2', value: '0-0-1' },
    ],
  },
  { title: 'parent 2', value: '0-1' },
];

const box = (children) => h('div', { style: { padding: '16px', background: '#fff' } }, [children]);

export default {
  basic: () =>
    box(
      h(TreeSelect, {
        prefixCls: 'apollo-tree-select',
        treeData,
        defaultValue: '0-0-0',
        placeholder: 'Please select',
        style: { width: '280px' },
      }),
    ),

  multiple: () =>
    box(
      h(TreeSelect, {
        prefixCls: 'apollo-tree-select',
        treeData,
        multiple: true,
        defaultValue: ['0-0-0', '0-0-1'],
        maxTagCount: 2,
        placeholder: 'Please select',
        style: { width: '280px' },
      }),
    ),

  checkable: () =>
    box(
      h(TreeSelect, {
        prefixCls: 'apollo-tree-select',
        treeData,
        treeCheckable: true,
        defaultValue: ['0-0-0', '0-0-1'],
        placeholder: 'Please select',
        style: { width: '280px' },
      }),
    ),
};
