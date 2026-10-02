#!/usr/bin/env node
/**
 * tests/compat/baseline/list.mjs — 生成 antd 6.6.4 List 的 DOM 基线（机械 oracle）
 *
 * 与 `avatar.mjs` / `card.mjs` 同一套路：**只做三件事** —— 构造用例、调用 React、写文件。
 * 归一化与比对在消费侧（`packages/ui/src/list/__tests__/semantic.test.ts`）完成，且必须**对称**。
 *
 * ── 这个基线为什么是确定的（不 flaky）────────────────────────────────────────
 *
 * List 没有浮层（分页不带下拉时不开浮层；`-item-action` 是行内 `<ul>`），
 * 也没有 effect ⇒ SSR 产物完全确定 ✓。
 * ⚠️ `useBreakpoint` 在 SSR 里**不订阅**（`onMounted` 才订阅）⇒ `screens` 是默认 `{}`
 * ⇒ `currentBreakpoint` 恒 `undefined` ⇒ `colStyle` 走 `grid.column`（确定值）。
 *
 * ── 🚨 `List` 在 antd 6.6.4 里整体 deprecated ────────────────────────────────
 *
 * 每次渲染都会 `console.error` 一条告警 ⇒ 生成器里**屏蔽 console.error**，
 * 否则 20 条用例会刷 20 行噪音（告警不是 DOM 契约的一部分）。
 *
 * ── 用 `--check` 校验入库的产物没漂 ───────────────────────────────────────────
 *
 * 运行：
 *   node tests/compat/baseline/list.mjs
 *   node tests/compat/baseline/list.mjs --check
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
const OUT_FILE = path.join(__dirname, '../baselines/list.dom.json');
const check = process.argv.includes('--check');

// ⚠️ 屏蔽 deprecated 告警（上游每次渲染都发；不是 DOM 契约）
const realError = console.error;
console.error = () => {};

const require = createRequire(import.meta.url);
const antd = require('antd');
const antdPkg = require('antd/package.json');
const { List, ConfigProvider } = antd;

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
 * ⚠️ **不传 `prefixCls` prop** —— 统一靠 ConfigProvider 的根前缀，
 * 这样 `.apollo-list` 与 `.apollo-list-container` 两侧同前缀。
 */
const push = (id, props = {}, { children, direction, bare } = {}) => {
  const node = h(List, props, children);
  cases.push({
    id,
    html: renderToStaticMarkup(bare ? node : withPrefix(node, direction)),
  });
};

const DATA = ['Alpha', 'Beta', 'Gamma'];
const DATA6 = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta'];

/** 最简的字符项。 */
const textItem = (item) => h(List.Item, { key: item }, item);
/** 带 Meta 的项。 */
const metaItem = (item) =>
  h(
    List.Item,
    { key: item },
    h(List.Item.Meta, {
      avatar: h('span', { className: 'my-avatar' }),
      title: item,
      description: 'desc',
    }),
  );
/** 带 actions 的项。 */
const actionItem = (item) =>
  h(
    List.Item,
    {
      key: item,
      actions: [
        h('a', { key: 'e', href: '#edit' }, 'edit'),
        h('a', { key: 'm', href: '#more' }, 'more'),
      ],
    },
    item,
  );

// ---- 1. 基本形态 / 前缀 -----------------------------------------------------

push('list:basic', { dataSource: DATA, renderItem: textItem });
// 两侧都不传 prefixCls **且不包 Provider** → antd `ant-list*` vs 我们 `apollo-list*`（D1）
push('list:prefix-cls:no-props', { dataSource: DATA, renderItem: textItem }, { bare: true });
push('list:prefix-cls:custom', { prefixCls: 'custom', dataSource: DATA, renderItem: textItem });

// ---- 2. 空态 / children -----------------------------------------------------

// 无 dataSource、无 children、非 loading ⇒ `-empty-text` 三级回退
push('list:empty');
// 有 children ⇒ **不**渲染空态（children 走 Spin 的 slot）
push('list:children', {}, { children: h('div', null, 'custom content') });
// dataSource 有值但 renderItem 未传 ⇒ 仍渲染 `<ul>`，但里面没有 `<li>`
push('list:no-render-item', { dataSource: DATA });
// locale.emptyText 覆盖默认空态
push('list:empty-locale', { locale: { emptyText: 'no data' } });

// ---- 3. header / footer / loadMore / split ---------------------------------

push('list:header-footer', {
  header: 'Header',
  footer: 'Footer',
  dataSource: DATA,
  renderItem: textItem,
});
push('list:loadmore', {
  loadMore: h('div', null, 'more'),
  dataSource: DATA,
  renderItem: textItem,
});
push('list:split-false', { split: false, dataSource: DATA, renderItem: textItem });

// ---- 4. size / bordered -----------------------------------------------------

push('list:size-large', { size: 'large', dataSource: DATA, renderItem: textItem });
push('list:size-small', { size: 'small', dataSource: DATA, renderItem: textItem });
push('list:size-default', { size: 'default', dataSource: DATA, renderItem: textItem });
push('list:bordered', { bordered: true, dataSource: DATA, renderItem: textItem });
push('list:bordered-sm', {
  bordered: true,
  size: 'small',
  header: 'H',
  footer: 'F',
  dataSource: DATA,
  renderItem: textItem,
});
push('list:bordered-lg', {
  bordered: true,
  size: 'large',
  header: 'H',
  footer: 'F',
  dataSource: DATA,
  renderItem: textItem,
});

// ---- 5. item 的形态 ---------------------------------------------------------

push('list:item-meta', { dataSource: DATA, renderItem: metaItem });
push('list:item-actions', { dataSource: DATA, renderItem: actionItem });
// `-item-no-flex`：两个**字符串**子节点（上游判 `isString`）
push('list:item-no-flex', {
  dataSource: DATA,
  renderItem: (item) => h(List.Item, { key: item }, item, '-more'),
});
// extra 与 children 平级（非 vertical）
push('list:item-extra', {
  dataSource: DATA,
  renderItem: (item) => h(List.Item, { key: item, extra: h('span', null, 'E') }, item),
});

// ---- 6. vertical ------------------------------------------------------------

push('list:vertical', {
  itemLayout: 'vertical',
  dataSource: DATA,
  // ⚠️ 必须传 **Meta 元素本身**（不是 `metaItem(item).props.children` —— 那是 undefined）
  renderItem: (item) =>
    h(
      List.Item,
      { key: item, extra: h('span', null, 'E') },
      h(List.Item.Meta, { title: item, description: 'desc' }),
    ),
});
// vertical 但**没有** extra ⇒ 走平级分支
push('list:vertical-no-extra', {
  itemLayout: 'vertical',
  dataSource: DATA,
  renderItem: textItem,
});

// ---- 7. grid ----------------------------------------------------------------

push('list:grid', {
  grid: { column: 2, gutter: 16 },
  dataSource: DATA6,
  renderItem: textItem,
});
// 响应式 grid：SSR 里 `currentBreakpoint` 恒 undefined ⇒ 落 `grid.column`
push('list:grid-responsive', {
  grid: { column: 3, xs: 1, sm: 2, md: 3, lg: 4, xl: 5, xxl: 6, xxxl: 7 },
  dataSource: DATA6,
  renderItem: textItem,
});
// grid 但**没有** column ⇒ 不产 colStyle（`width` / `maxWidth` 都不落）
push('list:grid-no-column', {
  grid: { gutter: 16 },
  dataSource: DATA,
  renderItem: textItem,
});

// ---- 8. pagination ----------------------------------------------------------

push('list:pagination', {
  pagination: { pageSize: 2 },
  dataSource: DATA6,
  renderItem: textItem,
});
push('list:pagination-top', {
  pagination: { pageSize: 2, position: 'top' },
  dataSource: DATA6,
  renderItem: textItem,
});
push('list:pagination-both', {
  pagination: { pageSize: 2, position: 'both' },
  dataSource: DATA6,
  renderItem: textItem,
});
// `current` 超过最大页 ⇒ 夹到最大页
push('list:pagination-clamp', {
  pagination: { pageSize: 2, current: 99 },
  dataSource: DATA6,
  renderItem: textItem,
});

// ---- 9. loading -------------------------------------------------------------

push('list:loading', { loading: true, dataSource: DATA, renderItem: textItem });
push('list:loading-spin-props', {
  loading: { spinning: true },
  dataSource: DATA,
  renderItem: textItem,
});

// ---- 10. className / style / attrs / rtl -----------------------------------

push('list:className', {
  className: 'my-cls',
  rootClassName: 'my-root',
  dataSource: DATA,
  renderItem: textItem,
});
push('list:style', {
  style: { backgroundColor: '#fde3cf', color: '#f56a00' },
  dataSource: DATA,
  renderItem: textItem,
});
push('list:attrs', { id: 'my-id', 'data-x': 'y', dataSource: DATA, renderItem: textItem });
push('list:rtl', { dataSource: DATA, renderItem: textItem }, { direction: 'rtl' });

const result = {
  $schema: '../schema.json',
  component: 'list',
  antdVersion: antdPkg.version,
  generatedAt: new Date().toISOString(),
  cases,
};

if (check) {
  const existing = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
  const same = JSON.stringify(existing.cases) === JSON.stringify(cases);
  if (!same) {
    console.error = realError;
    realError('[baseline] list.dom.json 与当前 antd 产物不一致');
    process.exit(1);
  }
  console.error = realError;
  console.log('[baseline] list: check ok,', cases.length, 'cases');
} else {
  fs.writeFileSync(OUT_FILE, `${JSON.stringify(result, null, 2)}\n`);
  console.error = realError;
  console.log('[baseline] list: wrote', cases.length, 'cases →', OUT_FILE);
}
