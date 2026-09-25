#!/usr/bin/env node
/** 生成 antd 6.6.4 App 的 DOM 基线（机械 oracle）。node … [--check] */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, '../baselines/app.dom.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antdPkg = require('antd/package.json');
const antd = require('antd');
const { App } = antd;

const BP = { prefixCls: 'apollo-app' };
const wrap = (node) =>
  h(antd.ConfigProvider, { prefixCls: 'apollo', iconPrefixCls: 'apollo-icon' }, node);

const cases = [];
const push = (id, node) => {
  cases.push({ id, html: renderToStaticMarkup(node) });
};

push('app:basic', wrap(h(App, { ...BP }, h('span', null, 'content'))));
push('app:custom-component', wrap(h(App, { ...BP, component: 'section' }, h('span', null, 'x'))));
push(
  'app:nested',
  wrap(h(App, { ...BP, message: { maxCount: 1 } }, h(App, { ...BP }, h('span', null, 'inner')))),
);

const result = {
  $schema: '../schema.json',
  component: 'app',
  antdVersion: antdPkg.version,
  generatedAt: new Date().toISOString(),
  cases,
};

if (check) {
  const existing = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
  if (JSON.stringify(existing.cases) !== JSON.stringify(cases)) {
    console.error('[baseline] app.dom.json 与当前 antd 产物不一致');
    process.exit(1);
  }
  console.log('[baseline] app: check ok,', cases.length, 'cases');
} else {
  fs.writeFileSync(OUT_FILE, `${JSON.stringify(result, null, 2)}\n`);
  console.log('[baseline] app: wrote', cases.length, 'cases →', OUT_FILE);
}
