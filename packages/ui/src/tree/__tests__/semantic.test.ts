/**
 * Tree · L4 语义化槽位（G6）。
 *
 * 判据：antd `semantic.test.tsx`（5 槽：root/item/itemIcon/itemTitle/itemSwitcher）
 * + 函数形态（裁决 empty-semantic-fn = B）。index.test.ts 已覆盖对象形态落点，
 * 这里覆盖函数形态与槽位全集（icon 槽只在 showIcon + 定制 icon 时可见）。
 */

import type { DomRenderResult } from '@apollo-design/test-utils';
import { domContractTest } from '@apollo-design/test-utils';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h, nextTick } from 'vue';
import baseline from '../../../../../tests/compat/baselines/tree.dom.json';
import { ConfigProvider } from '../../config-provider';
import { DirectoryTree, Tree } from '../index';

const treeData = [
  {
    key: '0-0',
    title: 'parent',
    children: [{ key: '0-0-0', title: 'leaf' }],
  },
];

describe('Tree · 语义槽（L4）', () => {
  it('函数形态：classNames/styles 五槽全落点', async () => {
    const w = mount(Tree, {
      props: {
        treeData,
        defaultExpandAll: true,
        showIcon: true,
        icon: 'I',
        classNames: () => ({
          root: 'fn-root',
          item: 'fn-item',
          itemIcon: 'fn-icon',
          itemTitle: 'fn-title',
          itemSwitcher: 'fn-switcher',
        }),
        styles: () => ({
          root: { padding: '1px' },
          item: { margin: '2px' },
          itemTitle: { color: 'red' },
        }),
      },
    });
    await nextTick();
    expect(w.find('.fn-root').exists()).toBe(true);
    expect(w.find('.fn-item').exists()).toBe(true);
    expect(w.find('.fn-icon').exists()).toBe(true);
    expect(w.find('.fn-title').exists()).toBe(true);
    expect(w.find('.fn-switcher').exists()).toBe(true);
    expect(w.find('.fn-root').attributes('style')).toContain('padding: 1px');
    expect(w.find('.fn-item').attributes('style')).toContain('margin: 2px');
    expect(w.find('.fn-title').attributes('style')).toContain('color: red');
    w.unmount();
  });

  it('config-provider 组件级 classNames/styles 与 props 合并', async () => {
    const w = mount(
      {
        setup() {
          return () =>
            h(
              ConfigProvider,
              {
                components: {
                  tree: { classNames: { root: 'ctx-root' }, styles: { root: { padding: '9px' } } },
                },
              },
              { default: () => h(Tree, { treeData, classNames: { root: 'prop-root' } }) },
            );
        },
      },
      { global: { stubs: { teleport: true } } },
    );
    await nextTick();
    const root = w.find('.apollo-tree');
    // eslint-disable-next-line no-console
    console.log(
      'ROOT classes:',
      JSON.stringify(root.classes()),
      'style:',
      root.attributes('style'),
    );
    expect(root.classes()).toContain('ctx-root');
    expect(root.classes()).toContain('prop-root');
    expect(root.attributes('style')).toContain('padding: 9px');
    w.unmount();
  });
});

// ---------------------------------------------------------------------------
// domContractTest（与 antd 基线逐用例比对；16 用例全量）
// ---------------------------------------------------------------------------

const BP = { prefixCls: 'apollo-tree' };
const TREE_DATA = [
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

const CASES: Record<string, () => DomRenderResult> = {
  'tree:basic': () => h(Tree, { ...BP, treeData: TREE_DATA }),
  'tree:expanded': () =>
    h(Tree, { ...BP, treeData: TREE_DATA, expandedKeys: ['0-0'], defaultExpandParent: false }),
  'tree:default-expand-all': () => h(Tree, { ...BP, treeData: TREE_DATA, defaultExpandAll: true }),
  'tree:selected': () =>
    h(Tree, {
      ...BP,
      treeData: TREE_DATA,
      defaultExpandAll: true,
      selectedKeys: ['0-0-0'],
    }),
  'tree:checkable': () =>
    h(Tree, {
      ...BP,
      treeData: TREE_DATA,
      defaultExpandAll: true,
      checkable: true,
      checkedKeys: ['0-0-0'],
    }),
  'tree:check-strictly': () =>
    h(Tree, {
      ...BP,
      treeData: TREE_DATA,
      defaultExpandAll: true,
      checkable: true,
      checkStrictly: true,
      checkedKeys: { checked: ['0-0-0'], halfChecked: [] },
    }),
  'tree:show-line': () =>
    h(Tree, { ...BP, treeData: TREE_DATA, defaultExpandAll: true, showLine: true }),
  'tree:show-line-no-leaf-icon': () =>
    h(Tree, {
      ...BP,
      treeData: TREE_DATA,
      defaultExpandAll: true,
      showLine: { showLeafIcon: false },
    }),
  'tree:show-icon': () =>
    h(Tree, { ...BP, treeData: TREE_DATA, defaultExpandAll: true, showIcon: true }),
  'tree:block-node': () =>
    h(Tree, { ...BP, treeData: TREE_DATA, defaultExpandAll: true, blockNode: true }),
  'tree:field-names': () =>
    h(Tree, {
      ...BP,
      defaultExpandAll: true,
      treeData: [{ id: 'a', name: 'A', subs: [{ id: 'a1', name: 'A1' }] }] as never,
      fieldNames: { key: 'id', title: 'name', children: 'subs' },
    }),
  'tree:disabled-node': () =>
    h(Tree, {
      ...BP,
      treeData: [
        {
          title: 'p',
          key: 'p',
          children: [
            { title: 'c1', key: 'c1', disabled: true },
            { title: 'c2', key: 'c2' },
          ],
        },
      ],
      defaultExpandAll: true,
    }),
  'tree:checkable-disabled': () =>
    h(Tree, {
      ...BP,
      treeData: [
        { title: 'p', key: 'p', children: [{ title: 'c', key: 'c', disableCheckbox: true }] },
      ],
      defaultExpandAll: true,
      checkable: true,
    }),
  'tree:directory': () => h(DirectoryTree, { ...BP, treeData: TREE_DATA, defaultExpandAll: true }),
  'tree:directory-selected': () =>
    h(DirectoryTree, {
      ...BP,
      treeData: TREE_DATA,
      defaultExpandAll: true,
      selectedKeys: ['0-0-0'],
      multiple: true,
    }),
  'tree:draggable': () =>
    h(Tree, { ...BP, treeData: TREE_DATA, defaultExpandAll: true, draggable: true }),
};

domContractTest('Tree', {
  baseline,
  keepStyle: false,
  allow: {},
  render: (id) => {
    const build = CASES[id];
    if (!build) {
      throw new Error(
        `[Tree semantic.test] 基线里有用例 "${id}"，但 CASES 里没有对应构造。\n` +
          `  基线里的用例：${baseline.cases.map((c) => c.id).join(', ')}`,
      );
    }
    return build();
  },
});
