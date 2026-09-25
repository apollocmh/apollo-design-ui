#!/usr/bin/env node
/** 生成 antd 6.6.4 Dropdown 的 DOM 基线（机械 oracle）。node … [--check] */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, '../baselines/dropdown.dom.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antdPkg = require('antd/package.json');
const antd = require('antd');
const { Dropdown, Button } = antd;

const BP = { prefixCls: 'apollo-dropdown' };
const wrap = (node) =>
  h(antd.ConfigProvider, { prefixCls: 'apollo', iconPrefixCls: 'apollo-icon' }, node);

const items = [
  { key: '1', label: 'One' },
  { key: '2', label: 'Two', disabled: true },
  { key: 'sub', label: 'Sub', children: [{ key: '2-1', label: 'Inner' }] },
];

const cases = [];
const push = (id, node) => {
  cases.push({ id, html: renderToStaticMarkup(node) });
};

// SSR：rc-trigger 只渲染触发元素（portal 不可见）—— 浮层 DOM 由 L1/L5/L6 承担
push(
  'dropdown:basic',
  wrap(h(Dropdown, { ...BP, menu: { items }, open: true, id: 'dd-1' }, h(Button, null, 'target'))),
);
push(
  'dropdown:placement',
  wrap(
    h(
      Dropdown,
      { ...BP, menu: { items }, open: true, placement: 'topLeft', id: 'dd-2' },
      h(Button, null, 'target'),
    ),
  ),
);
push(
  'dropdown:arrow',
  wrap(
    h(
      Dropdown,
      { ...BP, menu: { items }, open: true, arrow: true, id: 'dd-3' },
      h(Button, null, 'target'),
    ),
  ),
);
push(
  'dropdown:disabled',
  wrap(
    h(
      Dropdown,
      { ...BP, menu: { items }, open: true, disabled: true, id: 'dd-4' },
      h(Button, { disabled: true }, 'target'),
    ),
  ),
);
push('dropdown:closed', wrap(h(Dropdown, { ...BP, menu: { items } }, h(Button, null, 'target'))));

const result = {
  $schema: '../schema.json',
  component: 'dropdown',
  antdVersion: antdPkg.version,
  generatedAt: new Date().toISOString(),
  cases,
};

if (check) {
  const existing = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
  if (JSON.stringify(existing.cases) !== JSON.stringify(cases)) {
    console.error('[baseline] dropdown.dom.json 与当前 antd 产物不一致');
    process.exit(1);
  }
  console.log('[baseline] dropdown: check ok,', cases.length, 'cases');
} else {
  fs.writeFileSync(OUT_FILE, `${JSON.stringify(result, null, 2)}\n`);
  console.log('[baseline] dropdown: wrote', cases.length, 'cases →', OUT_FILE);
}
