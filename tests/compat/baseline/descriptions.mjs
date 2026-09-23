#!/usr/bin/env node
/**
 * tests/compat/baseline/descriptions.mjs — 生成 antd 6.6.4 Descriptions 的 DOM 基线
 * （机械 oracle）
 *
 * 关键取舍（docs/analysis/descriptions.md §3）：
 * - 三形态渲染分支：plain（label/content 同 td + container）/ bordered（th.item-label +
 *   td.item-content 分格，无 container）/ vertical（label 行 + content 行）。
 * - 行尾补齐：行内 span 总和 < column ⇒ 末条 colSpan 扩满。
 * - bordered 的 content colSpan = `span*2-1`；vertical 的 label/content colSpan 相同。
 * - header 仅 title||extra 存在时渲染。
 * - ⚠️ 用例的 label/children 只用纯文本：L4 管线在 jsdom 过 CSSOM，会把颜色规范化
 *   成 rgb()（carousel 会话教训 #56）；样式契约只保留组件自有部分。
 *
 * 运行：node tests/compat/baseline/descriptions.mjs [--check]
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, '../baselines/descriptions.dom.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antdPkg = require('antd/package.json');
const antd = require('antd');
const { ConfigProvider, Descriptions } = antd;

const cases = [];
const push = (id, node) => {
  cases.push({ id, html: renderToStaticMarkup(node) });
};

const wrap = (node) =>
  h(ConfigProvider, { prefixCls: 'apollo', iconPrefixCls: 'apollo-icon' }, node);

const ITEMS = [
  { key: '1', label: 'Product', children: 'Cloud Database' },
  { key: '2', label: 'Billing', children: 'Prepaid' },
  { key: '3', label: 'time', children: '18:00:00' },
  { key: '4', label: 'Amount', children: '$80.00' },
];
const items = () => ITEMS.map((i) => ({ ...i }));

const P = (extra) => ({ items: items(), ...extra });

// ---- 基本形态 ----

push('descriptions:basic', wrap(h(Descriptions, P({}))));
push('descriptions:empty-items', wrap(h(Descriptions, { items: [] })));

// ---- 三形态 ----

push('descriptions:bordered', wrap(h(Descriptions, P({ bordered: true }))));
push('descriptions:vertical', wrap(h(Descriptions, P({ layout: 'vertical' }))));
push(
  'descriptions:vertical-bordered',
  wrap(h(Descriptions, P({ layout: 'vertical', bordered: true }))),
);

// ---- size / colon ----

push('descriptions:size-small', wrap(h(Descriptions, P({ size: 'small' }))));
push('descriptions:size-medium', wrap(h(Descriptions, P({ size: 'medium' }))));
push('descriptions:colon-false', wrap(h(Descriptions, P({ colon: false }))));

// ---- header ----

push('descriptions:title-extra', wrap(h(Descriptions, P({ title: 'Title', extra: 'Extra' }))));
push('descriptions:title-only', wrap(h(Descriptions, P({ title: 'Title' }))));

// ---- column / span / filled ----

push('descriptions:column-2', wrap(h(Descriptions, P({ column: 2 }))));
push(
  'descriptions:span-2',
  wrap(
    h(Descriptions, {
      items: [
        { key: '1', label: 'L1', children: 'C1', span: 2 },
        { key: '2', label: 'L2', children: 'C2' },
      ],
    }),
  ),
);
push(
  'descriptions:filled',
  wrap(
    h(Descriptions, {
      items: [
        { key: '1', label: 'L1', children: 'C1' },
        { key: '2', label: 'L2', children: 'C2', span: 'filled' },
      ],
    }),
  ),
);
push(
  'descriptions:bordered-span',
  wrap(
    h(Descriptions, {
      bordered: true,
      items: [
        { key: '1', label: 'L1', children: 'C1', span: 2 },
        { key: '2', label: 'L2', children: 'C2' },
      ],
    }),
  ),
);

// ---- 语义化 / labelStyle ----

push(
  'descriptions:semantic',
  wrap(
    h(
      Descriptions,
      P({
        classNames: { root: 'my-root', label: 'my-label', content: 'my-content' },
        styles: { label: { padding: '4px' } },
      }),
    ),
  ),
);
push('descriptions:label-style', wrap(h(Descriptions, P({ labelStyle: { padding: '4px' } }))));
push(
  'descriptions:bordered-semantic',
  wrap(
    h(
      Descriptions,
      P({
        bordered: true,
        classNames: { label: 'my-label' },
        styles: { label: { padding: '4px' } },
      }),
    ),
  ),
);

// ---- attrs 透传 ----

push('descriptions:attrs', wrap(h(Descriptions, P({ id: 'x', 'data-x': '1' }))));

const payload = {
  $comment:
    'DOM 基线：由 tests/compat/baseline/descriptions.mjs 从 antd 6.6.4 的 Descriptions 真实渲染生成。机械 oracle，禁止手改。行切分/补齐等运行时行为由 L1 覆盖（contract 档不投影它们）。',
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
    console.error('[compat:descriptions] ❌ 基线不是最新的');
    console.error('  运行: node tests/compat/baseline/descriptions.mjs');
    process.exit(1);
  }
  console.log(`[compat:descriptions] ✅ 基线最新（${cases.length} 个用例）`);
  process.exit(0);
}

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, serialized);
console.log(`[compat:descriptions] 用例 ${cases.length} 个`);
console.log(`写出 ${path.relative(process.cwd(), OUT_FILE)}`);
