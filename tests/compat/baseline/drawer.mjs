#!/usr/bin/env node
/** 生成 antd 6.6.4 Drawer 的 DOM 基线（机械 oracle）。node … [--check] */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, '../baselines/drawer.dom.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antdPkg = require('antd/package.json');
const antd = require('antd');
const { Drawer } = antd;

const BP = { prefixCls: 'apollo-drawer' };
const wrap = (node) =>
  h(antd.ConfigProvider, { prefixCls: 'apollo', iconPrefixCls: 'apollo-icon' }, node);

/**
 * ⚠️ 打开的 `<Drawer>` 走 portal ⇒ SSR 里拿不到（与 message/notification 同判）
 * ⇒ L4 的目标是 **PurePanel**（`_InternalPanelDoNotUseOrYouWillBeFired`），
 * 它直接渲染面板、不 portal，四个方位各来一条。
 */
const PurePanel = Drawer._InternalPanelDoNotUseOrYouWillBeFired;

const cases = [];
const push = (id, node) => {
  cases.push({ id, html: renderToStaticMarkup(node) });
};

push(
  'drawer:pure-panel',
  wrap(h(PurePanel, { ...BP, title: 'Title', footer: 'Footer', extra: 'Extra' }, 'Body')),
);
push('drawer:pure-panel-right', wrap(h(PurePanel, { ...BP, title: 'T' }, 'Body')));
push('drawer:pure-panel-top', wrap(h(PurePanel, { ...BP, placement: 'top', title: 'T' }, 'Body')));
push('drawer:pure-panel-no-close', wrap(h(PurePanel, { ...BP, title: 'T', closable: false }, 'B')));

const result = {
  $schema: '../schema.json',
  component: 'drawer',
  antdVersion: antdPkg.version,
  generatedAt: new Date().toISOString(),
  cases,
};

if (check) {
  const existing = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
  if (JSON.stringify(existing.cases) !== JSON.stringify(cases)) {
    console.error('[baseline] drawer.dom.json 与当前 antd 产物不一致');
    process.exit(1);
  }
  console.log('[baseline] drawer: check ok,', cases.length, 'cases');
} else {
  fs.writeFileSync(OUT_FILE, `${JSON.stringify(result, null, 2)}\n`);
  console.log('[baseline] drawer: wrote', cases.length, 'cases →', OUT_FILE);
}
