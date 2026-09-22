#!/usr/bin/env node
/**
 * tests/compat/baseline/tag.mjs — 生成 antd 6.6.4 Tag 的 DOM 基线（机械 oracle）
 *
 * 与 result.mjs 同套路。关键取舍（G1 §2）：
 * - **Wave 不进基线**：点击波纹是运行时效果，无静态 DOM 差异。
 * - **ConfigProvider 包裹**对齐 iconPrefixCls（result 范式）。
 * - 覆盖：variant 三态 × 预设/状态/动态色、closable、href、disabled、
 *   CheckableTag、CheckableTagGroup。
 *
 * 运行：node tests/compat/baseline/tag.mjs [--check]
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, '../baselines/tag.dom.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antdPkg = require('antd/package.json');
const antd = require('antd');
const { ConfigProvider, Tag } = antd;

const cases = [];
const push = (id, node) => {
  cases.push({ id, html: renderToStaticMarkup(node) });
};

const BP = { prefixCls: 'apollo-tag' };
const wrap = (node) =>
  h(ConfigProvider, { prefixCls: 'apollo', iconPrefixCls: 'apollo-icon' }, node);

// ---- 基本形态 ----

push('tag:prefix-cls:no-props', wrap(h(Tag, { ...BP }, 'x')));
push('tag:basic', wrap(h(Tag, { ...BP }, 'Tag 1')));
push('tag:href', wrap(h(Tag, { ...BP, href: 'https://x', target: '_blank' }, 'Link')));
push('tag:disabled-href', wrap(h(Tag, { ...BP, href: 'https://x', disabled: true }, 'x')));
push('tag:aria-attrs', wrap(h(Tag, { ...BP, 'aria-label': 't', 'data-x': '1' }, 'x')));

// ---- 预设 / 状态 / 动态色 ----

push('tag:preset-blue-filled', wrap(h(Tag, { ...BP, color: 'blue' }, 'x')));
push('tag:preset-blue-solid', wrap(h(Tag, { ...BP, color: 'blue', variant: 'solid' }, 'x')));
push('tag:preset-blue-outlined', wrap(h(Tag, { ...BP, color: 'blue', variant: 'outlined' }, 'x')));
push('tag:status-success-filled', wrap(h(Tag, { ...BP, color: 'success' }, 'x')));
push('tag:status-success-solid', wrap(h(Tag, { ...BP, color: 'success', variant: 'solid' }, 'x')));
push(
  'tag:status-error-outlined',
  wrap(h(Tag, { ...BP, color: 'error', variant: 'outlined' }, 'x')),
);
push('tag:custom-color-filled', wrap(h(Tag, { ...BP, color: '#2db7f5' }, 'x')));
push('tag:custom-color-solid', wrap(h(Tag, { ...BP, color: '#2db7f5', variant: 'solid' }, 'x')));
push('tag:inverse-color', wrap(h(Tag, { ...BP, color: 'blue-inverse' }, 'x')));

// ---- closable ----

push('tag:closable', wrap(h(Tag, { ...BP, closable: true }, 'x')));
push(
  'tag:custom-close-icon',
  wrap(h(Tag, { ...BP, closable: true, closeIcon: h('em', null, 'x') })),
);
push('tag:closable-disabled', wrap(h(Tag, { ...BP, closable: true, disabled: true }, 'x')));

// ---- icon ----

push('tag:icon', wrap(h(Tag, { ...BP, icon: h('i', { className: 'my-icon' }) }, 'x')));

// ---- CheckableTag / Group ----

push('checkable:checked', wrap(h(Tag.CheckableTag, { ...BP, checked: true }, 'Yes')));
push('checkable:unchecked', wrap(h(Tag.CheckableTag, { ...BP, checked: false }, 'No')));
push(
  'checkable:disabled',
  wrap(h(Tag.CheckableTag, { ...BP, checked: true, disabled: true }, 'No')),
);
push(
  'checkable-group:single',
  wrap(h(Tag.CheckableTagGroup, { ...BP, options: ['a', 'b'], value: 'a' })),
);
push(
  'checkable-group:multiple',
  wrap(h(Tag.CheckableTagGroup, { ...BP, options: ['a', 'b'], value: ['a'], multiple: true })),
);
push(
  'checkable-group:option-objects',
  wrap(h(Tag.CheckableTagGroup, { ...BP, options: [{ value: 'a', label: 'A' }], value: 'a' })),
);

const payload = {
  $comment:
    'DOM 基线：由 tests/compat/baseline/tag.mjs 从 antd 6.6.4 的 Tag 真实渲染生成。机械 oracle，禁止手改。',
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
    console.error('[compat:tag] ❌ 基线不是最新的');
    console.error('  运行: node tests/compat/baseline/tag.mjs');
    process.exit(1);
  }
  console.log(`[compat:tag] ✅ 基线最新（${cases.length} 个用例）`);
  process.exit(0);
}

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, serialized);
console.log(`[compat:tag] 用例 ${cases.length} 个`);
console.log(`写出 ${path.relative(process.cwd(), OUT_FILE)}`);
