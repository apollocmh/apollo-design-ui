#!/usr/bin/env node
/**
 * tests/compat/baseline/menu.mjs — 生成 antd 6.6.4 Menu 的 DOM 基线
 * （机械 oracle）。
 *
 * 判据（docs/analysis/menu.md §2）：
 * - vertical/inline：SSR 全渲染（item/divider/group/submenu 结构）；
 * - horizontal：rc-overflow 的 SSR 路径（containerWidth 未知 ⇒ responsive
 *   截断 ⇒ 空 ul + overflowed-indicator 不显示）；
 * - MeasureProvider 双渲染是 Vue 侧实现细节（React 无），不进契约 ——
 *   两侧各自渲染触发元素本体，diff 由 dom-contract 的对称归一处理。
 *
 * 运行：node tests/compat/baseline/menu.mjs [--check]
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, '../baselines/menu.dom.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antdPkg = require('antd/package.json');
const antd = require('antd');
const { Menu } = antd;

const BP = { prefixCls: 'apollo-menu' };
const wrap = (node) =>
  h(antd.ConfigProvider, { prefixCls: 'apollo', iconPrefixCls: 'apollo-icon' }, node);

const items = [
  { key: '1', label: 'One' },
  { key: '2', label: 'Two', disabled: true },
  { type: 'divider', key: 'd1' },
  {
    key: 'sub1',
    label: 'Sub',
    children: [
      { key: '3', label: 'Three' },
      { key: 'sub2', label: 'Inner', children: [{ key: '4', label: 'Four' }] },
    ],
  },
  { type: 'group', key: 'g1', label: 'Group', children: [{ key: '5', label: 'Five' }] },
];

const cases = [];
const push = (id, node) => {
  const html = renderToStaticMarkup(node);
  cases.push({ id, html });
};

push('menu:vertical', wrap(h(Menu, { ...BP, items, defaultOpenKeys: ['sub1'], mode: 'vertical' })));
push('menu:inline', wrap(h(Menu, { ...BP, items, defaultOpenKeys: ['sub1'], mode: 'inline' })));
push(
  'menu:inline-collapsed',
  wrap(h(Menu, { ...BP, items, mode: 'inline', inlineCollapsed: true })),
);
push('menu:horizontal', wrap(h(Menu, { ...BP, items, mode: 'horizontal' })));
push(
  'menu:dark',
  wrap(h(Menu, { ...BP, items, defaultOpenKeys: ['sub1'], mode: 'inline', theme: 'dark' })),
);
push('menu:selected', wrap(h(Menu, { ...BP, items: items.slice(0, 2), selectedKeys: ['1'] })));

const result = {
  $schema: '../schema.json',
  component: 'menu',
  antdVersion: antdPkg.version,
  generatedAt: new Date().toISOString(),
  cases,
};

if (check) {
  const existing = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
  const same = JSON.stringify(existing.cases) === JSON.stringify(cases);
  if (!same) {
    console.error('[baseline] menu.dom.json 与当前 antd 产物不一致');
    process.exit(1);
  }
  console.log('[baseline] menu: check ok,', cases.length, 'cases');
} else {
  fs.writeFileSync(OUT_FILE, `${JSON.stringify(result, null, 2)}\n`);
  console.log('[baseline] menu: wrote', cases.length, 'cases →', OUT_FILE);
}
