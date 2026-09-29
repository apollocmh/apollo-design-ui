#!/usr/bin/env node
/**
 * tests/compat/baseline/cascader.mjs — 生成 antd 6.6.4 Cascader 的 DOM 基线
 * （机械 oracle）。
 *
 * 判据：raw trigger 协议下 SSR 只渲染裸 children；浮层列结构靠
 * `CascaderPanel`（_InternalPanelDoNotUseOrYouWillBeFired，SSR 可达的唯一完整
 * 浮层 DOM）钉 —— 列结构 / menu-item 类 / data-path-key / fieldNames 映射。
 *
 * 运行：node tests/compat/baseline/cascader.mjs [--check]
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, '../baselines/cascader.dom.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antdPkg = require('antd/package.json');
const antd = require('antd');
const { Cascader, ConfigProvider } = antd;
const PureCascader = Cascader._InternalPanelDoNotUseOrYouWillBeFired;

const BP = { prefixCls: 'apollo-cascader' };
const wrap = (node) =>
  h(ConfigProvider, { prefixCls: 'apollo', iconPrefixCls: 'apollo-icon' }, node);

const OPTIONS = [
  {
    value: 'zj',
    label: '浙江',
    children: [
      { value: 'hz', label: '杭州', children: [{ value: 'xh', label: '西湖' }] },
      { value: 'nb', label: '宁波' },
    ],
  },
  { value: 'js', label: '江苏', children: [{ value: 'nj', label: '南京' }] },
];

const cases = [];
const push = (id, node) => {
  cases.push({ id, html: renderToStaticMarkup(node) });
};

// ---- 触发元素（raw trigger：SSR 只渲染裸 children）----
push(
  'cascader:basic',
  wrap(h(Cascader, { ...BP, options: OPTIONS }, h('button', { type: 'button' }, 'target'))),
);
push(
  'cascader:open',
  wrap(
    h(
      Cascader,
      { ...BP, options: OPTIONS, open: true, id: 'cs-1' },
      h('button', { type: 'button' }, 'target'),
    ),
  ),
);
push(
  'cascader:disabled',
  wrap(
    h(
      Cascader,
      { ...BP, options: OPTIONS, open: true, disabled: true, id: 'cs-2' },
      h('button', { type: 'button' }, 'target'),
    ),
  ),
);

// ⚠️ antd 的 `CascaderPanel` SSR 输出**没有列 DOM**（列由 OptionList 运行时渲染，
// PurePanel 只渲染关闭态外壳）——列结构的契约由 L1（panel.test.ts，15 条语义判据）
// 钉，机械 oracle 只覆盖触发元素。此结论与 popover 的 PurePanel 不同（后者含内容）。

const result = {
  $schema: '../schema.json',
  component: 'cascader',
  antdVersion: antdPkg.version,
  generatedAt: new Date().toISOString(),
  cases,
};

if (check) {
  const existing = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
  const same = JSON.stringify(existing.cases) === JSON.stringify(cases);
  if (!same) {
    console.error('[baseline] cascader.dom.json 与当前 antd 产物不一致');
    process.exit(1);
  }
  console.log('[baseline] cascader: check ok,', cases.length, 'cases');
} else {
  fs.writeFileSync(OUT_FILE, `${JSON.stringify(result, null, 2)}\n`);
  console.log('[baseline] cascader: wrote', cases.length, 'cases →', OUT_FILE);
}
