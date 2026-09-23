#!/usr/bin/env node
/**
 * tests/compat/baseline/splitter.mjs — 生成 antd 6.6.4 Splitter 的 DOM 基线（机械 oracle）
 *
 * 关键取舍（docs/analysis/splitter.md §3/§7）：
 * - 只覆盖 **SSR 路径**（容器未测量 ⇒ panelSizes 落开发者原值，DOM 稳定）；
 *   拖拽/折叠等运行时行为由 L1 钉。
 * - 图标（Left/Right/Up/DownOutlined）进入契约 —— 折叠按钮的 span 内容。
 * - aria-valuenow 在 SSR 是 stack 比例 ×100（containerSize=0 ⇒ ptg 仍归一化）。
 *
 * 运行：node tests/compat/baseline/splitter.mjs [--check]
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, '../baselines/splitter.dom.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antdPkg = require('antd/package.json');
const antd = require('antd');
const { ConfigProvider, Splitter } = antd;

const cases = [];
const push = (id, node) => {
  cases.push({ id, html: renderToStaticMarkup(node) });
};

const wrap = (node, extraProps) =>
  h(ConfigProvider, { prefixCls: 'apollo', iconPrefixCls: 'apollo-icon', ...extraProps }, node);

const BOX = { style: { height: 200 } };

// ---- 基本 ----

push(
  'splitter:basic',
  wrap(h(Splitter, BOX, h(Splitter.Panel, null, 'Left'), h(Splitter.Panel, null, 'Right'))),
);

push(
  'splitter:vertical',
  wrap(
    h(
      Splitter,
      { ...BOX, orientation: 'vertical' },
      h(Splitter.Panel, null, 'Top'),
      h(Splitter.Panel, null, 'Bottom'),
    ),
  ),
);

// ---- deprecated layout ----

push(
  'splitter:layout-deprecated',
  wrap(
    h(
      Splitter,
      { ...BOX, layout: 'vertical' },
      h(Splitter.Panel, null, 'Top'),
      h(Splitter.Panel, null, 'Bottom'),
    ),
  ),
);

// ---- 折叠 ----

push(
  'splitter:collapsible',
  wrap(
    h(
      Splitter,
      BOX,
      h(Splitter.Panel, { collapsible: true, min: '20%', defaultSize: '40%' }, 'Left'),
      h(Splitter.Panel, { collapsible: true }, 'Right'),
    ),
  ),
);

push(
  'splitter:collapsible-icon-custom',
  wrap(
    h(
      Splitter,
      { ...BOX, collapsible: { icon: { start: 'S', end: 'E' } } },
      h(Splitter.Panel, { collapsible: true }, 'Left'),
      h(Splitter.Panel, { collapsible: true }, 'Right'),
    ),
  ),
);

// ---- 多面板 + 尺寸 ----

push(
  'splitter:multiple',
  wrap(
    h(
      Splitter,
      BOX,
      h(Splitter.Panel, { collapsible: true, defaultSize: '20%', min: '10%' }, 'Left'),
      h(Splitter.Panel, { defaultSize: '40%' }, 'Center'),
      h(Splitter.Panel, { max: '60%', collapsible: true }, 'Right'),
    ),
  ),
);

push(
  'splitter:size-px',
  wrap(
    h(
      Splitter,
      BOX,
      h(Splitter.Panel, { size: 100, onResize: () => {} }, 'Left'),
      h(Splitter.Panel, { onResize: () => {} }, 'Right'),
    ),
  ),
);

// ---- RTL / 语义 ----

push(
  'splitter:rtl',
  wrap(
    h(
      Splitter,
      BOX,
      h(Splitter.Panel, null, 'Left'),
      h(Splitter.Panel, { collapsible: true }, 'Right'),
    ),
    { direction: 'rtl' },
  ),
);

push(
  'splitter:semantic',
  wrap(
    h(
      Splitter,
      {
        ...BOX,
        classNames: { root: 'cls-root', panel: 'cls-panel', dragger: 'cls-dragger' },
        styles: { panel: { padding: '4px' }, dragger: { default: { color: 'red' } } },
      },
      h(Splitter.Panel, null, 'Left'),
      h(Splitter.Panel, null, 'Right'),
    ),
  ),
);

const payload = {
  $comment:
    'DOM 基线：由 tests/compat/baseline/splitter.mjs 从 antd 6.6.4 的 Splitter 真实渲染生成。机械 oracle，禁止手改。仅覆盖 SSR 路径（容器未测量）；拖拽/折叠行为由 L1 覆盖。',
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
    console.error('[compat:splitter] ❌ 基线不是最新的');
    console.error('  运行: node tests/compat/baseline/splitter.mjs');
    process.exit(1);
  }
  console.log('[compat:splitter] 基线最新 ✓');
} else {
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, serialized);
  console.log(`[compat:splitter] 生成 ${cases.length} 个用例 -> ${OUT_FILE}`);
}
