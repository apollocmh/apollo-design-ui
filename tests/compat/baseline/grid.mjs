#!/usr/bin/env node
/**
 * tests/compat/baseline/grid.mjs — 生成 antd 6.6.4 Grid（Row/Col）的 DOM 基线（机械 oracle）
 *
 * 与 divider.mjs 同套路：构造用例、调 React、写文件，中间不做任何「理解」。
 *
 * ── 用例覆盖的刻意取舍 ────────────────────────────────────────────────────────
 *
 * - **响应式 gutter 对象不进基线**：React SSR 时 useBreakpoint 的 screens=null
 *   （useLayoutEffect 不执行）→ useGutter 兜底全命中 → 取 responsiveArray 第一个
 *   已定义断点（从大到小 → md:24）；而我们 Vue 侧在 jsdom **真实挂载**，subscribe
 *   立即回调 screens={全 false} → 无命中。两条渲染路径的 screens 语义不同，
 *   不是实现差异 —— 响应式 gutter 由 L1（matchMedia mock 驱动）覆盖。
 * - Row 与 Col 的类名共用「全前缀」机制：Row 用例传 `prefixCls:'apollo'`
 *   （根类名 'apollo'），Col 用例传 `prefixCls:'apollo-col'`（根类名 'apollo-col'）——
 *   两侧传同一个值，逐字比对。默认前缀由 `*:prefix-cls:no-props` 覆盖（D6）。
 *
 * 运行：node tests/compat/baseline/grid.mjs [--check]
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');
const OUT_FILE = path.join(__dirname, '../baselines/grid.dom.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antd = require('antd');
const antdPkg = require('antd/package.json');
const { Row, Col } = antd;

const cases = [];

const push = (id, node) => {
  cases.push({ id, html: renderToStaticMarkup(node) });
};

const ROW = { prefixCls: 'apollo' };
const COLP = { prefixCls: 'apollo-col' };

// ---- Row：类名与属性 --------------------------------------------------------

push('row:basic', h(Row, ROW, h('div', null, 'x')));
push('row:prefix-cls:no-props', h(Row, null, h('div', null, 'x')));
push('row:wrap-false', h(Row, { ...ROW, wrap: false }, h('div', null, 'x')));
push('row:justify-center', h(Row, { ...ROW, justify: 'center' }, h('div', null, 'x')));
push('row:align-middle', h(Row, { ...ROW, align: 'middle' }, h('div', null, 'x')));
push(
  'row:justify-align',
  h(Row, { ...ROW, justify: 'space-between', align: 'bottom' }, h('div', null, 'x')),
);
push('row:justify-invalid', h(Row, { ...ROW, justify: 'invalid' }, h('div', null, 'x')));

// ---- Row：gutter（keepStyle 侧消费）---------------------------------------

push('row:gutter-number', h(Row, { ...ROW, gutter: 16 }, h('div', null, 'x')));
push('row:gutter-array', h(Row, { ...ROW, gutter: [16, 24] }, h('div', null, 'x')));
push('row:gutter-string', h(Row, { ...ROW, gutter: '1rem' }, h('div', null, 'x')));
push('row:gutter-zero', h(Row, { ...ROW, gutter: [0, 16] }, h('div', null, 'x')));

// ---- Col：类名（keepStyle 侧消费）------------------------------------------

push('col:basic', h(Col, { ...COLP, span: 6 }, h('div', null, 'x')));
push('col:prefix-cls:no-props', h(Col, null, h('div', null, 'x')));
push('col:span-0', h(Col, { ...COLP, span: 0 }, h('div', null, 'x')));
push(
  'col:offset-push-pull-order',
  h(Col, { ...COLP, span: 6, offset: 4, push: 2, pull: 1, order: 3 }, h('div', null, 'x')),
);
push('col:offset-zero', h(Col, { ...COLP, span: 6, offset: 0 }, h('div', null, 'x')));

// ---- Col：flex ------------------------------------------------------------

push('col:flex-auto', h(Col, { ...COLP, flex: 'auto' }, h('div', null, 'x')));
push('col:flex-number', h(Col, { ...COLP, flex: 2 }, h('div', null, 'x')));
push('col:flex-length', h(Col, { ...COLP, flex: '100px' }, h('div', null, 'x')));
push('col:flex-zero', h(Col, { ...COLP, flex: 0 }, h('div', null, 'x')));

// ---- Col：响应式（类全量渲染；CSS 由 media query 裁决）----------------------

push('col:responsive-number', h(Col, { ...COLP, xs: 2, sm: 4, md: 6 }, h('div', null, 'x')));
push(
  'col:responsive-obj',
  h(Col, { ...COLP, xs: { span: 5, offset: 1 }, lg: { span: 6, offset: 2 } }, h('div', null, 'x')),
);
push(
  'col:responsive-flex',
  h(Col, { ...COLP, sm: { flex: 'auto' }, md: { flex: '100px' } }, h('div', null, 'x')),
);

// ---- 组合：Row(wrap=false) + Col(flex) 的 minWidth hack ----------------------

push(
  'grid:row-col-min-width-hack',
  h(
    Row,
    { prefixCls: 'rowp', wrap: false, gutter: 16 },
    h(Col, { prefixCls: 'colp', flex: 'auto' }, h('div', null, 'x')),
  ),
);

// ---------------------------------------------------------------------------

const payload = {
  $comment:
    'DOM 基线：由 tests/compat/baseline/grid.mjs 从 antd 6.6.4 的 Grid（Row/Col）真实渲染生成。机械 oracle，禁止手改。重新生成：node tests/compat/baseline/grid.mjs',
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
    console.error('[compat:grid] ❌ 基线不是最新的');
    console.error('  运行: node tests/compat/baseline/grid.mjs');
    process.exit(1);
  }
  console.log(`[compat:grid] ✅ 基线最新（${cases.length} 个用例）`);
  process.exit(0);
}

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, serialized);
console.log(`[compat:grid] 用例 ${cases.length} 个`);
console.log(`写出 ${path.relative(REPO_ROOT, OUT_FILE)}`);
