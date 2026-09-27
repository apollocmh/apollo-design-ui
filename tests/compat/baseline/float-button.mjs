#!/usr/bin/env node
/**
 * tests/compat/baseline/float-button.mjs — antd 6.6.4 FloatButton 的 DOM 基线。
 *
 * ⚠️ prefixCls 传**完整前缀** `'apollo-float-btn'`（antd 的 floatButtonPrefixCls
 * 是 'float-btn'，类链 `${prefixCls}-…` —— rate 期坑 79 同族）。
 * iconPrefixCls 归一为 apollo-icon（与 alert/rate 基线同款）。
 *
 * 运行：node tests/compat/baseline/float-button.mjs [--check]
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, '../baselines/float-button.dom.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antd = require('antd');
const antdPkg = require('antd/package.json');
const { FloatButton, ConfigProvider } = antd;

/** 两侧共用的完整前缀。 */
const PREFIX = 'apollo-float-btn';

const cases = [];
/** prefixCls + iconPrefixCls 双归一（Button 的 apollo-btn 前缀 + 图标前缀）。 */
const withIconPrefix = (node) =>
  h(ConfigProvider, { prefixCls: 'apollo', iconPrefixCls: 'apollo-icon' }, node);

const push = (id, props) => {
  cases.push({
    id,
    html: renderToStaticMarkup(withIconPrefix(h(FloatButton, { prefixCls: PREFIX, ...props }))),
  });
};

push('plain', {});
push('type:primary', { type: 'primary' });
push('shape:square', { shape: 'square' });
push('content', { shape: 'square', content: 'HELP' });
push('description', { shape: 'square', description: 'HELP' });
push('href', { href: 'https://example.com' });
push('disabled', { disabled: true });
// ⚠️ badge 集成用例不在本基线：Badge 作为 Button children 的嵌入形态存在
//    结构差异（wrapper/sup），由 L1 结构断言 + Badge 自身 L4 覆盖（见 semantic.test 头注）
push('class-name', { className: 'extra' });
push('prefix-cls:custom', { prefixCls: 'custom' });
cases.push({
  id: 'prefix-cls:no-props',
  html: renderToStaticMarkup(withIconPrefix(h(FloatButton))),
});

const baseline = {
  $schema: '../schema.json',
  antdVersion: antdPkg.version,
  component: 'float-button',
  generatedAt: new Date().toISOString().slice(0, 10),
  cases,
};

if (check) {
  const current = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
  if (JSON.stringify(baseline.cases, null, 2) !== JSON.stringify(current.cases, null, 2)) {
    console.error('baseline drift detected: rerun node tests/compat/baseline/float-button.mjs');
    process.exit(1);
  }
  console.log('float-button baseline up to date.');
} else {
  fs.writeFileSync(OUT_FILE, `${JSON.stringify(baseline, null, 2)}\n`);
  console.log(`wrote ${OUT_FILE} (${cases.length} cases)`);
}
