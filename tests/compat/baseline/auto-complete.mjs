#!/usr/bin/env node
/**
 * tests/compat/baseline/auto-complete.mjs — antd 6.6.4 AutoComplete 的 DOM 基线。
 *
 * 与 `rate.mjs` 同套路。⚠️ prefixCls 传**完整前缀** `'apollo-select'`
 * （AutoComplete 的类链是 `${prefixCls}-auto-complete`，divider 的 `'apollo'`
 * 技巧不成立 —— rate 期坑 79 同族）。
 *
 * 运行：node tests/compat/baseline/auto-complete.mjs [--check]
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, '../baselines/auto-complete.dom.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antd = require('antd');
const antdPkg = require('antd/package.json');
const { AutoComplete, ConfigProvider } = antd;

/** 两侧共用的完整前缀（见文件头 ⚠️）。 */
const PREFIX = 'apollo-select';

const cases = [];

/** iconPrefixCls 归一为 apollo-icon（D15 对侧；与 alert/rate 基线同款）。 */
const withIconPrefix = (node) => h(ConfigProvider, { iconPrefixCls: 'apollo-icon' }, node);

const push = (id, props) => {
  cases.push({
    id,
    html: renderToStaticMarkup(withIconPrefix(h(AutoComplete, { prefixCls: PREFIX, ...props }))),
  });
};

// ---- 基本形态 ----
push('plain', {});
push('value', { value: 'abc' });
push('placeholder', { placeholder: 'input here' });
push('disabled', { disabled: true });
push('size:large', { size: 'large' });
push('status:error', { status: 'error' });
push('class-name', { className: 'extra' });

// 前缀：自定义（两侧 getPrefixCls 均直接返回 custom）
push('prefix-cls:custom', { prefixCls: 'custom' });
// 两侧都不传 → antd `ant-select` vs 我们 `apollo-select`（D6，消费侧 allow）
cases.push({
  id: 'prefix-cls:no-props',
  html: renderToStaticMarkup(withIconPrefix(h(AutoComplete))),
});

const baseline = {
  $schema: '../schema.json',
  antdVersion: antdPkg.version,
  component: 'auto-complete',
  generatedAt: new Date().toISOString().slice(0, 10),
  cases,
};

if (check) {
  const current = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
  if (JSON.stringify(baseline.cases, null, 2) !== JSON.stringify(current.cases, null, 2)) {
    console.error('baseline drift detected: rerun node tests/compat/baseline/auto-complete.mjs');
    process.exit(1);
  }
  console.log('auto-complete baseline up to date.');
} else {
  fs.writeFileSync(OUT_FILE, `${JSON.stringify(baseline, null, 2)}\n`);
  console.log(`wrote ${OUT_FILE} (${cases.length} cases)`);
}
