#!/usr/bin/env node
/**
 * tests/compat/baseline/masonry.mjs — 生成 antd 6.6.4 Masonry 的 DOM 基线（机械 oracle）
 *
 * 与 `flex.mjs` / `date-picker.mjs` 同一套路：**只做三件事** —— 构造用例、调用 React、写文件。
 * 中间不经过任何「理解」步骤。归一化与比对在消费侧
 * （`packages/ui/src/masonry/__tests__/semantic.test.ts`）完成，且必须**对称**。
 *
 * ── 这个基线为什么是确定的（不 flaky）────────────────────────────────────────
 *
 * Masonry 的 item 位置来自**实测高度**（`getBoundingClientRect`），而 SSR 没有布局
 * ⇒ `itemHeights` 为空 ⇒ `positions` 为空 ⇒ **所有 item 的 `columnIndex` 都是 0、
 * 且不写 `top`**，根高恒 `0px`。所以 SSR 产物是确定的 ✓
 * （上游自己也只能靠 `spyElementPrototypes` mock rect 才测排布）。
 *
 * ⇒ 本基线钉的是**结构**：根/条目的类名与内联样式**模板**、语义化槽、RTL、
 * 以及「`columns` 在 SSR 下解析成什么」。**排布结果由 L1 纯函数 + L6 真浏览器负责。**
 *
 * ── 关于 prefixCls（关键，同 divider/flex）──────────────────────────────────
 *
 * 给每个用例显式传 `prefixCls: 'apollo'`，两侧传同一个值，类名逐字比对。
 * 默认前缀（`apollo` vs `ant`）由 `prefix-cls:no-props` 单独覆盖（消费侧 allow 登记为 D1）。
 *
 * 运行：
 *   node tests/compat/baseline/masonry.mjs
 *   node tests/compat/baseline/masonry.mjs --check   # 只校验基线是否最新
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
const OUT_FILE = path.join(__dirname, '../baselines/masonry.dom.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antd = require('antd');
const antdPkg = require('antd/package.json');
const { Masonry, ConfigProvider } = antd;

/** 两侧共用的前缀。取值就是我们的默认前缀。 */
const PREFIX = 'apollo';

/** 固定高度，避免任何与运行时刻相关的东西。 */
const HEIGHTS = [150, 30, 90, 70, 110];

/** 简化的 item 内容：只留「有类名 + 有文本」，避免样式噪音。 */
const renderBamboo = ({ data, index, column }) =>
  h(
    'div',
    { className: 'bamboo', 'data-height': String(data), 'data-column': String(column) },
    String(index + 1),
  );

const buildItems = (heights = HEIGHTS) =>
  heights.map((height, index) => ({ key: `item-${index}`, data: height }));

const cases = [];

/** `wrap` 用于需要 ConfigProvider 的用例（RTL / 默认前缀）。 */
const push = (id, props, { wrap } = {}) => {
  const node = h(Masonry, { itemRender: renderBamboo, items: buildItems(), ...props });
  cases.push({ id, html: renderToStaticMarkup(wrap ? wrap(node) : node) });
};

/** `prefixCls: 'apollo'` ⇒ Masonry 的类名是 `apollo-masonry`（上游传的是字面量 `'masonry'`）。 */
const BP = { prefixCls: PREFIX };

const withPrefix = (node) =>
  h(ConfigProvider, { prefixCls: PREFIX, iconPrefixCls: 'apollo-icon' }, node);

// ---- 1. 基本形态 -----------------------------------------------------------

push('masonry:basic', BP);
// 两侧都不传 prefixCls → antd 用 `ant-masonry`、我们用 `apollo-masonry`（消费侧 allow 登记 D1）
push('masonry:prefix-cls:no-props', {});
push('masonry:prefix-cls:custom', { prefixCls: 'custom' });
push('masonry:empty', { ...BP, items: [] });

// ---- 2. 列数 ---------------------------------------------------------------

push('masonry:columns-1', { ...BP, columns: 1 });
push('masonry:columns-4', { ...BP, columns: 4 });
// 🚨 `columns={0}` 是 falsy ⇒ 落到默认 3（不是 0 列）
push('masonry:columns-0', { ...BP, columns: 0 });
// 响应式对象：SSR 的 `screens` 是 `{}` ⇒ 一个断点都不命中 ⇒ `columns.xs ?? 1`
push('masonry:columns-responsive', { ...BP, columns: { xs: 1, sm: 2, md: 3 } });
push('masonry:columns-responsive-no-xs', { ...BP, columns: { md: 3 } });

// ---- 3. 间距 ---------------------------------------------------------------

push('masonry:gutter-number', { ...BP, gutter: 16 });
push('masonry:gutter-array', { ...BP, gutter: [8, 16] });
// 响应式 gutter：SSR 时 `useGutter` 把全部断点视为 true ⇒ 命中 xxxl（数组第一个）
push('masonry:gutter-responsive', { ...BP, gutter: { sm: 8, md: 16 } });

// ---- 4. 内容来源：`children` 优先于 `itemRender` ---------------------------

push('masonry:item-children', {
  ...BP,
  items: [
    { key: 'a', data: 10, children: h('div', { className: 'from-children' }, 'A') },
    { key: 'b', data: 20 },
  ],
});
// 两者都没有 ⇒ 条目是空的
push('masonry:item-no-content', {
  ...BP,
  itemRender: undefined,
  items: [{ key: 'a', data: 10 }],
});

// ---- 5. 语义化 -------------------------------------------------------------

push('masonry:class-names', {
  ...BP,
  classNames: { root: 'custom-root', item: 'custom-item' },
});
push('masonry:styles', {
  ...BP,
  classNames: { root: 'custom-root' },
  styles: { root: { border: '2px solid red' }, item: { padding: '10px' } },
});
// 函数式变体：入参的 `props.columns` 是**解析后的列数**
push('masonry:class-names-fn', {
  ...BP,
  columns: 4,
  classNames: ({ props }) => ({ root: `cols-${props.columns}`, item: 'fn-item' }),
});

// ---- 6. RTL（走 ConfigProvider 的 direction）-------------------------------

push('masonry:rtl', BP, {
  wrap: (node) =>
    h(ConfigProvider, { prefixCls: PREFIX, iconPrefixCls: 'apollo-icon', direction: 'rtl' }, node),
});

// ---- 7. key 的形态（数字 key / 缺 key 用 index 兜底）----------------------

push('masonry:key-number', {
  ...BP,
  items: [
    { key: 0, data: 10 },
    { key: 1, data: 20 },
  ],
});
push('masonry:key-fallback-index', {
  ...BP,
  items: [{ data: 10 }, { data: 20 }],
});

void withPrefix;

const result = {
  $schema: '../schema.json',
  component: 'masonry',
  antdVersion: antdPkg.version,
  generatedAt: new Date().toISOString(),
  cases,
};

if (check) {
  const existing = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
  const same = JSON.stringify(existing.cases) === JSON.stringify(cases);
  if (!same) {
    console.error('[baseline] masonry.dom.json 与当前 antd 产物不一致');
    process.exit(1);
  }
  console.log('[baseline] masonry: check ok,', cases.length, 'cases');
} else {
  fs.writeFileSync(OUT_FILE, `${JSON.stringify(result, null, 2)}\n`);
  console.log('[baseline] masonry: wrote', cases.length, 'cases →', OUT_FILE);
}
