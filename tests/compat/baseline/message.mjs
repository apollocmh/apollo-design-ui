#!/usr/bin/env node
/** 生成 antd 6.6.4 Message 的 DOM 基线（机械 oracle）。node … [--check] */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, '../baselines/message.dom.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antdPkg = require('antd/package.json');
const antd = require('antd');
const { message } = antd;

const BP = { prefixCls: 'apollo-message' };
const wrap = (node) =>
  h(antd.ConfigProvider, { prefixCls: 'apollo', iconPrefixCls: 'apollo-icon' }, node);

/**
 * ⚠️ 命令式路径整体走 portal（SSR 不可见）⇒ L4 的目标是**静态面板**
 * （`_InternalPanel*` / `_InternalList*`），它们自己就渲染 notice/列表的完整结构。
 */
const InternalPanel = message._InternalPanelDoNotUseOrYouWillBeFired;
const InternalList = message._InternalListDoNotUseOrYouWillBeFired;

const cases = [];
const push = (id, node) => {
  cases.push({ id, html: renderToStaticMarkup(node) });
};

push('message:pure-panel', wrap(h(InternalPanel, { ...BP, type: 'success', content: 'Hello' })));
push('message:pure-panel-plain', wrap(h(InternalPanel, { ...BP, content: 'Plain' })));
push(
  'message:pure-panel-icon',
  wrap(
    h(InternalPanel, {
      ...BP,
      type: 'info',
      content: 'Custom',
      icon: h('i', { className: 'my-icon' }),
    }),
  ),
);
push(
  'message:pure-list',
  wrap(
    h(InternalList, {
      items: [
        { key: 'a', content: 'one', type: 'info' },
        { key: 'b', content: 'two', type: 'error' },
      ],
    }),
  ),
);

const result = {
  $schema: '../schema.json',
  component: 'message',
  antdVersion: antdPkg.version,
  generatedAt: new Date().toISOString(),
  cases,
};

if (check) {
  const existing = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
  if (JSON.stringify(existing.cases) !== JSON.stringify(cases)) {
    console.error('[baseline] message.dom.json 与当前 antd 产物不一致');
    process.exit(1);
  }
  console.log('[baseline] message: check ok,', cases.length, 'cases');
} else {
  fs.writeFileSync(OUT_FILE, `${JSON.stringify(result, null, 2)}\n`);
  console.log('[baseline] message: wrote', cases.length, 'cases →', OUT_FILE);
}
