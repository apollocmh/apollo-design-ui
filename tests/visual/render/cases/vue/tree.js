/**
 * Vue 侧（@apollo-design/ui）的 Tree 视觉用例。与 react/tree.jsx 逐条对应。
 * basic / directory / show-line。
 */

import { DirectoryTree, Tree } from '@apollo-design/ui';
import { h } from 'vue';

const treeData = [
  {
    title: 'parent 1',
    key: '0-0',
    children: [
      { title: 'leaf 1', key: '0-0-0' },
      { title: 'leaf 2', key: '0-0-1' },
    ],
  },
  { title: 'parent 2', key: '0-1' },
];

const box = (children) => h('div', { style: { padding: '16px', background: '#fff' } }, children);

export default {
  basic: () =>
    box(
      h(Tree, {
        treeData,
        defaultExpandAll: true,
        checkable: true,
        selectedKeys: ['0-0-0'],
        checkedKeys: ['0-0-1'],
      }),
    ),

  directory: () =>
    box(
      h(DirectoryTree, {
        treeData,
        defaultExpandAll: true,
        selectedKeys: ['0-0-0'],
      }),
    ),

  'show-line': () =>
    box(
      h(Tree, {
        treeData,
        defaultExpandAll: true,
        showLine: true,
        selectedKeys: ['0-0-0'],
      }),
    ),
};
