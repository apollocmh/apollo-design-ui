#!/usr/bin/env node
/**
 * tests/compat/baseline/tree-select.mjs — 生成 antd 6.6.4 TreeSelect 的 DOM 基线
 * （机械 oracle）。
 *
 * 判据（同 cascader）：rc BaseSelect 的浮层走 portal，SSR 不可达 ⇒ 基线钉
 * **触发器 DOM**（selector / 展示值 / tag / 后缀 / aria / variant / status）。
 * 浮层树结构（treeitem / switcher / checkbox / 级联 aria）由
 * `packages/ui/src/tree-select/__tests__/tree-select.test.ts` 的结构断言钉。
 *
 * 运行：node tests/compat/baseline/tree-select.mjs [--check]
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, '../baselines/tree-select.dom.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antdPkg = require('antd/package.json');
const antd = require('antd');
const { TreeSelect, ConfigProvider } = antd;

const BP = { prefixCls: 'apollo-tree-select' };
const wrap = (node) =>
  h(ConfigProvider, { prefixCls: 'apollo', iconPrefixCls: 'apollo-icon' }, node);

const TREE_DATA = [
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

const cases = [];
const push = (id, node) => {
  cases.push({ id, html: renderToStaticMarkup(node) });
};

// ---- 触发器基本形态 ----
push('tsel:basic', wrap(h(TreeSelect, { ...BP, treeData: TREE_DATA })));
push(
  'tsel:placeholder',
  wrap(h(TreeSelect, { ...BP, treeData: TREE_DATA, placeholder: '请选择' })),
);
push(
  'tsel:value-single',
  wrap(h(TreeSelect, { ...BP, treeData: TREE_DATA, defaultValue: '0-0-0' })),
);
push(
  'tsel:value-multiple',
  wrap(
    h(TreeSelect, {
      ...BP,
      treeData: TREE_DATA,
      multiple: true,
      defaultValue: ['0-0-0', '0-1'],
    }),
  ),
);
push(
  'tsel:label-in-value',
  wrap(
    h(TreeSelect, {
      ...BP,
      treeData: TREE_DATA,
      multiple: true,
      labelInValue: true,
      defaultValue: [{ value: '0-0-0', label: 'leaf 1' }],
    }),
  ),
);
push(
  'tsel:max-tag',
  wrap(
    h(TreeSelect, {
      ...BP,
      treeData: TREE_DATA,
      multiple: true,
      maxTagCount: 1,
      defaultValue: ['0-0-0', '0-0-1', '0-1'],
    }),
  ),
);
push('tsel:open', wrap(h(TreeSelect, { ...BP, treeData: TREE_DATA, open: true, id: 'ts-1' })));
push('tsel:disabled', wrap(h(TreeSelect, { ...BP, treeData: TREE_DATA, disabled: true })));
push('tsel:status-error', wrap(h(TreeSelect, { ...BP, treeData: TREE_DATA, status: 'error' })));
push('tsel:variant-filled', wrap(h(TreeSelect, { ...BP, treeData: TREE_DATA, variant: 'filled' })));
push(
  'tsel:allow-clear',
  wrap(h(TreeSelect, { ...BP, treeData: TREE_DATA, allowClear: true, defaultValue: '0-1' })),
);
push('tsel:show-search', wrap(h(TreeSelect, { ...BP, treeData: TREE_DATA, showSearch: true })));
push('tsel:size-large', wrap(h(TreeSelect, { ...BP, treeData: TREE_DATA, size: 'large' })));

const result = {
  $schema: '../schema.json',
  component: 'tree-select',
  antdVersion: antdPkg.version,
  generatedAt: new Date().toISOString(),
  cases,
};

if (check) {
  const existing = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
  const same = JSON.stringify(existing.cases) === JSON.stringify(cases);
  if (!same) {
    console.error('[baseline] tree-select.dom.json 与当前 antd 产物不一致');
    process.exit(1);
  }
  console.log('[baseline] tree-select: check ok,', cases.length, 'cases');
} else {
  fs.writeFileSync(OUT_FILE, `${JSON.stringify(result, null, 2)}\n`);
  console.log('[baseline] tree-select: wrote', cases.length, 'cases →', OUT_FILE);
}
