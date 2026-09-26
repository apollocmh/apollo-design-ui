#!/usr/bin/env node
/** 生成 antd 6.6.4 Notification 的 DOM 基线（机械 oracle）。node … [--check] */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, '../baselines/notification.dom.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antdPkg = require('antd/package.json');
const antd = require('antd');
const { notification } = antd;

const BP = { prefixCls: 'apollo-notification' };
const wrap = (node) =>
  h(antd.ConfigProvider, { prefixCls: 'apollo', iconPrefixCls: 'apollo-icon' }, node);

/**
 * ⚠️ 命令式路径整体走 portal（SSR 不可见）⇒ L4 的目标是**静态面板**
 * （`_InternalPanel*` / `_InternalList*`）。
 */
const InternalPanel = notification._InternalPanelDoNotUseOrYouWillBeFired;
const InternalList = notification._InternalListDoNotUseOrYouWillBeFired;

const cases = [];
const push = (id, node) => {
  cases.push({ id, html: renderToStaticMarkup(node) });
};

push(
  'notification:pure-panel',
  wrap(h(InternalPanel, { ...BP, type: 'success', title: 'Hello', description: 'Desc' })),
);
push(
  'notification:pure-panel-no-close',
  wrap(h(InternalPanel, { ...BP, title: 'Plain', closable: false })),
);
push(
  'notification:pure-panel-actions',
  wrap(h(InternalPanel, { ...BP, title: 'With actions', actions: h('button', null, 'OK') })),
);
push(
  'notification:pure-list',
  wrap(
    h(InternalList, {
      items: [
        { key: 'a', title: 'one', description: 'd1', type: 'info' },
        { key: 'b', title: 'two', description: 'd2', type: 'error' },
      ],
    }),
  ),
);

const result = {
  $schema: '../schema.json',
  component: 'notification',
  antdVersion: antdPkg.version,
  generatedAt: new Date().toISOString(),
  cases,
};

if (check) {
  const existing = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
  if (JSON.stringify(existing.cases) !== JSON.stringify(cases)) {
    console.error('[baseline] notification.dom.json 与当前 antd 产物不一致');
    process.exit(1);
  }
  console.log('[baseline] notification: check ok,', cases.length, 'cases');
} else {
  fs.writeFileSync(OUT_FILE, `${JSON.stringify(result, null, 2)}\n`);
  console.log('[baseline] notification: wrote', cases.length, 'cases →', OUT_FILE);
}
