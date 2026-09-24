#!/usr/bin/env node
/**
 * tests/compat/baseline/tooltip.mjs — 生成 antd 6.6.4 Tooltip 的 DOM 基线
 * （机械 oracle）。
 *
 * 判据（docs/analysis/tooltip.md §2）：
 * - SSR 里 rc-trigger 只渲染**触发元素**（popup 走 portal，SSR 不可达）；
 * - `open` 且有 title ⇒ 触发元素带 aria-describedby（无 url 拼接时 = 容器 id）；
 * - PurePanel 是纯静态渲染（SSR 可达的唯一完整浮层 DOM）。
 *
 * 运行：node tests/compat/baseline/tooltip.mjs [--check]
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, '../baselines/tooltip.dom.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antdPkg = require('antd/package.json');
const antd = require('antd');
const { Tooltip } = antd;
const PureTooltip = Tooltip._InternalPanelDoNotUseOrYouWillBeFired;

const BP = { prefixCls: 'apollo-tooltip' };
const wrap = (node) =>
  h(antd.ConfigProvider, { prefixCls: 'apollo', iconPrefixCls: 'apollo-icon' }, node);

const cases = [];
const push = (id, node) => {
  const html = renderToStaticMarkup(node);
  cases.push({ id, html });
};

// ---- 触发元素（SSR 可达部分）----

push('tooltip:basic', wrap(h(Tooltip, { ...BP, title: 'prompt text' }, 'target')));
push(
  'tooltip:open',
  wrap(h(Tooltip, { ...BP, title: 'prompt text', open: true, id: 'tip-1' }, 'target')),
);
push(
  'tooltip:open-no-title',
  wrap(h(Tooltip, { ...BP, title: 'prompt text', open: true, id: 'tip-3' }, 'target')),
);
push(
  'tooltip:open-zero-title',
  wrap(h(Tooltip, { ...BP, title: 0, open: true, id: 'tip-4' }, 'target')),
);
push(
  'tooltip:open-existing-describedby',
  wrap(
    h(
      Tooltip,
      { ...BP, title: 'prompt text', open: true, id: 'tip-2' },
      h('span', { 'aria-describedby': 'other' }, 'target'),
    ),
  ),
);
push(
  'tooltip:open-class',
  wrap(
    h(Tooltip, { ...BP, title: 'prompt text', open: true, id: 'tip-5' }, h('span', null, 'target')),
  ),
);

// ---- PurePanel（静态浮层 DOM）----

push('tooltip:pure-panel', wrap(h(PureTooltip, { ...BP, title: 'Hello Pure Panel!' })));
push(
  'tooltip:pure-panel-color',
  wrap(h(PureTooltip, { ...BP, title: 'Hello Pink!', color: 'pink' })),
);
push(
  'tooltip:pure-panel-custom-color',
  wrap(h(PureTooltip, { ...BP, title: 'Hello Custom!', color: '#f50' })),
);

const result = {
  $schema: '../schema.json',
  component: 'tooltip',
  antdVersion: antdPkg.version,
  generatedAt: new Date().toISOString(),
  cases,
};

if (check) {
  const existing = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
  const same = JSON.stringify(existing.cases) === JSON.stringify(cases);
  if (!same) {
    console.error('[baseline] tooltip.dom.json 与当前 antd 产物不一致');
    process.exit(1);
  }
  console.log('[baseline] tooltip: check ok,', cases.length, 'cases');
} else {
  fs.writeFileSync(OUT_FILE, `${JSON.stringify(result, null, 2)}\n`);
  console.log('[baseline] tooltip: wrote', cases.length, 'cases →', OUT_FILE);
}
