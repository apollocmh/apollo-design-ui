#!/usr/bin/env node
/**
 * tests/compat/baseline/mentions.mjs — 生成 antd 6.6.4 Mentions 的 DOM 基线（机械 oracle）。
 *
 * 关键判据（G1 分析，docs/analysis/mentions.md §3.1，全部来自**实测**）：
 * - **闭态根**：`div.{p}`（类名里 `{p}` 出现**两次** —— 一次是 rc-mentions 的 div 前缀，
 *   一次是 `BaseInput` 的 `className` 前缀）+ variant 类（`-outlined` 默认）。
 * - **textarea 的类名是 `rc-textarea`**（不是 `{p}`）—— 上游不给 TextArea 传 prefixCls，
 *   走 rc-input 的默认值。逐字保留（D43 同判）。
 * - **allowClear / suffix 存在** ⇒ 根 div **消失**，`BaseInput` 的
 *   `span.{p}-affix-wrapper` 成为根，并带 `{p}-has-suffix`。
 * - `disabled` ⇒ 根 `{p}-disabled` + textarea `rc-textarea rc-textarea-disabled` + `disabled=""`。
 * - `readOnly` ⇒ 只有 textarea 的 `readonly=""`（**无类名**）。
 * - `size` ⇒ 根 `-sm` / `-lg`；`status` ⇒ `-status-error/-warning`；variant 替换 `-outlined`。
 *
 * ⚠️ **开态（候选面板）不在基线里**：`useEffect`/键盘交互在 SSR 不执行 ⇒
 *    `renderToStaticMarkup` 只能拿到闭态。面板的 DOM 由
 *    `/tmp/probe-mentions-matrix.mjs`（jsdom 真渲染）与 L6 视觉层覆盖。
 *
 * 运行：node tests/compat/baseline/mentions.mjs [--check]
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, '../baselines/mentions.dom.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antdPkg = require('antd/package.json');
const antd = require('antd');
const { ConfigProvider, Mentions } = antd;

const cases = [];
const push = (id, node) => {
  cases.push({ id, html: renderToStaticMarkup(node) });
};

const BP = { prefixCls: 'apollo-mentions' };
const wrap = (node) =>
  h(ConfigProvider, { prefixCls: 'apollo', iconPrefixCls: 'apollo-icon' }, node);

const OPTIONS = [
  { value: 'afc163', label: 'afc163' },
  { value: 'zombieJ', label: 'zombieJ' },
  { value: 'yesmeck', label: 'yesmeck' },
];

// ---- 基本形态 ----
push('mentions:plain', wrap(h(Mentions, { ...BP })));
push('mentions:value', wrap(h(Mentions, { ...BP, defaultValue: '@afc163' })));
push('mentions:placeholder', wrap(h(Mentions, { ...BP, placeholder: 'hi' })));
push('mentions:disabled', wrap(h(Mentions, { ...BP, disabled: true, defaultValue: 'a' })));
push('mentions:readonly', wrap(h(Mentions, { ...BP, readOnly: true, defaultValue: 'a' })));

// ---- size / variant / status ----
push('mentions:small', wrap(h(Mentions, { ...BP, size: 'small' })));
push('mentions:large', wrap(h(Mentions, { ...BP, size: 'large' })));
push('mentions:filled', wrap(h(Mentions, { ...BP, variant: 'filled' })));
push('mentions:borderless', wrap(h(Mentions, { ...BP, variant: 'borderless' })));
push('mentions:underlined', wrap(h(Mentions, { ...BP, variant: 'underlined' })));
push('mentions:status-error', wrap(h(Mentions, { ...BP, status: 'error' })));
push('mentions:status-warning', wrap(h(Mentions, { ...BP, status: 'warning' })));

// ---- allowClear（切到 affix 形态）----
push('mentions:allow-clear', wrap(h(Mentions, { ...BP, allowClear: true, defaultValue: 'a' })));
push(
  'mentions:allow-clear-disabled',
  wrap(h(Mentions, { ...BP, allowClear: true, disabled: true, defaultValue: 'a' })),
);
push('mentions:allow-clear-empty', wrap(h(Mentions, { ...BP, allowClear: true })));

// ---- 透传 / 其它 ----
push(
  'mentions:class-name',
  wrap(h(Mentions, { ...BP, className: 'extra', rootClassName: 'rootx' })),
);
push('mentions:rows', wrap(h(Mentions, { ...BP, rows: 3 })));
push('mentions:options', wrap(h(Mentions, { ...BP, options: OPTIONS })));

// ---- rtl ----
push(
  'mentions:rtl',
  h(
    ConfigProvider,
    { prefixCls: 'apollo', iconPrefixCls: 'apollo-icon', direction: 'rtl' },
    h(Mentions, BP),
  ),
);

// ---- 语义化 ----
push(
  'mentions:semantic',
  wrap(
    h(Mentions, {
      ...BP,
      classNames: { root: 'cls-root', textarea: 'cls-textarea', suffix: 'cls-suffix' },
      styles: { root: { width: 120 } },
      allowClear: true,
      defaultValue: 'x',
    }),
  ),
);

const result = {
  $schema: '../schema.json',
  component: 'mentions',
  antdVersion: antdPkg.version,
  generatedAt: new Date().toISOString(),
  cases,
};

if (check) {
  const existing = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
  const same = JSON.stringify(existing.cases) === JSON.stringify(cases);
  if (!same) {
    console.error('[baseline] mentions.dom.json 与当前 antd 产物不一致');
    process.exit(1);
  }
  console.log('[baseline] mentions: check ok,', cases.length, 'cases');
} else {
  fs.writeFileSync(OUT_FILE, `${JSON.stringify(result, null, 2)}\n`);
  console.log('[baseline] mentions: wrote', cases.length, 'cases →', OUT_FILE);
}
