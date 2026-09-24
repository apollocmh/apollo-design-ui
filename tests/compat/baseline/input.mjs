#!/usr/bin/env node
/**
 * tests/compat/baseline/input.mjs — 生成 antd 6.6.4 Input 家族的 DOM 基线
 * （机械 oracle）。
 *
 * 关键判据（G1 分析，docs/analysis/input.md）：
 * - **裸 input**：根就是 `input.{p}`（无包裹层）。
 * - **prefix/suffix**：升 `.apollo-input-affix-wrapper`，prefix 在 input 前、
 *   suffix 在后；allowClear 有值 ⇒ suffix 内 `-clear-icon` button。
 * - **addon**：三层 `-group-wrapper > -group > -group-addon`。
 * - **size**：裸态下 -sm/-lg 在 input 上；affix 态下包裹层带尺寸类。
 * - **TextArea**：`textarea.{p}`（autoSize 时 inline style 由量测产生 ——
 *   SSR 不量测，产 min/max 的 `resize:none` 由 overflow hidden 补）。
 * - **Password**：`type="password"` + suffix 内 `-password-icon`（role=button）。
 * - **Group**：转发 `Space.Compact`（`.apollo-space-compact`）。
 * - **showCount**：affix wrapper 带 `-textarea-show-count` / input 带
 *   `-show-count`，`data-count` 属性 = 计数文本。
 * - **rtl**：包裹层带 `-rtl`。
 *
 * 运行：node tests/compat/baseline/input.mjs [--check]
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, '../baselines/input.dom.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antdPkg = require('antd/package.json');
const antd = require('antd');
const { ConfigProvider, Input } = antd;

const cases = [];
const push = (id, node) => {
  cases.push({ id, html: renderToStaticMarkup(node) });
};

const BP = { prefixCls: 'apollo-input' };
const wrap = (node) =>
  h(ConfigProvider, { prefixCls: 'apollo', iconPrefixCls: 'apollo-icon' }, node);

// ---- 基本形态 ----

push('input:basic', wrap(h(Input, { ...BP, placeholder: 'basic' })));
push('input:value', wrap(h(Input, { ...BP, defaultValue: 'hello' })));
push('input:disabled', wrap(h(Input, { ...BP, disabled: true })));
push('input:readonly', wrap(h(Input, { ...BP, readOnly: true })));

// ---- size / variant / status ----

push('input:small', wrap(h(Input, { ...BP, size: 'small' })));
push('input:large', wrap(h(Input, { ...BP, size: 'large' })));
push('input:filled', wrap(h(Input, { ...BP, variant: 'filled' })));
push('input:borderless', wrap(h(Input, { ...BP, variant: 'borderless' })));
push('input:underlined', wrap(h(Input, { ...BP, variant: 'underlined' })));
push('input:bordered-false', wrap(h(Input, { ...BP, bordered: false })));
push('input:status-error', wrap(h(Input, { ...BP, status: 'error' })));
push('input:status-warning', wrap(h(Input, { ...BP, status: 'warning' })));

// ---- prefix / suffix / allowClear ----

push('input:prefix', wrap(h(Input, { ...BP, prefix: 'P' })));
push('input:suffix', wrap(h(Input, { ...BP, suffix: 'S' })));
push('input:presuffix', wrap(h(Input, { ...BP, prefix: '¥', suffix: 'RMB' })));
push('input:allow-clear', wrap(h(Input, { ...BP, allowClear: true, defaultValue: 'clear me' })));
push('input:allow-clear-empty', wrap(h(Input, { ...BP, allowClear: true })));
push(
  'input:allow-clear-disabled',
  wrap(h(Input, { ...BP, allowClear: true, disabled: true, defaultValue: 'x' })),
);

// ---- addon（deprecated）----

push('input:addon', wrap(h(Input, { ...BP, addonBefore: 'http://', addonAfter: '.com' })));
push('input:addon-before', wrap(h(Input, { ...BP, addonBefore: 'B' })));

// ---- showCount / count ----

push(
  'input:show-count',
  wrap(h(Input, { ...BP, showCount: true, maxLength: 20, defaultValue: 'abc' })),
);
push('input:count-max', wrap(h(Input, { ...BP, count: { max: 10 }, defaultValue: 'abcd' })));

// ---- TextArea ----

push('input:textarea', wrap(h(Input.TextArea, { ...BP, placeholder: 'ta' })));
push('input:textarea-rows', wrap(h(Input.TextArea, { ...BP, rows: 4, defaultValue: 'hello' })));
push(
  'input:textarea-show-count',
  wrap(h(Input.TextArea, { ...BP, showCount: true, maxLength: 50 })),
);
push(
  'input:textarea-allow-clear',
  wrap(h(Input.TextArea, { ...BP, allowClear: true, defaultValue: 'x' })),
);
push('input:textarea-status', wrap(h(Input.TextArea, { ...BP, status: 'error' })));

// ---- Password ----

push('input:password', wrap(h(Input.Password, { ...BP, placeholder: 'pw' })));
push('input:password-visible-toggle', wrap(h(Input.Password, { ...BP, visibilityToggle: false })));
push('input:password-value', wrap(h(Input.Password, { ...BP, defaultValue: 'secret' })));

// ---- Group（deprecated）----

push('input:group', wrap(h(Input.Group, { ...BP }, h(Input, { ...BP, style: { width: '50%' } }))));

// ---- rtl ----

push(
  'input:rtl',
  h(
    ConfigProvider,
    { prefixCls: 'apollo', iconPrefixCls: 'apollo-icon', direction: 'rtl' },
    h(Input, BP),
  ),
);
push(
  'input:rtl-affix',
  h(
    ConfigProvider,
    { prefixCls: 'apollo', iconPrefixCls: 'apollo-icon', direction: 'rtl' },
    h(Input, { ...BP, prefix: 'P' }),
  ),
);

// ---- 语义化 ----

push(
  'input:semantic',
  wrap(
    h(Input, {
      ...BP,
      classNames: { root: 'cls-root', prefix: 'cls-prefix', suffix: 'cls-suffix' },
      styles: { root: { width: 120 } },
      prefix: 'P',
    }),
  ),
);

const result = {
  $schema: '../schema.json',
  component: 'input',
  antdVersion: antdPkg.version,
  generatedAt: new Date().toISOString(),
  cases,
};

if (check) {
  const existing = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
  const same = JSON.stringify(existing.cases) === JSON.stringify(cases);
  if (!same) {
    console.error('[baseline] input.dom.json 与当前 antd 产物不一致');
    process.exit(1);
  }
  console.log('[baseline] input: check ok,', cases.length, 'cases');
} else {
  fs.writeFileSync(OUT_FILE, `${JSON.stringify(result, null, 2)}\n`);
  console.log('[baseline] input: wrote', cases.length, 'cases →', OUT_FILE);
}
