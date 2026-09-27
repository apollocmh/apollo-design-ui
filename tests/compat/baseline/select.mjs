#!/usr/bin/env node
/** 生成 antd 6.6.4 Select 的 DOM 基线（机械 oracle）。node … [--check] */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, '../baselines/select.dom.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antdPkg = require('antd/package.json');
const antd = require('antd');
const { Select } = antd;

const BP = { prefixCls: 'apollo-select' };
const wrap = (node) =>
  h(antd.ConfigProvider, { prefixCls: 'apollo', iconPrefixCls: 'apollo-icon' }, node);

const options = [
  { value: 'a', label: 'Apple' },
  { value: 'b', label: 'Banana', disabled: true },
];

const cases = [];
const push = (id, node) => {
  cases.push({ id, html: renderToStaticMarkup(node) });
};

// SSR：rc-trigger 只渲染选择器；下拉 DOM 由 L1/L5/L6 承担
push('select:basic', wrap(h(Select, { ...BP, options, id: 'test-id' })));
push('select:value', wrap(h(Select, { ...BP, options, id: 'test-id', value: 'a' })));
push(
  'select:multiple',
  wrap(h(Select, { ...BP, options, id: 'test-id', mode: 'multiple', value: ['a'] })),
);
push('select:disabled', wrap(h(Select, { ...BP, options, id: 'test-id', disabled: true })));
push(
  'select:allow-clear',
  wrap(h(Select, { ...BP, options, id: 'test-id', allowClear: true, value: 'a' })),
);
push('select:show-search', wrap(h(Select, { ...BP, options, id: 'test-id', showSearch: true })));
push('select:size-small', wrap(h(Select, { ...BP, options, id: 'test-id', size: 'small' })));
push('select:size-large', wrap(h(Select, { ...BP, options, id: 'test-id', size: 'large' })));
push('select:status-error', wrap(h(Select, { ...BP, options, id: 'test-id', status: 'error' })));
push(
  'select:variant-borderless',
  wrap(h(Select, { ...BP, options, id: 'test-id', variant: 'borderless' })),
);

const result = {
  $schema: '../schema.json',
  component: 'select',
  antdVersion: antdPkg.version,
  generatedAt: new Date().toISOString(),
  cases,
};

if (check) {
  const existing = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
  if (JSON.stringify(existing.cases) !== JSON.stringify(cases)) {
    console.error('[baseline] select.dom.json 与当前 antd 产物不一致');
    process.exit(1);
  }
  console.log('[baseline] select: check ok,', cases.length, 'cases');
} else {
  fs.writeFileSync(OUT_FILE, `${JSON.stringify(result, null, 2)}\n`);
  console.log('[baseline] select: wrote', cases.length, 'cases →', OUT_FILE);
}
