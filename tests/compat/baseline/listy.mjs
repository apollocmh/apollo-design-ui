#!/usr/bin/env node
/**
 * tests/compat/baseline/listy.mjs — 生成 antd 6.6.4 Listy 的 DOM 基线（机械 oracle）
 *
 * 关键取舍（docs/analysis/listy.md §4）：
 * - 只覆盖 **Raw 路径**（antd 默认 virtual=false）：basic / group / group-sticky /
 *   rtl / height / semantic。
 * - 虚拟模式的 DOM 由 @apollo-design/virtual-list 决定（原生滚动、无自绘滚动条），
 *   与 rc-virtual-list 必然不同 —— foundation 契约 §5.1 的 PLATFORM，不进 byte 级
 *   oracle，由 L1 行为测试覆盖。
 * - ⚠️ antd 的 ListyProps **Omit 了 direction** —— 方向只来自 ConfigProvider，
 *   不是公开 prop（实测确认：传 direction prop 被上下文值覆盖）。
 * - 组头 title 输出纯文本（颜色等用户样式不进契约，carousel 会话教训 #56）。
 *
 * 运行：node tests/compat/baseline/listy.mjs [--check]
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, '../baselines/listy.dom.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antdPkg = require('antd/package.json');
const antd = require('antd');
const { ConfigProvider, Listy } = antd;

const cases = [];
const push = (id, node) => {
  cases.push({ id, html: renderToStaticMarkup(node) });
};

const wrap = (node, extraProps) =>
  h(ConfigProvider, { prefixCls: 'apollo', iconPrefixCls: 'apollo-icon', ...extraProps }, node);

const ITEMS = Array.from({ length: 5 }, (_, i) => ({ key: i, content: `Item ${i}` }));
const GROUP_ITEMS = Array.from({ length: 6 }, (_, i) => ({
  key: i,
  group: `Group ${i % 2}`,
  content: `Item ${i}`,
}));
const GROUP = {
  key: (item) => item.group,
  title: (key, groupItemsOfKey) => `${key} (${groupItemsOfKey.length})`,
};

// ---- Raw：基本 ----

push(
  'listy:basic',
  wrap(h(Listy, { items: ITEMS, rowKey: 'key', itemRender: (item) => item.content })),
);

push('listy:empty-items', wrap(h(Listy, { items: [], rowKey: 'key', itemRender: () => null })));

// ---- Raw：分组 ----

push(
  'listy:group',
  wrap(
    h(Listy, {
      items: GROUP_ITEMS,
      rowKey: 'key',
      group: GROUP,
      itemRender: (item) => item.content,
    }),
  ),
);

push(
  'listy:group-sticky',
  wrap(
    h(Listy, {
      items: GROUP_ITEMS,
      rowKey: 'key',
      group: GROUP,
      sticky: true,
      itemRender: (item) => item.content,
    }),
  ),
);

// ---- Raw：方向 / 高度 / 语义 ----

push(
  'listy:rtl',
  wrap(h(Listy, { items: ITEMS, rowKey: 'key', itemRender: (item) => item.content }), {
    direction: 'rtl',
  }),
);

push(
  'listy:height',
  wrap(h(Listy, { items: ITEMS, rowKey: 'key', height: 120, itemRender: (item) => item.content })),
);

push(
  'listy:semantic',
  wrap(
    h(Listy, {
      items: ITEMS,
      rowKey: 'key',
      itemRender: (item) => item.content,
      classNames: { root: 'cls-root', item: 'cls-item', groupHeader: 'cls-header' },
      styles: { item: { padding: '9px' } },
    }),
  ),
);

const payload = {
  $comment:
    'DOM 基线：由 tests/compat/baseline/listy.mjs 从 antd 6.6.4 的 Listy 真实渲染生成。机械 oracle，禁止手改。仅覆盖 Raw 路径（antd 默认 virtual=false）；虚拟模式走 L1 行为测试（foundation PLATFORM，见 docs/analysis/listy.md §4.3）。',
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
    console.error('[compat:listy] ❌ 基线不是最新的');
    console.error('  运行: node tests/compat/baseline/listy.mjs');
    process.exit(1);
  }
  console.log('[compat:listy] 基线最新 ✓');
} else {
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, serialized);
  console.log(`[compat:listy] 生成 ${cases.length} 个用例 -> ${OUT_FILE}`);
}
