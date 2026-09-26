#!/usr/bin/env node
/** 生成 antd 6.6.4 Modal 的 DOM 基线（机械 oracle）。node … [--check] */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, '../baselines/modal.dom.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antdPkg = require('antd/package.json');
const antd = require('antd');
const { Modal } = antd;

const BP = { prefixCls: 'apollo-modal' };
const wrap = (node) =>
  h(antd.ConfigProvider, { prefixCls: 'apollo', iconPrefixCls: 'apollo-icon' }, node);

/**
 * ⚠️ 打开的 `<Modal>` 走 portal ⇒ SSR 里拿不到（与 message/notification 同判）
 * ⇒ L4 的目标是 **PurePanel**（`_InternalPanelDoNotUseOrYouWillBeFired`）：
 * 普通形态 + 4 种 confirm 形态 + footer 函数形态。
 */
const PurePanel = Modal._InternalPanelDoNotUseOrYouWillBeFired;

const cases = [];
const push = (id, node) => {
  cases.push({ id, html: renderToStaticMarkup(node) });
};

push(
  'modal:pure-panel',
  wrap(h(PurePanel, { ...BP, title: 'Title', footer: 'Footer', closable: true }, 'Body')),
);
push('modal:pure-panel-no-close', wrap(h(PurePanel, { ...BP, title: 'T', closable: false }, 'B')));
push(
  'modal:pure-panel-confirm',
  wrap(h(PurePanel, { ...BP, type: 'confirm', title: 'T', content: 'C' })),
);
push(
  'modal:pure-panel-info',
  wrap(h(PurePanel, { ...BP, type: 'info', title: 'T', content: 'C' })),
);
push(
  'modal:pure-panel-success',
  wrap(h(PurePanel, { ...BP, type: 'success', title: 'T', content: 'C' })),
);
push(
  'modal:pure-panel-error',
  wrap(h(PurePanel, { ...BP, type: 'error', title: 'T', content: 'C' })),
);
push(
  'modal:pure-panel-warning',
  wrap(h(PurePanel, { ...BP, type: 'warning', title: 'T', content: 'C' })),
);
push(
  'modal:pure-panel-confirm-no-title',
  wrap(h(PurePanel, { ...BP, type: 'confirm', content: 'C' })),
);
push(
  'modal:pure-panel-footer-fn',
  wrap(
    h(
      PurePanel,
      {
        ...BP,
        title: 'T',
        footer: (originNode) => h('div', { className: 'custom-footer' }, originNode),
      },
      'Body',
    ),
  ),
);

const result = {
  $schema: '../schema.json',
  component: 'modal',
  antdVersion: antdPkg.version,
  generatedAt: new Date().toISOString(),
  cases,
};

if (check) {
  const existing = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
  if (JSON.stringify(existing.cases) !== JSON.stringify(cases)) {
    console.error('[baseline] modal.dom.json 与当前 antd 产物不一致');
    process.exit(1);
  }
  console.log('[baseline] modal: check ok,', cases.length, 'cases');
} else {
  fs.writeFileSync(OUT_FILE, `${JSON.stringify(result, null, 2)}\n`);
  console.log('[baseline] modal: wrote', cases.length, 'cases');
}
