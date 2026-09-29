/**
 * React 侧（antd 6.6.4）的 Tree 视觉用例。与 vue/tree.js 逐条对应。
 * basic / directory / show-line。
 */

import { Tree } from 'antd';

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

const box = (children) => <div style={{ padding: 16, background: '#fff' }}>{children}</div>;

export default {
  basic: () =>
    box(
      <Tree
        treeData={treeData}
        defaultExpandAll
        checkable
        selectedKeys={['0-0-0']}
        checkedKeys={['0-0-1']}
      />,
    ),

  directory: () =>
    box(<Tree.DirectoryTree treeData={treeData} defaultExpandAll selectedKeys={['0-0-0']} />),

  'show-line': () =>
    box(<Tree treeData={treeData} defaultExpandAll showLine selectedKeys={['0-0-0']} />),
};
