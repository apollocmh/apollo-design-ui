/**
 * React 侧（antd 6.6.4）的 TreeSelect 视觉用例。与 vue/tree-select.js 逐条对应。
 * basic / multiple / checkable。
 */

import { TreeSelect } from 'antd';

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

const box = (children) => <div style={{ padding: 16, background: '#fff' }}>{children}</div>;

const BP = { prefixCls: 'apollo-tree-select' };

export default {
  basic: () =>
    box(
      <TreeSelect
        {...BP}
        treeData={treeData}
        defaultValue="0-0-0"
        placeholder="Please select"
        style={{ width: 280 }}
      />,
    ),

  multiple: () =>
    box(
      <TreeSelect
        {...BP}
        treeData={treeData}
        multiple
        defaultValue={['0-0-0', '0-0-1']}
        maxTagCount={2}
        placeholder="Please select"
        style={{ width: 280 }}
      />,
    ),

  checkable: () =>
    box(
      <TreeSelect
        {...BP}
        treeData={treeData}
        treeCheckable
        defaultValue={['0-0-0', '0-0-1']}
        placeholder="Please select"
        style={{ width: 280 }}
      />,
    ),
};
