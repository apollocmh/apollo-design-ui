#!/usr/bin/env node
/**
 * tests/compat/baseline/card.mjs — 生成 antd 6.6.4 Card 的 DOM 基线（机械 oracle）
 *
 * 与 `breadcrumb.mjs` / `anchor.mjs` / `masonry.mjs` 同一套路：**只做三件事** ——
 * 构造用例、调用 React、写文件。归一化与比对在消费侧
 * （`packages/ui/src/card/__tests__/semantic.test.ts`）完成，且必须**对称**。
 *
 * ── 这个基线为什么是确定的（不 flaky）────────────────────────────────────────
 *
 * Card 没有状态、没有 effect、**没有浮层**（`tabList` 的页签浮层在 SSR 产物里不展开）
 * ⇒ SSR 产物完全确定 ✓。
 * ⚠️ `Tabs` 会给面板生成 `rc-tabs-N` 的 `id` —— 本目录用 `contract` 档投影，
 * `id` 会被归一化成 `{i0}` / `{i1}`（按文档序），所以与我们的 `apollo-tabs-N` 不冲突。
 *
 * ── 🚨 每个用例都要包一层 `ConfigProvider`（同 breadcrumb）─────────────────────
 *
 * 两个理由：
 *   1. `Card.Meta` 的类名前缀取自 `getPrefixCls('card', prefixCls)` ——
 *      它自己的 `prefixCls` prop 也是「**card** 的前缀」，但**根前缀**来自 ConfigContext；
 *   2. `Card` 的 `getPrefixCls('card', customizePrefixCls)` 在不传 prop 时读根前缀。
 * 不包 Provider 时根前缀是 antd 的默认 `ant` ⇒ 两侧对不上。
 *
 * ── 用 `--check` 校验入库的产物没漂 ───────────────────────────────────────────
 *
 * 运行：
 *   node tests/compat/baseline/card.mjs
 *   node tests/compat/baseline/card.mjs --check
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
const OUT_FILE = path.join(__dirname, '../baselines/card.dom.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antd = require('antd');
const antdPkg = require('antd/package.json');
const { Card, ConfigProvider } = antd;

/** 两侧共用的前缀。取值就是我们的默认前缀。 */
const PREFIX = 'apollo';

const cases = [];

/**
 * 推入一个用例。
 *
 * @param id    用例 id
 * @param props `Card` 的 props
 * @param opts  `children`（React 子节点）/ `bare`（不包 ConfigProvider，用来钉 D1）/
 *              `direction`（RTL）
 */
const push = (id, props, { children, bare, direction } = {}) => {
  const node = h(Card, props, children);
  cases.push({
    id,
    html: renderToStaticMarkup(bare ? node : withPrefix(node, direction)),
  });
};

const withPrefix = (node, direction) =>
  h(
    ConfigProvider,
    { prefixCls: PREFIX, iconPrefixCls: 'apollo-icon', ...(direction ? { direction } : {}) },
    node,
  );

/** 正文（两侧同一份结构）。 */
const body = () => [h('p', { key: 'a' }, 'Card content'), h('p', { key: 'b' }, 'Card content')];

const more = () => h('a', { href: '#more' }, 'More');

const TAB_LIST = [
  { key: 'tab1', tab: 'Tab 1' },
  { key: 'tab2', tab: 'Tab 2' },
];

const GRID_STYLE = { width: '25%', textAlign: 'center' };

// ---- 1. 四段结构的存在判据 -------------------------------------------------

const BP = { prefixCls: PREFIX };
push('card:empty', BP);
push('card:body-only', BP, { children: body() });
push('card:title-only', { ...BP, title: 'Card title' });
push('card:extra-only', { ...BP, extra: more() });
push('card:title-extra', { ...BP, title: 'Card title', extra: more() }, { children: body() });
push(
  'card:cover',
  { ...BP, title: 'Card title', cover: h('img', { alt: 'c' }) },
  { children: body() },
);
// 🚨 `isRenderable`：`''` / `false` 判假 ⇒ **不渲染 head**；`0` 判真 ⇒ 渲染
push('card:title-empty', { ...BP, title: '' });
push('card:title-false', { ...BP, title: false });
push('card:title-zero', { ...BP, title: 0 });
push('card:extra-empty', { ...BP, extra: '' });

// ---- 2. 前缀（D1）----------------------------------------------------------

// 两侧都不传 prefixCls **且不包 Provider** → antd `ant-card*` vs 我们 `apollo-card*`
push('card:prefix-cls:no-props', {}, { bare: true, children: body() });
push('card:prefix-cls:custom', { prefixCls: 'custom', title: 'T' }, { children: body() });

// ---- 3. 根类名的条件组合 ---------------------------------------------------

push('card:rtl', { ...BP, title: 'T' }, { direction: 'rtl', children: body() });
push('card:small', { ...BP, size: 'small', title: 'T', extra: more() }, { children: body() });
push('card:medium', { ...BP, size: 'medium', title: 'T' }, { children: body() });
push('card:borderless', { ...BP, variant: 'borderless', title: 'T' }, { children: body() });
push('card:bordered-false', { ...BP, bordered: false, title: 'T' }, { children: body() });
push('card:hoverable', { ...BP, hoverable: true, title: 'T' }, { children: body() });
push('card:type-inner', { ...BP, type: 'inner', title: 'T', extra: more() }, { children: body() });

// ---- 4. loading / 弃用样式 prop --------------------------------------------

push('card:loading', { ...BP, loading: true, title: 'T' }, { children: body() });
push('card:loading-no-title', { ...BP, loading: true });
push('card:head-style', { ...BP, title: 'T', headStyle: { color: 'red' } }, { children: body() });
push('card:body-style', { ...BP, bodyStyle: { padding: '1px' } }, { children: body() });

// ---- 5. actions ------------------------------------------------------------

push(
  'card:actions',
  {
    ...BP,
    title: 'T',
    actions: [
      h('span', { key: 'a' }, 'A'),
      h('span', { key: 'b' }, 'B'),
      h('span', { key: 'c' }, 'C'),
    ],
  },
  { children: body() },
);
push('card:actions-one', { ...BP, actions: [h('span', { key: 'a' }, 'A')] }, { children: body() });
// `actions: []` ⇒ `length` 为假 ⇒ **不渲染 `<ul>`**
push('card:actions-empty', { ...BP, actions: [] }, { children: body() });

// ---- 6. Card.Grid（contain-grid）------------------------------------------

const grids = (n) =>
  Array.from({ length: n }, (_, i) => h(Card.Grid, { key: i, style: GRID_STYLE }, 'Content'));

push('card:grid', { ...BP, title: 'Card Title' }, { children: grids(6) });
// `hoverable` 默认 `true`；显式 `false` 时**没有** `-grid-hoverable`
push(
  'card:grid-hoverable-false',
  { ...BP, title: 'T' },
  { children: [h(Card.Grid, { key: 'g', hoverable: false, style: GRID_STYLE }, 'G')] },
);
// 单个 grid（`-contain-grid` 的 `:has(> -head)` 分支仍成立）
push('card:grid-no-head', BP, { children: grids(2) });

// ---- 7. tabList ------------------------------------------------------------

push('card:tabs', { ...BP, title: 'T', extra: more(), tabList: TAB_LIST }, { children: body() });
// `tabList: []` ⇒ 真值（**渲染** head 与 Tabs），但 `-contain-tabs` 用 `length` ⇒ **不加类名**
push('card:tabs-empty', { ...BP, tabList: [] }, { children: body() });
// 受控 / 非受控二选一
push(
  'card:tabs-active-key',
  { ...BP, tabList: TAB_LIST, activeTabKey: 'tab2' },
  { children: body() },
);
push(
  'card:tabs-default-active-key',
  { ...BP, tabList: TAB_LIST, defaultActiveTabKey: 'tab2' },
  { children: body() },
);
// `tabBarExtraContent`
push(
  'card:tabs-extra',
  { ...BP, tabList: TAB_LIST, tabBarExtraContent: more() },
  { children: body() },
);
// `tabProps` 透传（`size` 被 Card 的 `tabSize` 覆盖；`centered` 保留）
push(
  'card:tabs-tab-props',
  { ...BP, tabList: TAB_LIST, tabProps: { centered: true } },
  { children: body() },
);
// `label` 通道 + `label` 覆盖 `tab`
push(
  'card:tabs-label',
  { ...BP, tabList: [{ key: 'a', tab: 'from-tab', label: 'from-label' }] },
  { children: body() },
);
// `size="small"` ⇒ `tabSize` 仍是 `small`（不是 large）
push('card:tabs-small', { ...BP, size: 'small', tabList: TAB_LIST }, { children: body() });

// ---- 8. Card.Meta ----------------------------------------------------------

push(
  'card:meta',
  { ...BP, cover: h('img', { alt: 'c' }) },
  {
    children: h(Card.Meta, {
      avatar: h('span', { className: 'av' }, 'AV'),
      title: 'Card title',
      description: 'This is the description',
    }),
  },
);
push('card:meta-avatar-only', BP, {
  children: h(Card.Meta, { avatar: h('span', { className: 'av' }, 'AV') }),
});
push('card:meta-title-only', BP, { children: h(Card.Meta, { title: 'Card title' }) });
push('card:meta-description-only', BP, {
  children: h(Card.Meta, { description: 'This is the description' }),
});
// 🚨 `Card.Meta` 的 `prefixCls` 是 **card** 的前缀
push('card:meta-prefix-cls', BP, {
  children: h(Card.Meta, { prefixCls: 'custom', title: 'T' }),
});
push('card:meta-class-style', BP, {
  children: h(Card.Meta, {
    className: 'meta-cls',
    style: { color: 'red' },
    title: 'T',
    'data-testid': 'meta',
  }),
});
// `Card.Meta` **不读 direction** ⇒ 根上**没有** `-meta-rtl`
push('card:meta-rtl', BP, { children: h(Card.Meta, { title: 'T' }), direction: 'rtl' });

// ---- 9. 语义化（Card 7 槽 / Meta 5 槽）-------------------------------------

push(
  'card:class-names',
  {
    ...BP,
    title: 'T',
    extra: more(),
    cover: h('img', { alt: 'c' }),
    actions: [h('span', { key: 'a' }, 'A')],
    classNames: {
      root: 'c-root',
      header: 'c-header',
      body: 'c-body',
      extra: 'c-extra',
      title: 'c-title',
      actions: 'c-actions',
      cover: 'c-cover',
    },
  },
  { children: body() },
);
push(
  'card:styles',
  {
    ...BP,
    title: 'T',
    extra: more(),
    cover: h('img', { alt: 'c' }),
    actions: [h('span', { key: 'a' }, 'A')],
    styles: {
      root: { background: '#fafafa' },
      header: { opacity: 0.9 },
      body: { padding: '1px' },
      extra: { color: 'red' },
      title: { color: 'blue' },
      actions: { margin: '1px' },
      cover: { height: '1px' },
    },
  },
  { children: body() },
);
// 函数式：`info.props` 里的 `size` / `variant` 是**解析后**的值
push(
  'card:class-names-fn',
  {
    ...BP,
    size: 'small',
    variant: 'borderless',
    classNames: ({ props }) => ({ root: `sz-${String(props.size)}-vr-${String(props.variant)}` }),
  },
  { children: body() },
);
push('card:meta-class-names', BP, {
  children: h(Card.Meta, {
    avatar: h('span', { className: 'av' }, 'AV'),
    title: 'T',
    description: 'D',
    classNames: {
      root: 'm-root',
      section: 'm-section',
      avatar: 'm-avatar',
      title: 'm-title',
      description: 'm-description',
    },
  }),
});

// ---- 10. id / attrs 的落点 -------------------------------------------------

push('card:id', { ...BP, id: 'card-1', title: 'T' }, { children: body() });
push(
  'card:attrs',
  { ...BP, title: 'T', 'data-testid': 'card', 'aria-label': '卡片' },
  {
    children: body(),
  },
);
push(
  'card:className',
  { ...BP, className: 'user-cls', rootClassName: 'root-cls' },
  {
    children: body(),
  },
);

const result = {
  $schema: '../schema.json',
  component: 'card',
  antdVersion: antdPkg.version,
  generatedAt: new Date().toISOString(),
  cases,
};

if (check) {
  const existing = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
  const same = JSON.stringify(existing.cases) === JSON.stringify(cases);
  if (!same) {
    console.error('[baseline] card.dom.json 与当前 antd 产物不一致');
    process.exit(1);
  }
  console.log('[baseline] card: check ok,', cases.length, 'cases');
} else {
  fs.writeFileSync(OUT_FILE, `${JSON.stringify(result, null, 2)}\n`);
  console.log('[baseline] card: wrote', cases.length, 'cases →', OUT_FILE);
}
