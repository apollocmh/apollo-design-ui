#!/usr/bin/env node
/**
 * tests/compat/baseline/badge.mjs — 生成 antd 6.6.4 Badge 的 DOM 基线（机械 oracle）
 *
 * 与 grid.mjs 同套路。关键取舍见文件头注释：
 * - **motion 场景不进基线**：count 从有到无的离场动画是客户端时序，SSR 只钉静态形态
 *   （zoom-appear/leave class 由 L2 的 CSSMotion 单元测试与 L6 覆盖）。
 * - **offset 用数字**：React 对 marginTop 自动补 px（SSR 输出 10px），Vue 侧手动补 ——
 *   两侧产物一致（margin-top:10px）。字符串路径的 CSSOM 丢弃行为由 L1 说明。
 *
 * 运行：node tests/compat/baseline/badge.mjs [--check]
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');
const OUT_FILE = path.join(__dirname, '../baselines/badge.dom.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antdPkg = require('antd/package.json');
const { Badge } = antdPkg ? require('antd') : {};
const antd = require('antd');
const { version } = antdPkg;

const cases = [];
const push = (id, node) => {
  cases.push({ id, html: renderToStaticMarkup(node) });
};

const BP = { prefixCls: 'apollo-badge', scrollNumberPrefixCls: 'apollo-scroll-number' };
const RP = { prefixCls: 'apollo-ribbon' };
const Box = ({ text = 'x' }) => h('div', null, text);

// ---- wrapper 分支 -----------------------------------------------------------

push('badge:prefix-cls:no-props', h(Badge, null, h(Box)));
push('badge:count-basic', h(Badge, { ...BP, count: 5 }, h(Box)));
push('badge:count-zero', h(Badge, { ...BP, count: 0 }, h(Box)));
push('badge:count-zero-show-zero', h(Badge, { ...BP, count: 0, showZero: true }, h(Box)));
push('badge:no-count', h(Badge, { ...BP }, h(Box)));
push('badge:count-string', h(Badge, { ...BP, count: '99+' }, h(Box)));
push('badge:overflow', h(Badge, { ...BP, count: 100, overflowCount: 99 }, h(Box)));
push('badge:dot', h(Badge, { ...BP, dot: true, count: 5 }, h(Box)));
push('badge:dot-only', h(Badge, { ...BP, dot: true }, h(Box)));
push('badge:size-small', h(Badge, { ...BP, count: 5, size: 'small' }, h(Box)));
push('badge:offset', h(Badge, { ...BP, count: 5, offset: [10, 10] }, h(Box)));
push('badge:title-default', h(Badge, { ...BP, count: 5, title: 'custom' }, h(Box)));
push('badge:custom-color', h(Badge, { ...BP, count: 5, color: '#2db7f5' }, h(Box)));

// ---- not-a-wrapper（独立使用）----------------------------------------------

push('badge:standalone-count', h(Badge, { ...BP, count: 25 }));
push('badge:standalone-status', h(Badge, { ...BP, status: 'success' }));
push('badge:status-text', h(Badge, { ...BP, status: 'success', text: 'Success' }));
push('badge:status-processing', h(Badge, { ...BP, status: 'processing' }));
push(
  'badge:status-zero-text-show-zero',
  h(Badge, { ...BP, status: 'success', text: 0, showZero: true }),
);
push('badge:status-preset-color', h(Badge, { ...BP, status: 'success', color: 'blue' }));
push('badge:status-custom-color', h(Badge, { ...BP, status: 'success', color: '#2db7f5' }));
push('badge:count-and-status', h(Badge, { ...BP, count: 5, status: 'success' }));

// ---- Ribbon -----------------------------------------------------------------

push('ribbon:prefix-cls:no-props', h(Badge.Ribbon, null, h('div', null, 'x')));
push('ribbon:basic', h(Badge.Ribbon, { ...RP, text: 'Hippopotamus' }, h('div', null, 'x')));
push(
  'ribbon:preset-color',
  h(Badge.Ribbon, { ...RP, text: 't', color: 'green' }, h('div', null, 'x')),
);
push(
  'ribbon:custom-color',
  h(Badge.Ribbon, { ...RP, text: 't', color: '#2db7f5' }, h('div', null, 'x')),
);
push(
  'ribbon:placement-start',
  h(Badge.Ribbon, { ...RP, text: 't', placement: 'start' }, h('div', null, 'x')),
);

// ---------------------------------------------------------------------------

const payload = {
  $comment:
    'DOM 基线：由 tests/compat/baseline/badge.mjs 从 antd 6.6.4 的 Badge 真实渲染生成。机械 oracle，禁止手改。重新生成：node tests/compat/baseline/badge.mjs',
  antdVersion: version,
  renderer: 'react-dom/server.renderToStaticMarkup',
  prefixCls: 'apollo',
  caseCount: cases.length,
  cases,
};

const serialized = `${JSON.stringify(payload, null, 2)}\n`;

if (check) {
  const current = fs.existsSync(OUT_FILE) ? fs.readFileSync(OUT_FILE, 'utf8') : '';
  if (current !== serialized) {
    console.error('[compat:badge] ❌ 基线不是最新的');
    console.error('  运行: node tests/compat/baseline/badge.mjs');
    process.exit(1);
  }
  console.log(`[compat:badge] ✅ 基线最新（${cases.length} 个用例）`);
  process.exit(0);
}

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, serialized);
console.log(`[compat:badge] 用例 ${cases.length} 个`);
console.log(`写出 ${path.relative(REPO_ROOT, OUT_FILE)}`);
