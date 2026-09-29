#!/usr/bin/env node
/**
 * tests/compat/baseline/tree.mjs — 生成 antd 6.6.4 Tree 的 DOM 基线（机械 oracle）。
 *
 * Tree 是**纯同步渲染**组件（无 Portal / 无渲染门）⇒ Tree 本体 SSR 可达，
 * 与 tour 不同：树节点、展开态、勾选态、DirectoryTree 变体全部直接钉。
 * MotionTreeNode 的哨兵动画容器在 SSR 期不出现（motion diff 走 layout effect）。
 *
 * 运行：node tests/compat/baseline/tree.mjs [--check]
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, '../baselines/tree.dom.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antdPkg = require('antd/package.json');
const antd = require('antd');
const { Tree, ConfigProvider } = antd;
const DirectoryTree = Tree.DirectoryTree;

const BP = { prefixCls: 'apollo-tree' };
const wrap = (node) =>
  h(ConfigProvider, { prefixCls: 'apollo', iconPrefixCls: 'apollo-icon' }, node);

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

const cases = [];
const push = (id, node) => {
  cases.push({ id, html: renderToStaticMarkup(node) });
};

// ---- 基本形态 ----
push('tree:basic', wrap(h(Tree, { ...BP, treeData })));
push(
  'tree:expanded',
  wrap(h(Tree, { ...BP, treeData, expandedKeys: ['0-0'], defaultExpandParent: false })),
);
push('tree:default-expand-all', wrap(h(Tree, { ...BP, treeData, defaultExpandAll: true })));
push(
  'tree:selected',
  wrap(h(Tree, { ...BP, treeData, defaultExpandAll: true, selectedKeys: ['0-0-0'] })),
);

// ---- 勾选 ----
push(
  'tree:checkable',
  wrap(
    h(Tree, { ...BP, treeData, defaultExpandAll: true, checkable: true, checkedKeys: ['0-0-0'] }),
  ),
);
push(
  'tree:check-strictly',
  wrap(
    h(Tree, {
      ...BP,
      treeData,
      defaultExpandAll: true,
      checkable: true,
      checkStrictly: true,
      checkedKeys: { checked: ['0-0-0'], halfChecked: [] },
    }),
  ),
);

// ---- 外观 ----
push('tree:show-line', wrap(h(Tree, { ...BP, treeData, defaultExpandAll: true, showLine: true })));
push(
  'tree:show-line-no-leaf-icon',
  wrap(h(Tree, { ...BP, treeData, defaultExpandAll: true, showLine: { showLeafIcon: false } })),
);
push('tree:show-icon', wrap(h(Tree, { ...BP, treeData, defaultExpandAll: true, showIcon: true })));
push(
  'tree:block-node',
  wrap(h(Tree, { ...BP, treeData, defaultExpandAll: true, blockNode: true })),
);
push(
  'tree:field-names',
  wrap(
    h(Tree, {
      ...BP,
      defaultExpandAll: true,
      treeData: [{ id: 'a', name: 'A', subs: [{ id: 'a1', name: 'A1' }] }],
      fieldNames: { key: 'id', title: 'name', children: 'subs' },
    }),
  ),
);

// ---- 禁用 / 加载 ----
push(
  'tree:disabled-node',
  wrap(
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
  ),
);
push(
  'tree:checkable-disabled',
  wrap(
    h(Tree, {
      ...BP,
      treeData: [
        { title: 'p', key: 'p', children: [{ title: 'c', key: 'c', disableCheckbox: true }] },
      ],
      defaultExpandAll: true,
      checkable: true,
    }),
  ),
);

// ---- DirectoryTree ----
push('tree:directory', wrap(h(DirectoryTree, { ...BP, treeData, defaultExpandAll: true })));
push(
  'tree:directory-selected',
  wrap(
    h(DirectoryTree, {
      ...BP,
      treeData,
      defaultExpandAll: true,
      selectedKeys: ['0-0-0'],
      multiple: true,
    }),
  ),
);

// ---- 拖拽（把手 + draggable 属性）----
push('tree:draggable', wrap(h(Tree, { ...BP, treeData, defaultExpandAll: true, draggable: true })));

const result = {
  $schema: '../schema.json',
  component: 'tree',
  antdVersion: antdPkg.version,
  generatedAt: new Date().toISOString(),
  cases,
};

if (check) {
  const existing = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
  const same = JSON.stringify(existing.cases) === JSON.stringify(cases);
  if (!same) {
    console.error('[baseline] tree.dom.json 与当前 antd 产物不一致');
    process.exit(1);
  }
  console.log('[baseline] tree: check ok,', cases.length, 'cases');
} else {
  fs.writeFileSync(OUT_FILE, `${JSON.stringify(result, null, 2)}\n`);
  console.log('[baseline] tree: wrote', cases.length, 'cases →', OUT_FILE);
}
