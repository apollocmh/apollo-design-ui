#!/usr/bin/env node
/**
 * tests/compat/baseline/breadcrumb.mjs — 生成 antd 6.6.4 Breadcrumb 的 DOM 基线（机械 oracle）
 *
 * 与 `anchor.mjs` / `masonry.mjs` / `flex.mjs` 同一套路：**只做三件事** —— 构造用例、
 * 调用 React、写文件。归一化与比对在消费侧
 * （`packages/ui/src/breadcrumb/__tests__/semantic.test.ts`）完成，且必须**对称**。
 *
 * ── 这个基线为什么是确定的（不 flaky）────────────────────────────────────────
 *
 * Breadcrumb 没有状态、没有浮层（`menu` 项虽然用 `Dropdown`，但**浮层默认不展开** ⇒
 * SSR 产物里没有 popup），也没有 effect ⇒ SSR 产物完全确定 ✓。
 *
 * ── 🚨 每个用例都要包一层 `ConfigProvider`（同 anchor）────────────────────────
 *
 * 上游 `BreadcrumbSeparator` 的类名前缀取自
 * `React.useContext(ConfigContext).getPrefixCls('breadcrumb')` —— 即**根前缀**，
 * 与 `Breadcrumb` 的 `prefixCls` prop **无关**（它连 `prefixCls` prop 都没有）。
 * 不包 Provider 时根前缀是 antd 的默认 `ant` ⇒ 分隔符是 `ant-breadcrumb-separator`，
 * 而 `Breadcrumb` 自己是 `apollo`（传了 prop）—— 两边对不上。
 *
 * ⚠️ 本组件**多一层坑**：`breadcrumb:children` 用例里的 `Breadcrumb.Item` 也是
 * `getPrefixCls('breadcrumb', customizePrefixCls)` —— 但 `InternalBreadcrumbItem`
 * 用的前缀是**父级传下来的** `prefixCls` prop。两条路都要靠 Provider 对齐。
 *
 * ── 用 `--check` 校验入库的产物没漂 ───────────────────────────────────────────
 *
 * 运行：
 *   node tests/compat/baseline/breadcrumb.mjs
 *   node tests/compat/baseline/breadcrumb.mjs --check
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
const OUT_FILE = path.join(__dirname, '../baselines/breadcrumb.dom.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antd = require('antd');
const antdPkg = require('antd/package.json');
const { Breadcrumb, ConfigProvider } = antd;

/** 两侧共用的前缀。取值就是我们的默认前缀。 */
const PREFIX = 'apollo';

/** 固定 items（不用任何与运行时刻相关的东西）。 */
const ITEMS = [
  { title: 'Home', href: '#/home' },
  { title: 'List', href: '#/list' },
  { title: 'Detail' },
];

const cases = [];

const push = (id, props, { direction, bare, children } = {}) => {
  const node = h(Breadcrumb, props, children);
  // `bare: true` ⇒ **不包** ConfigProvider：此时根前缀回落到各家的默认值
  // （antd `ant` vs 我们 `apollo`）⇒ 用来钉 D1 差异
  cases.push({ id, html: renderToStaticMarkup(bare ? node : withPrefix(node, direction)) });
};

/** 每个用例都包一层 `ConfigProvider`（见文件头）。 */
const withPrefix = (node, direction) =>
  h(
    ConfigProvider,
    { prefixCls: PREFIX, iconPrefixCls: 'apollo-icon', ...(direction ? { direction } : {}) },
    node,
  );

// ---- 1. 基本形态 -----------------------------------------------------------

const BP = { prefixCls: PREFIX, items: ITEMS };

push('breadcrumb:basic', BP);
// 两侧都不传 prefixCls **且不包 Provider** → antd `ant-breadcrumb*` vs 我们 `apollo-breadcrumb*`（D1）
push('breadcrumb:prefix-cls:no-props', { items: ITEMS }, { bare: true });
push('breadcrumb:prefix-cls:custom', { prefixCls: 'custom', items: ITEMS });
push('breadcrumb:rtl', BP, { direction: 'rtl' });
push('breadcrumb:items-empty', { ...BP, items: [] });

// ---- 2. 分隔符（四条判据）--------------------------------------------------

// 默认 `/`
push('breadcrumb:separator-default', BP);
// prop 覆盖
push('breadcrumb:separator-custom', { ...BP, separator: '>' });
// 🚨 `separator: ''` ⇒ **空串原样保留**（不是回退成 `/`）；且**最后一项**的 `''`
//    会被 `isRenderable` 拦在「不渲染分隔符」那一侧
push('breadcrumb:separator-empty', { ...BP, separator: '' });
// `type: 'separator'` 的显式分隔符 ⇒ 与「注入的分隔符」并存
push('breadcrumb:separator-item', {
  ...BP,
  items: [
    { title: 'Home', href: '#/home' },
    { type: 'separator', separator: '|' },
    { title: 'Detail' },
  ],
});
// `type: 'separator'` + `separator: ''`（走 `children === ''` 那条分支）
push('breadcrumb:separator-item-empty', {
  ...BP,
  items: [
    { title: 'Home', href: '#/home' },
    { type: 'separator', separator: '' },
    { title: 'Detail' },
  ],
});

// ---- 3. path / params ------------------------------------------------------

// `path` **累加** + `:id` 替换
push('breadcrumb:path', {
  ...BP,
  params: { id: '7' },
  items: [
    { title: 'Home', path: 'home' },
    { title: 'List :id', path: 'list/:id' },
    { title: 'Detail' },
  ],
});
// `path` 开头的 `/` 被剥掉；`path: undefined` ⇒ **不 push**（`href` 保持 item 自己的）
push('breadcrumb:path-slash', {
  ...BP,
  items: [{ title: 'A', path: '/a' }, { title: 'B' }],
});
// 🚨 `params` 为空（默认 `{}`）时参数正则是 `:()`（空捕获组）⇒ 净效果**原样**
push('breadcrumb:params-empty', { ...BP, items: [{ title: 'x:y:z' }] });
// `params[key]` 是 **falsy**（`0` / `''`）⇒ `||` 回退成原样
push('breadcrumb:params-falsy', {
  ...BP,
  params: { id: 0, name: '' },
  items: [{ title: 'a-:id-b-:name' }],
});
// `href` 直给（无 `path`）
push('breadcrumb:href-direct', { ...BP, items: [{ title: 'A', href: 'https://x.dev' }] });
// `title` 是**非字符串**（vnode）⇒ 原样渲染（不做 `:param` 替换）
push('breadcrumb:title-vnode', {
  ...BP,
  params: { id: '7' },
  items: [{ title: h('span', { className: 'title-span' }, ':id') }],
});
// `title` 是**空串** ⇒ `isRenderable` 为假 ⇒ **整项不渲染**
push('breadcrumb:title-empty', { ...BP, items: [{ title: '' }, { title: 'B' }] });

// ---- 4. 三条数据通道 -------------------------------------------------------

// `routes`（废弃）：`breadcrumbName → title`；⚠️ 父级 `title` 赢、子级 `breadcrumbName` 赢
push('breadcrumb:routes', {
  prefixCls: PREFIX,
  routes: [
    { breadcrumbName: 'ignored', title: 'parent-title' },
    {
      breadcrumbName: 'child',
      children: [{ breadcrumbName: 'child-name', title: 'ignored-child-title' }],
    },
  ],
});
// `items` 优先于 `routes`
push('breadcrumb:items-over-routes', {
  ...BP,
  routes: [{ title: 'from-routes' }],
});
// `children`（废弃）—— `cloneVNode` 注入 `separator`（最后一项是 `''`）
push(
  'breadcrumb:children',
  { prefixCls: PREFIX },
  {
    children: [
      h(Breadcrumb.Item, { key: 'a' }, 'A'),
      h(Breadcrumb.Separator, { key: 's' }, '|'),
      h(Breadcrumb.Item, { key: 'b' }, 'B'),
    ],
  },
);
// `children` + 自定义 `separator`
push(
  'breadcrumb:children-separator',
  { prefixCls: PREFIX, separator: '>' },
  {
    children: [h(Breadcrumb.Item, { key: 'a' }, 'A'), h(Breadcrumb.Item, { key: 'b' }, 'B')],
  },
);

// ---- 5. itemRender ---------------------------------------------------------

// 🚨 自定义 `itemRender` **只收 4 个实参**（没有 `href`），且**不走** `renderItem`
//    ⇒ 没有 `-link` 元素，返回值直接进 `<li>`
push('breadcrumb:item-render', {
  ...BP,
  itemRender: (item, params, routes, paths) =>
    h(
      'span',
      { className: 'custom-render' },
      `${item.title}|${Object.keys(params).length}|${routes.length}|${paths.join(',')}`,
    ),
});

// ---- 6. className / style / data-* / aria-* 的落点 -------------------------
//
// 🚨 这组用例是**定论分析 §6.2 那个读码结论**用的：`item.style` 到底落不落 DOM。
push('breadcrumb:item-class-style', {
  ...BP,
  items: [{ title: 'A', href: '#/a', className: 'item-cls', style: { color: 'red' } }],
});
push('breadcrumb:item-data-aria', {
  ...BP,
  items: [{ title: 'A', href: '#/a', 'data-testid': 'x', 'aria-label': 'A 项' }],
});
// 数字 key
push('breadcrumb:key-number', {
  ...BP,
  items: [
    { key: 0, title: 'A' },
    { key: 1, title: 'B' },
  ],
});

// ---- 7. menu（Dropdown 触发层）--------------------------------------------

push('breadcrumb:menu', {
  ...BP,
  items: [
    { title: 'Home', href: '#/home' },
    {
      title: 'Group',
      menu: {
        items: [
          { key: 'a', label: 'A' },
          { key: 'b', title: 'B' },
          { key: 'c', label: 'C', path: '/c' },
        ],
      },
    },
    { title: 'Detail' },
  ],
});
push('breadcrumb:dropdown-icon', {
  ...BP,
  dropdownIcon: h('span', { className: 'my-icon' }, 'v'),
  items: [
    { title: 'Home', href: '#/home' },
    { title: 'Group', menu: { items: [{ key: 'a', label: 'A' }] } },
  ],
});

// ---- 8. 语义化（三个槽）----------------------------------------------------

push('breadcrumb:class-names', {
  ...BP,
  classNames: { root: 'custom-root', item: 'custom-item', separator: 'custom-separator' },
});
push('breadcrumb:styles', {
  ...BP,
  classNames: { root: 'custom-root' },
  styles: {
    root: { background: '#fafafa' },
    item: { opacity: 0.8 },
    separator: { color: 'red' },
  },
});
// 函数式变体：入参的 `props.separator` 是**解析后**的值
push('breadcrumb:class-names-fn', {
  ...BP,
  separator: '>',
  classNames: ({ props }) => ({ root: `sep-${props.separator}`, item: 'fn-item' }),
});

const result = {
  $schema: '../schema.json',
  component: 'breadcrumb',
  antdVersion: antdPkg.version,
  generatedAt: new Date().toISOString(),
  cases,
};

if (check) {
  const existing = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
  const same = JSON.stringify(existing.cases) === JSON.stringify(cases);
  if (!same) {
    console.error('[baseline] breadcrumb.dom.json 与当前 antd 产物不一致');
    process.exit(1);
  }
  console.log('[baseline] breadcrumb: check ok,', cases.length, 'cases');
} else {
  fs.writeFileSync(OUT_FILE, `${JSON.stringify(result, null, 2)}\n`);
  console.log('[baseline] breadcrumb: wrote', cases.length, 'cases →', OUT_FILE);
}
