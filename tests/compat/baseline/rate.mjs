#!/usr/bin/env node
/**
 * tests/compat/baseline/rate.mjs — 生成 antd 6.6.4 Rate 的 DOM 基线（机械 oracle）
 *
 * 与 `divider.mjs` 同一套路：构造用例 → `renderToStaticMarkup` → 写文件。
 * 归一化与比对在消费侧（`packages/ui/src/rate/__tests__/semantic.test.ts`）完成。
 *
 * 运行：
 *   node tests/compat/baseline/rate.mjs
 *   node tests/compat/baseline/rate.mjs --check
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../..');
const OUT_FILE = path.join(__dirname, '../baselines/rate.dom.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antd = require('antd');
const antdPkg = require('antd/package.json');
const { Rate, ConfigProvider } = antd;

/** 两侧共用的前缀。
 * ⚠️ 不能传 `'apollo'`：`getPrefixCls('rate', 'apollo')` **直接返回** `'apollo'`
 * （不加 `-rate` 后缀），类名会变成 `.apollo-star`。传完整前缀 `'apollo-rate'`
 * 才能让两侧类名逐字对齐（divider 能用 `'apollo'` 是因为它的类链只有 `${prefixCls}`）。
 */
const PREFIX = 'apollo-rate';

const cases = [];

/** 与 alert/app 等基线同款：iconPrefixCls 归一为 apollo-icon（D15 的对侧）。 */
const withIconPrefix = (node) => h(ConfigProvider, { iconPrefixCls: 'apollo-icon' }, node);

const render = (props, children, { wrap } = {}) => {
  const node = children === undefined ? h(Rate, props) : h(Rate, props, children);
  return renderToStaticMarkup(wrap ? wrap(withIconPrefix(node)) : withIconPrefix(node));
};

const push = (id, props, options) => {
  cases.push({ id, html: render({ prefixCls: PREFIX, ...props }, undefined, options) });
};

// ---- 1. 基本形态 ----
push('plain', {});
push('value:3', { value: 3 });
push('value:0', { value: 0 });
push('prefix-cls:custom', { prefixCls: 'custom' });
// 两侧都不传 prefixCls → antd 用 `ant-rate`、我们用 `apollo-rate`（消费侧 allow 登记为 D6）。
cases.push({ id: 'prefix-cls:no-props', html: renderToStaticMarkup(h(Rate)) });

// ---- 2. 半星 ----
push('half:value:2.5', { allowHalf: true, value: 2.5 });
push('half:value:0.5', { allowHalf: true, value: 0.5 });

// ---- 3. 数量 ----
push('count:10+value:8', { count: 10, value: 8 });

// ---- 4. disabled / allowClear ----
push('disabled:value:2', { disabled: true, value: 2 });
push('allow-clear:false', { allowClear: false, value: 3 });

// ---- 5. 字符（character prop；React children 不映射 character，不能用它传）----
cases.push({
  id: 'character:text',
  html: renderToStaticMarkup(h(Rate, { prefixCls: PREFIX, value: 1, character: 'A' })),
});

// ---- 6. 尺寸 ----
push('size:large', { size: 'large' });
push('size:small', { size: 'small' });

// ---- 7. RTL ----
cases.push({
  id: 'rtl',
  html: renderToStaticMarkup(
    h(
      ConfigProvider,
      { iconPrefixCls: 'apollo-icon', direction: 'rtl' },
      h(Rate, { prefixCls: PREFIX, value: 3 }),
    ),
  ),
});

const baseline = {
  $schema: '../schema.json',
  antdVersion: antdPkg.version,
  component: 'rate',
  generatedAt: new Date().toISOString().slice(0, 10),
  cases,
};

if (check) {
  const current = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
  const next = JSON.stringify(baseline.cases, null, 2);
  const prev = JSON.stringify(current.cases, null, 2);
  if (next !== prev) {
    console.error('baseline drift detected: run `node tests/compat/baseline/rate.mjs` to update.');
    process.exit(1);
  }
  console.log('rate baseline up to date.');
} else {
  fs.writeFileSync(OUT_FILE, `${JSON.stringify(baseline, null, 2)}\n`);
  console.log(`wrote ${OUT_FILE} (${cases.length} cases)`);
}
void REPO_ROOT;
