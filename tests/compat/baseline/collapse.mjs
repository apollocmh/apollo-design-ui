#!/usr/bin/env node
/**
 * tests/compat/baseline/collapse.mjs — 生成 antd 6.6.4 Collapse 的 DOM 基线（机械 oracle）
 *
 * 关键取舍（docs/analysis/collapse.md §3）：
 * - items 首选形态 + children(deprecated) 双覆盖。
 * - SSR：CSSMotion 未展开的面板产出 -panel-hidden 残骸（removeOnLeave=false 默认
 *   destroyOnHidden=false ⇒ leavedClassName 残骸）——antd 的 leavedClassName 挂在
 *   motion 元素上，SSR 输出可见。
 * - 运行时切换/动画由 L1 覆盖。
 *
 * 运行：node tests/compat/baseline/collapse.mjs [--check]
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, '../baselines/collapse.dom.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antdPkg = require('antd/package.json');
const antd = require('antd');
const { ConfigProvider, Collapse } = antd;

const cases = [];
const push = (id, node) => {
  cases.push({ id, html: renderToStaticMarkup(node) });
};

const wrap = (node, extraProps) =>
  h(ConfigProvider, { prefixCls: 'apollo', iconPrefixCls: 'apollo-icon', ...extraProps }, node);

const ITEMS = [
  { key: '1', label: 'Header 1', children: 'Content 1' },
  { key: '2', label: 'Header 2', children: 'Content 2' },
];

// ---- basic（默认展开？antd 无 defaultActiveKey ⇒ 全收起） ----

push('collapse:basic', wrap(h(Collapse, { items: ITEMS })));

push('collapse:items-default-active', wrap(h(Collapse, { items: ITEMS, defaultActiveKey: '1' })));

push(
  'collapse:accordion',
  wrap(h(Collapse, { items: ITEMS, accordion: true, defaultActiveKey: '1' })),
);

// ---- 变体 ----

push('collapse:borderless', wrap(h(Collapse, { items: ITEMS, bordered: false })));

push('collapse:ghost', wrap(h(Collapse, { items: ITEMS, ghost: true })));

push('collapse:size-small', wrap(h(Collapse, { items: ITEMS, size: 'small' })));

push('collapse:size-large', wrap(h(Collapse, { items: ITEMS, size: 'large' })));

push(
  'collapse:icon-placement-end',
  wrap(h(Collapse, { items: ITEMS, expandIconPlacement: 'end' })),
);

push(
  'collapse:rtl',
  wrap(h(Collapse, { items: ITEMS, defaultActiveKey: ['1'] }), { direction: 'rtl' }),
);

push(
  'collapse:semantic',
  wrap(
    h(Collapse, {
      items: ITEMS,
      classNames: { root: 'cls-root', header: 'cls-header', body: 'cls-body' },
      styles: { header: { padding: '9px' } },
    }),
  ),
);

push(
  'collapse:collapsible-disabled',
  wrap(
    h(Collapse, {
      items: ITEMS.map((it) => ({ ...it, collapsible: 'disabled' })),
      defaultActiveKey: '1',
    }),
  ),
);

push(
  'collapse:children-deprecated',
  wrap(
    h(
      Collapse,
      { defaultActiveKey: '1' },
      h(Collapse.Panel, { key: '1', header: 'Header 1' }, 'Content 1'),
      h(Collapse.Panel, { key: '2', header: 'Header 2' }, 'Content 2'),
    ),
  ),
);

const payload = {
  $comment:
    'DOM 基线：由 tests/compat/baseline/collapse.mjs 从 antd 6.6.4 的 Collapse 真实渲染生成。机械 oracle，禁止手改。SSR 路径（含 CSSMotion 的 -panel-hidden 残骸）；运行时切换由 L1 覆盖。',
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
    console.error('[compat:collapse] ❌ 基线不是最新的');
    console.error('  运行: node tests/compat/baseline/collapse.mjs');
    process.exit(1);
  }
  console.log('[compat:collapse] 基线最新 ✓');
} else {
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, serialized);
  console.log(`[compat:collapse] 生成 ${cases.length} 个用例 -> ${OUT_FILE}`);
}
