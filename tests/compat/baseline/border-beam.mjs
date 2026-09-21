#!/usr/bin/env node
/**
 * tests/compat/baseline/border-beam.mjs — 生成 antd 6.6.4 BorderBeam 的 DOM 基线
 *
 * ⚠️ BorderBeam 的 Effect 是**客户端 portal**（createPortal 到 child DOM）——
 *    SSR 产物里只有宿主本身（hostDom 为 null，Effect 返回 null）。两条渲染路径
 *    在这一点上平台一致。所以基线钉的是「宿主透传 + Effect 不出现在 SSR」，
 *    Effect 的结构与样式串由 L1（挂载后查询）钉死，视觉由 L6 覆盖。
 *
 * 运行：node tests/compat/baseline/border-beam.mjs [--check]
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, '../baselines/border-beam.dom.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antdPkg = require('antd/package.json');
const antd = require('antd');
const { BorderBeam } = antd;

const cases = [];
const push = (id, node) => {
  cases.push({ id, html: renderToStaticMarkup(node) });
};

const HOST = { style: { position: 'relative', border: '2px solid #ddd', padding: '16px' } };

push('border-beam:prefix-cls:no-props', h('div', HOST, h(BorderBeam, null, h('div', null, 'x'))));
push(
  'border-beam:basic',
  h('div', HOST, h(BorderBeam, { prefixCls: 'apollo-border-beam' }, h('div', null, 'x'))),
);
push(
  'border-beam:props',
  h(
    'div',
    HOST,
    h(
      BorderBeam,
      {
        prefixCls: 'apollo-border-beam',
        color: 'blue',
        count: 3,
        duration: 9,
        lineWidth: 8,
        outset: 6,
        size: 160,
      },
      h('div', null, 'x'),
    ),
  ),
);

const payload = {
  $comment:
    'DOM 基线：由 tests/compat/baseline/border-beam.mjs 从 antd 6.6.4 的 BorderBeam 真实渲染生成。机械 oracle，禁止手改。',
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
    console.error('[compat:border-beam] ❌ 基线不是最新的');
    console.error('  运行: node tests/compat/baseline/border-beam.mjs');
    process.exit(1);
  }
  console.log(`[compat:border-beam] ✅ 基线最新（${cases.length} 个用例）`);
  process.exit(0);
}

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, serialized);
console.log(`[compat:border-beam] 用例 ${cases.length} 个`);
