#!/usr/bin/env node
/**
 * tests/compat/baseline/back-top.mjs — 生成 antd 6.6.4 BackTop 的 DOM 基线（机械 oracle）
 *
 * 与 result.mjs 同套路。关键取舍（G1 分析 §2.8）：
 * - **visibilityHeight > 0 的默认形态不出现在基线里**：初始 visible=false →
 *   rc-motion 首帧渲染 null（SSR 产物只有空根 div）。两条渲染路径平台一致，
 *   基线钉 `visibilityHeight: 0`（初始可见）与 children 克隆形态。
 * - fade 类挂 DOM 但无 CSS（antd 产物逐字）。
 *
 * 运行：node tests/compat/baseline/back-top.mjs [--check]
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, '../baselines/back-top.dom.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antdPkg = require('antd/package.json');
const antd = require('antd');
const { ConfigProvider, BackTop } = antd;

const cases = [];
const push = (id, node) => {
  cases.push({ id, html: renderToStaticMarkup(node) });
};

const BP = { prefixCls: 'apollo-back-top', visibilityHeight: 0 };
const wrap = (node) =>
  h(ConfigProvider, { prefixCls: 'apollo', iconPrefixCls: 'apollo-icon' }, node);

push('back-top:prefix-cls:no-props', wrap(h(BackTop, { visibilityHeight: 0 })));
push('back-top:basic', wrap(h(BackTop, BP)));
push(
  'back-top:custom-children',
  wrap(
    h(BackTop, { ...BP, className: 'user-class' }, h('div', { className: 'my-content' }, 'top')),
  ),
);
push(
  'back-top:default-with-attrs',
  wrap(h(BackTop, { ...BP, 'aria-label': 'back to top', 'data-testid': 'bt' })),
);

const payload = {
  $comment:
    'DOM 基线：由 tests/compat/baseline/back-top.mjs 从 antd 6.6.4 的 BackTop 真实渲染生成。机械 oracle，禁止手改。',
  antdVersion: antdPkg.version,
  renderer: 'react-dom/server.renderToStaticMarkup',
  prefixCls: 'apollo',
  caseCount: cases.length,
  cases,
};

const serialized = `${JSON.stringify(payload, null, 2)}\n`;

if (check) {
  const current = fs.existsSync(OUT_FILE) ? fs.readFileSync(OUT_FILE, 'utf8') : '';
  if (current !== serialized) {
    console.error('[compat:back-top] ❌ 基线不是最新的');
    console.error('  运行: node tests/compat/baseline/back-top.mjs');
    process.exit(1);
  }
  console.log(`[compat:back-top] ✅ 基线最新（${cases.length} 个用例）`);
  process.exit(0);
}

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, serialized);
console.log(`[compat:back-top] 用例 ${cases.length} 个`);
console.log(`写出 ${path.relative(process.cwd(), OUT_FILE)}`);
