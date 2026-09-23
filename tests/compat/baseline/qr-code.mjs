#!/usr/bin/env node
/**
 * tests/compat/baseline/qr-code.mjs — 生成 antd 6.6.4 QRCode 的 DOM 基线（机械 oracle）
 *
 * 关键取舍（docs/analysis/qr-code.md）：
 * - **SVG 形态是 byte 级 oracle 的主战场**：path `d` 由 QR 矩阵唯一决定，本仓
 *   engine 与 antd 链路同源（Nayuki qrcodegen）⇒ 逐字节可对齐。
 * - canvas 形态在 SSR 里只是 `<canvas>` 空元素（绘制在浏览器端 useEffect），
 *   同样可对齐 DOM 结构。
 * - status 覆盖层的文案来自默认 locale（en）。
 *
 * 运行：node tests/compat/baseline/qr-code.mjs [--check]
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, '../baselines/qr-code.dom.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antdPkg = require('antd/package.json');
const antd = require('antd');
const { ConfigProvider, QRCode } = antd;

const cases = [];
const push = (id, node) => {
  cases.push({ id, html: renderToStaticMarkup(node) });
};

const wrap = (node, extraProps) =>
  h(ConfigProvider, { prefixCls: 'apollo', iconPrefixCls: 'apollo-icon', ...extraProps }, node);

// ---- basic ----

push('qr-code:basic', wrap(h(QRCode, { value: 'https://apollo.design' })));

push('qr-code:borderless', wrap(h(QRCode, { value: 'https://apollo.design', bordered: false })));

// ---- svg（path `d` 是矩阵的确定性序列化） ----

push('qr-code:svg', wrap(h(QRCode, { value: 'https://apollo.design', type: 'svg' })));

push(
  'qr-code:svg-color',
  wrap(
    h(QRCode, {
      value: 'https://apollo.design',
      type: 'svg',
      color: '#1677ff',
      bgColor: '#f0f5ff',
    }),
  ),
);

// ---- 状态覆盖层 ----

push(
  'qr-code:status-expired',
  wrap(h(QRCode, { value: 'https://apollo.design', status: 'expired', onRefresh: () => {} })),
);

push(
  'qr-code:status-scanned',
  wrap(h(QRCode, { value: 'https://apollo.design', status: 'scanned' })),
);

push(
  'qr-code:status-loading',
  wrap(h(QRCode, { value: 'https://apollo.design', status: 'loading' })),
);

// ---- 语义 ----

push(
  'qr-code:semantic',
  wrap(
    h(QRCode, {
      value: 'https://apollo.design',
      classNames: { root: 'cls-root', cover: 'cls-cover' },
      styles: { root: { padding: '8px' } },
    }),
  ),
);

const payload = {
  $comment:
    'DOM 基线：由 tests/compat/baseline/qr-code.mjs 从 antd 6.6.4 的 QRCode 真实渲染生成。机械 oracle，禁止手改。SVG path 的 `d` 由 QR 矩阵唯一决定（engine 与 antd 同源 Nayuki qrcodegen）⇒ byte 级可对齐。',
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
    console.error('[compat:qr-code] ❌ 基线不是最新的');
    console.error('  运行: node tests/compat/baseline/qr-code.mjs');
    process.exit(1);
  }
  console.log('[compat:qr-code] 基线最新 ✓');
} else {
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, serialized);
  console.log(`[compat:qr-code] 生成 ${cases.length} 个用例 -> ${OUT_FILE}`);
}
