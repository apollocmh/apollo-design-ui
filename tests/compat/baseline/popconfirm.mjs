#!/usr/bin/env node
/**
 * tests/compat/baseline/popconfirm.mjs — 生成 antd 6.6.4 Popconfirm 的 DOM 基线
 * （机械 oracle）。
 *
 * 判据与 popover.mjs 同构：
 * - SSR 里 rc-trigger 只渲染**触发元素**（popup 走 portal，SSR 不可达）；
 * - `PurePanel`（`_InternalPanelDoNotUseOrYouWillBeFired`）是 SSR 可达的
 *   **唯一完整浮层 DOM** —— Overlay 的四层结构靠它钉。
 *
 * 运行：node tests/compat/baseline/popconfirm.mjs [--check]
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, '../baselines/popconfirm.dom.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antdPkg = require('antd/package.json');
const antd = require('antd');
const { Popconfirm, ConfigProvider } = antd;
const PurePopconfirm = Popconfirm._InternalPanelDoNotUseOrYouWillBeFired;

const BP = { prefixCls: 'apollo-popconfirm' };
const wrap = (node) =>
  h(ConfigProvider, { prefixCls: 'apollo', iconPrefixCls: 'apollo-icon' }, node);

const cases = [];
const push = (id, node) => {
  cases.push({ id, html: renderToStaticMarkup(node) });
};

// ---- 触发元素（SSR 可达部分）----
push(
  'popconfirm:basic',
  wrap(
    h(
      Popconfirm,
      { ...BP, title: 'Title', description: 'Description' },
      h('button', { type: 'button' }, 'target'),
    ),
  ),
);
push(
  'popconfirm:open',
  wrap(
    h(
      Popconfirm,
      { ...BP, title: 'Title', description: 'Description', open: true, id: 'pc-1' },
      h('button', { type: 'button' }, 'target'),
    ),
  ),
);
push(
  'popconfirm:disabled',
  wrap(
    h(
      Popconfirm,
      { ...BP, title: 'Title', open: true, disabled: true, id: 'pc-2' },
      h('button', { type: 'button' }, 'target'),
    ),
  ),
);

// ---- PurePanel（静态浮层 DOM：Overlay 四层结构）----
push(
  'popconfirm:pure-panel',
  wrap(h(PurePopconfirm, { ...BP, title: 'Title', description: 'Description' })),
);
push('popconfirm:pure-panel-title-only', wrap(h(PurePopconfirm, { ...BP, title: 'Title' })));
push(
  'popconfirm:pure-panel-zero-title',
  wrap(h(PurePopconfirm, { ...BP, title: 0, description: 'Description' })),
);
push(
  'popconfirm:pure-panel-no-cancel',
  wrap(h(PurePopconfirm, { ...BP, title: 'Title', showCancel: false })),
);
push(
  'popconfirm:pure-panel-custom-text',
  wrap(h(PurePopconfirm, { ...BP, title: 'Title', okText: 'Yes', cancelText: 'No' })),
);
push(
  'popconfirm:pure-panel-empty-text',
  wrap(h(PurePopconfirm, { ...BP, title: 'Title', okText: '', cancelText: '' })),
);
push(
  'popconfirm:pure-panel-no-icon',
  wrap(h(PurePopconfirm, { ...BP, title: 'Title', icon: false })),
);
push(
  'popconfirm:pure-panel-ok-type',
  wrap(h(PurePopconfirm, { ...BP, title: 'Title', okType: 'danger' })),
);
push(
  'popconfirm:pure-panel-placement',
  wrap(h(PurePopconfirm, { ...BP, title: 'Title', placement: 'bottomLeft' })),
);
push(
  'popconfirm:pure-panel-render-fn',
  wrap(
    h(PurePopconfirm, {
      ...BP,
      title: () => 'lazy-title',
      description: () => 'lazy-description',
    }),
  ),
);
// ⚠️ antd 的 `Popconfirm.PurePanel` **不消费** `classNames` / `styles`
//    （它只接受 `className` / `style`，见 popconfirm/PurePanel.tsx 的解构）。
//    语义槽的覆盖是 `Popconfirm` 本体的能力；这里只钉 className / style 通道。
push(
  'popconfirm:pure-panel-class-name',
  wrap(
    h(PurePopconfirm, {
      ...BP,
      title: 'Title',
      description: 'Description',
      className: 'custom-root',
      style: { padding: 20 },
    }),
  ),
);

const result = {
  $schema: '../schema.json',
  component: 'popconfirm',
  antdVersion: antdPkg.version,
  generatedAt: new Date().toISOString(),
  cases,
};

if (check) {
  const existing = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
  const same = JSON.stringify(existing.cases) === JSON.stringify(cases);
  if (!same) {
    console.error('[baseline] popconfirm.dom.json 与当前 antd 产物不一致');
    process.exit(1);
  }
  console.log('[baseline] popconfirm: check ok,', cases.length, 'cases');
} else {
  fs.writeFileSync(OUT_FILE, `${JSON.stringify(result, null, 2)}\n`);
  console.log('[baseline] popconfirm: wrote', cases.length, 'cases →', OUT_FILE);
}
