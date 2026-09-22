#!/usr/bin/env node
/**
 * tests/compat/baseline/watermark.mjs — 生成 antd 6.6.4 Watermark 的 DOM 基线（机械 oracle）
 *
 * 关键取舍（G1 §2）：
 * - **水印 div 不进基线**：它是运行时 `append` 的（canvas 绘制 + toDataURL），
 *   SSR 恒不产 —— 与 Vue 侧同构。绘制结果由 L1（canvas stub）与 L6（视觉）钉。
 * - SSR 可比的部分只有：根 div 的 class 合成、fixedStyle（position/overflow）、
 *   以及 children 透传。
 * - 覆盖：className / rootClassName / style 合并、单行与多行 content、
 *   image、gap/offset/zIndex/rotate（不影响 SSR DOM，但确认不报错）、
 *   inherit=false、children 多节点与文本。
 *
 * 运行：node tests/compat/baseline/watermark.mjs [--check]
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, '../baselines/watermark.dom.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antdPkg = require('antd/package.json');
const antd = require('antd');
const { ConfigProvider, Watermark } = antd;

const cases = [];
const push = (id, node) => {
  cases.push({ id, html: renderToStaticMarkup(node) });
};

const wrap = (node) =>
  h(ConfigProvider, { prefixCls: 'apollo', iconPrefixCls: 'apollo-icon' }, node);

// ---- 基本形态 ----

push('watermark:no-props', wrap(h(Watermark)));
push(
  'watermark:basic',
  wrap(h(Watermark, { content: 'Ant Design' }, h('div', { style: { height: 500 } }))),
);
push(
  'watermark:multi-line',
  wrap(
    h(
      Watermark,
      { content: ['Ant Design', { text: 'Happy Working', font: { fontSize: 12 } }] },
      h('div', { style: { height: 500 } }),
    ),
  ),
);
push(
  'watermark:image',
  wrap(h(Watermark, { height: 30, width: 130, image: 'https://test.svg' }, h('div', null, 'x'))),
);

// ---- class / style 合成 ----

push('watermark:class-name', wrap(h(Watermark, { className: 'cn' }, h('div', null, 'x'))));
push(
  'watermark:root-class-name',
  wrap(h(Watermark, { rootClassName: 'rcn' }, h('div', null, 'x'))),
);
push(
  'watermark:class-both',
  wrap(h(Watermark, { className: 'cn', rootClassName: 'rcn' }, h('div', null, 'x'))),
);
push(
  'watermark:style-merge',
  wrap(h(Watermark, { style: { height: 200, background: 'red' } }, h('div', null, 'x'))),
);
push(
  'watermark:style-override-fixed',
  wrap(h(Watermark, { style: { position: 'absolute', overflow: 'visible' } }, h('div', null, 'x'))),
);

// ---- 不影响 SSR DOM 的参数（确认不报错且 DOM 同构）----

push('watermark:gap', wrap(h(Watermark, { content: 'x', gap: [20, 30] }, h('div', null, 'x'))));
push(
  'watermark:offset',
  wrap(h(Watermark, { content: 'x', offset: [10, 20] }, h('div', null, 'x'))),
);
push(
  'watermark:z-index-rotate',
  wrap(h(Watermark, { content: 'x', zIndex: 5, rotate: -45 }, h('div', null, 'x'))),
);
push(
  'watermark:inherit-false',
  wrap(h(Watermark, { content: 'x', inherit: false }, h('div', null, 'x'))),
);

// ---- children 形态 ----

push('watermark:children-text', wrap(h(Watermark, { content: 'x' }, 'plain text')));
push(
  'watermark:children-multi',
  wrap(h(Watermark, { content: 'x' }, h('p', null, 'a'), h('p', null, 'b'))),
);
push('watermark:children-none', wrap(h(Watermark, { content: 'x' })));
push(
  'watermark:font',
  wrap(h(Watermark, { content: 'x', font: { color: 'red', fontSize: 20 } }, h('div', null, 'x'))),
);

const payload = {
  $comment:
    'DOM 基线：由 tests/compat/baseline/watermark.mjs 从 antd 6.6.4 的 Watermark 真实渲染生成。机械 oracle，禁止手改。水印 div 是运行时 append 的，SSR 不产（L1/L6 覆盖）。',
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
    console.error('[compat:watermark] ❌ 基线不是最新的');
    console.error('  运行: node tests/compat/baseline/watermark.mjs');
    process.exit(1);
  }
  console.log(`[compat:watermark] ✅ 基线最新（${cases.length} 个用例）`);
  process.exit(0);
}

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, serialized);
console.log(`[compat:watermark] 用例 ${cases.length} 个`);
console.log(`写出 ${path.relative(process.cwd(), OUT_FILE)}`);
