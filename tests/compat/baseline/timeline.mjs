#!/usr/bin/env node
/**
 * tests/compat/baseline/timeline.mjs — 生成 antd 6.6.4 Timeline 的 DOM 基线（机械 oracle）
 *
 * 与 `list.mjs` / `avatar.mjs` 同一套路：**只做三件事** —— 构造用例、调用 React、写文件。
 * 归一化与比对在消费侧（`packages/ui/src/timeline/__tests__/semantic.test.ts`）完成，
 * 且必须**对称**。
 *
 * ── 🚨 这个基线的 DOM 是 **Steps 的 DOM** ──────────────────────────────────────
 *
 * `Timeline` 没有自己的 DOM（是 `Steps` 的薄壳）⇒ 产物里同时有 `ant-steps-*` 与
 * `ant-timeline-*` 两组类名，**根是 `<ol>`、项是 `<li>`**（由 `InternalContext` 覆盖）。
 * 这不是噪音 —— 它正是 Timeline 的**真实 DOM 契约**。
 *
 * ── 这个基线为什么是确定的（不 flaky）────────────────────────────────────────
 *
 * Timeline 没有浮层，也没有 effect ⇒ SSR 产物完全确定 ✓。
 * ⚠️ `Steps` 的 `useBreakpointXs` 在 SSR 里不订阅 ⇒ `responsive` 相关分支恒假。
 *
 * ── 用 `--check` 校验入库的产物没漂 ───────────────────────────────────────────
 *
 * 运行：
 *   node tests/compat/baseline/timeline.mjs
 *   node tests/compat/baseline/timeline.mjs --check
 *
 * React 与 antd 只允许出现在本目录（tests/compat）下，见 tests/compat/README.md §7。
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, '../baselines/timeline.dom.json');
const check = process.argv.includes('--check');

// ⚠️ 屏蔽 deprecated 告警（上游挂载即发 7 条；不是 DOM 契约）
const realError = console.error;
console.error = () => {};

const require = createRequire(import.meta.url);
const antd = require('antd');
const antdPkg = require('antd/package.json');
const { Timeline, ConfigProvider } = antd;

/** 两侧共用的前缀。取值就是我们的默认前缀。 */
const PREFIX = 'apollo';

const cases = [];

const withPrefix = (node, direction) =>
  h(
    ConfigProvider,
    { prefixCls: PREFIX, iconPrefixCls: 'apollo-icon', ...(direction ? { direction } : {}) },
    node,
  );

/**
 * 推入一个用例。
 *
 * ⚠️ **不传 `prefixCls` prop** —— 统一靠 ConfigProvider 的根前缀。
 */
const push = (id, props = {}, { direction, bare } = {}) => {
  const node = h(Timeline, props);
  cases.push({
    id,
    html: renderToStaticMarkup(bare ? node : withPrefix(node, direction)),
  });
};

const ITEMS = [
  { key: 'a', title: 'Create a services site', content: '2015-09-01' },
  { key: 'b', title: 'Solve initial network problems', content: '2015-09-01' },
  { key: 'c', title: 'Technical testing', content: '2015-09-01' },
];
const ITEMS_NO_TITLE = [
  { key: 'a', content: 'no title A' },
  { key: 'b', content: 'no title B' },
];
const ITEMS4 = [
  { key: 'a', title: 'A', content: 'content A' },
  { key: 'b', title: 'B', content: 'content B' },
  { key: 'c', title: 'C', content: 'content C' },
  { key: 'd', title: 'D', content: 'content D' },
];

// ---- 1. 基本形态 / 前缀 -----------------------------------------------------

push('timeline:basic', { items: ITEMS });
// 两侧都不传 prefixCls **且不包 Provider** → antd `ant-*` vs 我们 `apollo-*`（D1）
push('timeline:prefix-cls:no-props', { items: ITEMS }, { bare: true });
push('timeline:prefix-cls:custom', { prefixCls: 'custom', items: ITEMS });

// ---- 2. layoutAlternate 的两条判据 -----------------------------------------

// 纵向 + 有 title ⇒ 交错
push('timeline:layout-alternate-by-title', { items: ITEMS });
// 纵向 + **无** title ⇒ 不交错
push('timeline:layout-vertical-single', { items: ITEMS_NO_TITLE });
// 显式 alternate
push('timeline:layout-alternate-explicit', { mode: 'alternate', items: ITEMS4 });
// 横向（`-horizontal` 的一整套绝对定位）
push('timeline:layout-horizontal', { orientation: 'horizontal', items: ITEMS4 });

// ---- 3. mode 的归一 --------------------------------------------------------

// `left` → `start`（废弃）
push('timeline:mode-left', { mode: 'left', items: ITEMS });
// `right` → `end`（废弃）
push('timeline:mode-right', { mode: 'right', items: ITEMS });

// ---- 4. titleSpan 的两条分支 ------------------------------------------------

push('timeline:title-span-number', { titleSpan: 8, items: ITEMS });
push('timeline:title-span-string', { titleSpan: '40%', items: ITEMS });
// `alternate` 时**不**写 titleSpan
push('timeline:title-span-alternate', { mode: 'alternate', titleSpan: 8, items: ITEMS4 });

// ---- 5. color 的两条分支 ----------------------------------------------------

push('timeline:color-preset', {
  items: [
    { key: 'a', title: 'blue', color: 'blue' },
    { key: 'b', title: 'red', color: 'red' },
    { key: 'c', title: 'green', color: 'green' },
    { key: 'd', title: 'gray', color: 'gray' },
  ],
});
push('timeline:color-custom', {
  items: [{ key: 'a', title: 'custom', color: '#00f', style: { color: '#333' } }],
});

// ---- 6. 项的形态 -----------------------------------------------------------

push('timeline:loading', {
  items: [
    { key: 'a', title: 'loading', loading: true },
    { key: 'b', title: 'done' },
  ],
});
push('timeline:item-icon', {
  items: [{ key: 'a', title: 'A', icon: h('span', { className: 'my-icon' }, 'i') }],
});
// 四个废弃别名（label / children / dot / position）
push('timeline:item-aliases', {
  items: [
    { key: 'a', label: 'LABEL', children: 'CHILD', dot: h('span', { className: 'my-dot' }, 'd') },
  ],
});
// `pending` 追加一项
push('timeline:pending', { pending: 'Recording...', items: ITEMS_NO_TITLE });
push('timeline:pending-dot', {
  pending: 'Recording...',
  pendingDot: h('span', { className: 'my-pending' }, 'p'),
  items: ITEMS_NO_TITLE,
});

// ---- 7. reverse / variant --------------------------------------------------

push('timeline:reverse', { reverse: true, items: ITEMS });
push('timeline:variant-filled', { variant: 'filled', items: ITEMS });
push('timeline:variant-outlined', { variant: 'outlined', items: ITEMS });

// ---- 8. className / style / attrs / rtl ------------------------------------

push('timeline:className', {
  className: 'my-cls',
  rootClassName: 'my-root',
  items: ITEMS,
});
push('timeline:style', {
  style: { backgroundColor: '#fde3cf', color: '#f56a00' },
  items: ITEMS,
});
push('timeline:attrs', { id: 'my-id', 'data-x': 'y', items: ITEMS });
push('timeline:rtl', { items: ITEMS }, { direction: 'rtl' });

// ---- 9. 空 / 语义化槽 ------------------------------------------------------

push('timeline:empty', { items: [] });
push('timeline:semantic', {
  items: ITEMS,
  classNames: { item: 'my-item', itemTitle: 'my-title', itemRail: 'my-rail' },
  styles: { item: { margin: '1px' }, itemTitle: { color: 'rgb(1, 2, 3)' } },
});

const result = {
  $schema: '../schema.json',
  component: 'timeline',
  antdVersion: antdPkg.version,
  generatedAt: new Date().toISOString(),
  cases,
};

if (check) {
  const existing = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
  const same = JSON.stringify(existing.cases) === JSON.stringify(cases);
  if (!same) {
    console.error = realError;
    realError('[baseline] timeline.dom.json 与当前 antd 产物不一致');
    process.exit(1);
  }
  console.error = realError;
  console.log('[baseline] timeline: check ok,', cases.length, 'cases');
} else {
  fs.writeFileSync(OUT_FILE, `${JSON.stringify(result, null, 2)}\n`);
  console.log('[baseline] timeline: wrote', cases.length, 'cases →', OUT_FILE);
}
