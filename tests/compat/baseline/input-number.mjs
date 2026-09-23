#!/usr/bin/env node
/**
 * tests/compat/baseline/input-number.mjs — 生成 antd 6.6.4 InputNumber 的 DOM 基线
 * （机械 oracle）。
 *
 * 关键判据（G1 分析 §2/§3，docs/analysis/input-number.md）：
 * - **根类串**：`{p}-input-number -mode-input|-mode-spinner -{variant} -lg|-sm
 *   -status-* -disabled -readonly -without-controls -rtl` + 语义 root —— 顺序对拍。
 * - **input 元素**：`role="spinbutton"`、`aria-valuemin/max` 原样、
 *   `aria-valuenow` 受控值、`step` attr、`autoComplete=off`。
 * - **actions**：mode=input 且 controls ⇒ `.actions` 容器内 up/down 两个
 *   `role="button"` span（aria-label Increase/Decrease Value）；controls=false
 *   ⇒ 无 actions 且根有 `-without-controls`；disabled/readOnly 同样无 actions。
 * - **spinner**：down 在最前、up 在最后（input 前后各一）。
 * - **prefix/suffix**：`prefix !== undefined` 才渲染 div（`null` 也渲染 ——
 *   antd 判据是 `!== undefined`）。
 * - **legacy addon**（deprecated）：根升为 `Space.Compact`（`-compact-item` 类），
 *   addon 落 `Space.Addon`（`{p}-input-number-addon`）。
 * - formatter/precision：SSR 的 input value 是格式化后的文本。
 *
 * 运行：node tests/compat/baseline/input-number.mjs [--check]
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, '../baselines/input-number.dom.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antdPkg = require('antd/package.json');
const antd = require('antd');
const { ConfigProvider, InputNumber } = antd;

const cases = [];
const push = (id, node) => {
  cases.push({ id, html: renderToStaticMarkup(node) });
};

const BP = { prefixCls: 'apollo-input-number' };
const wrap = (node) =>
  h(ConfigProvider, { prefixCls: 'apollo', iconPrefixCls: 'apollo-icon' }, node);

// ---- 基本形态 ----

push('input-number:basic', wrap(h(InputNumber, { ...BP, defaultValue: 3 })));
push('input-number:value-controlled', wrap(h(InputNumber, { ...BP, value: 5, min: 1, max: 10 })));
push('input-number:empty', wrap(h(InputNumber, BP)));
push('input-number:placeholder', wrap(h(InputNumber, { ...BP, placeholder: '请输入' })));

// ---- controls ----

push('input-number:controls-false', wrap(h(InputNumber, { ...BP, controls: false })));
push('input-number:controls-object', wrap(h(InputNumber, { ...BP, controls: {} })));
push('input-number:disabled', wrap(h(InputNumber, { ...BP, disabled: true })));
push('input-number:readonly', wrap(h(InputNumber, { ...BP, readOnly: true })));

// ---- mode ----

push('input-number:spinner', wrap(h(InputNumber, { ...BP, mode: 'spinner', defaultValue: 1 })));

// ---- size / variant / status ----

push('input-number:small', wrap(h(InputNumber, { ...BP, size: 'small' })));
push('input-number:large', wrap(h(InputNumber, { ...BP, size: 'large' })));
push('input-number:borderless', wrap(h(InputNumber, { ...BP, variant: 'borderless' })));
push('input-number:filled', wrap(h(InputNumber, { ...BP, variant: 'filled' })));
push('input-number:underlined', wrap(h(InputNumber, { ...BP, variant: 'underlined' })));
push('input-number:bordered-false', wrap(h(InputNumber, { ...BP, bordered: false })));
push('input-number:status-error', wrap(h(InputNumber, { ...BP, status: 'error' })));
push('input-number:status-warning', wrap(h(InputNumber, { ...BP, status: 'warning' })));

// ---- prefix / suffix ----

push('input-number:presuffix', wrap(h(InputNumber, { ...BP, prefix: '$', suffix: 'kg' })));

// ---- 数值格式化（SSR value 文本）----

push(
  'input-number:precision',
  wrap(h(InputNumber, { ...BP, defaultValue: '1.234', precision: 2 })),
);
push(
  'input-number:formatter',
  wrap(
    h(InputNumber, {
      ...BP,
      defaultValue: 12345,
      formatter: (v) => `$ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ','),
    }),
  ),
);

// ---- out of range（受控超界标红不回弹）----

push('input-number:out-of-range', wrap(h(InputNumber, { ...BP, value: 99, min: 1, max: 10 })));

// ---- 语义化 ----

push(
  'input-number:semantic',
  wrap(
    h(InputNumber, {
      ...BP,
      classNames: { root: 'cls-root', input: 'cls-input', actions: 'cls-actions' },
      styles: { root: { width: 120 }, input: { color: 'rgb(1, 2, 3)' } },
      defaultValue: 1,
    }),
  ),
);

// ---- legacy addon（deprecated）----

push(
  'input-number:addon',
  wrap(h(InputNumber, { ...BP, addonBefore: 'http://', addonAfter: '.com', defaultValue: 1 })),
);

// ---- rtl ----

push(
  'input-number:rtl',
  h(
    ConfigProvider,
    { prefixCls: 'apollo', iconPrefixCls: 'apollo-icon', direction: 'rtl' },
    h(InputNumber, BP),
  ),
);

const result = {
  $schema: '../schema.json',
  component: 'input-number',
  antdVersion: antdPkg.version,
  generatedAt: new Date().toISOString(),
  cases,
};

if (check) {
  const existing = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
  const same = JSON.stringify(existing.cases) === JSON.stringify(cases);
  if (!same) {
    console.error('[baseline] input-number.dom.json 与当前 antd 产物不一致');
    process.exit(1);
  }
  console.log('[baseline] input-number: check ok,', cases.length, 'cases');
} else {
  fs.writeFileSync(OUT_FILE, `${JSON.stringify(result, null, 2)}\n`);
  console.log('[baseline] input-number: wrote', cases.length, 'cases →', OUT_FILE);
}
