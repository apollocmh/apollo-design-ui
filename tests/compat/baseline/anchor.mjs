#!/usr/bin/env node
/**
 * tests/compat/baseline/anchor.mjs — 生成 antd 6.6.4 Anchor 的 DOM 基线（机械 oracle）
 *
 * 与 `masonry.mjs` / `flex.mjs` 同一套路：**只做三件事** —— 构造用例、调用 React、写文件。
 * 归一化与比对在消费侧（`packages/ui/src/anchor/__tests__/semantic.test.ts`）完成，且必须**对称**。
 *
 * ── 这个基线为什么是确定的（不 flaky）────────────────────────────────────────
 *
 * Anchor 的「当前锚点」来自**滚动侦测**（`useEffect` + `scroll` 事件），
 * 而 SSR **不跑 effect、也没有滚动** ⇒ `activeLink` 恒 `null`
 * ⇒ 没有 `-link-active` / `-link-title-active` / `-ink-visible`，ink 的内联样式也不写。
 * 所以 SSR 产物是确定的 ✓（真滚动行为归 **L6**）。
 *
 * ⚠️ `affix` 默认 **true** ⇒ 大多数用例外面包一层 `Affix`（SSR 下不固钉，但**占位层结构在**）。
 *    用例里显式区分 `affix: true/false` 两种形态。
 *
 * ── 关于 prefixCls（同 divider/flex/masonry）────────────────────────────────
 *
 * 给每个用例显式传 `prefixCls: 'apollo'`，两侧传同一个值，类名逐字比对。
 * 默认前缀（`apollo` vs `ant`）由 `anchor:prefix-cls:no-props` 单独覆盖（消费侧 allow 登记为 D1）。
 *
 * 运行：
 *   node tests/compat/baseline/anchor.mjs
 *   node tests/compat/baseline/anchor.mjs --check
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
const OUT_FILE = path.join(__dirname, '../baselines/anchor.dom.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antd = require('antd');
const antdPkg = require('antd/package.json');
const { Anchor, ConfigProvider } = antd;

/** 两侧共用的前缀。取值就是我们的默认前缀。 */
const PREFIX = 'apollo';

/** 固定 items（不用任何与运行时刻相关的东西）。 */
const ITEMS = [
  { key: 'a', href: '#section-a', title: 'Section A' },
  { key: 'b', href: '#section-b', title: 'Section B' },
  { key: 'c', href: '#section-c', title: 'Section C' },
];

const NESTED = [
  {
    key: 'a',
    href: '#section-a',
    title: 'Section A',
    children: [{ key: 'a1', href: '#section-a1', title: 'Section A1' }],
  },
  { key: 'b', href: '#section-b', title: 'Section B' },
];

const cases = [];

/** `prefixCls: 'apollo'` ⇒ 类名就是 `apollo`（`getPrefixCls('anchor', 'apollo')` 直返）。 */
const BP = { prefixCls: PREFIX, items: ITEMS };

const push = (id, props, { direction, bare } = {}) => {
  const node = h(Anchor, props);
  // `bare: true` ⇒ **不包** ConfigProvider：此时根前缀回落到各家的默认值
  // （antd `ant` vs 我们 `apollo`）⇒ 用来钉 D1 差异
  cases.push({ id, html: renderToStaticMarkup(bare ? node : withPrefix(node, direction)) });
};

/**
 * 🚨 **每个用例都要包一层 `ConfigProvider`**（同 divider/flex/masonry）。
 *
 * 为什么 Anchor 尤其需要：上游 `AnchorLink` 的类名前缀取自
 * `React.useContext(ConfigContext).getPrefixCls('anchor', customize)` —— 即**根前缀**，
 * 与 `Anchor` 的 `prefixCls` prop **无关**。不包 Provider 时根前缀是 antd 的默认 `ant`
 * ⇒ 链接会是 `ant-anchor-link`，而 `Anchor` 自己是 `apollo`（传了 prop）—— 两边对不上。
 * 包上之后根前缀也是 `apollo` ⇒ 组件与链接**同一前缀** ✓。
 */
const withPrefix = (node, direction) =>
  h(
    ConfigProvider,
    { prefixCls: PREFIX, iconPrefixCls: 'apollo-icon', ...(direction ? { direction } : {}) },
    node,
  );

// ---- 1. 基本形态 -----------------------------------------------------------

// ⚠️ `affix` 默认 true ⇒ 包一层 Affix
push('anchor:basic', BP);
push('anchor:affix-false', { ...BP, affix: false });
push('anchor:affix-config', { ...BP, affix: { offsetBottom: 20 } });
// 两侧都不传 prefixCls **且不包 Provider** → antd `ant-anchor*` vs 我们 `apollo-anchor*`（D1）
push('anchor:prefix-cls:no-props', { items: ITEMS }, { bare: true });
push('anchor:prefix-cls:custom', { prefixCls: 'custom', items: ITEMS });

// ---- 2. 类名判据 -----------------------------------------------------------

// 🚨 `-fixed` 的判据是 `!affix && !showInkInFixed`
push('anchor:fixed-ink', { ...BP, affix: false, showInkInFixed: true });
push('anchor:fixed-default', { ...BP, affix: false, showInkInFixed: false });
// `-wrapper-horizontal`
push('anchor:horizontal', { ...BP, direction: 'horizontal' });
push('anchor:rtl', BP, { direction: 'rtl' });

// ---- 3. 偏移与滚动参数（SSR 只影响 wrapper 的 maxHeight）-------------------

push('anchor:offset-top', { ...BP, offsetTop: 80 });
push('anchor:target-offset', { ...BP, targetOffset: 60 });
push('anchor:bounds', { ...BP, bounds: 20 });
push('anchor:replace', { ...BP, replace: true });

// ---- 4. items 形态 ---------------------------------------------------------

push('anchor:items-nested', { ...BP, items: NESTED });
// 水平方向**不渲染**嵌套 children
push('anchor:items-nested-horizontal', { ...BP, items: NESTED, direction: 'horizontal' });
push('anchor:items-empty', { ...BP, items: [] });
// 数字 key
push('anchor:key-number', {
  ...BP,
  items: [
    { key: 0, href: '#section-a', title: 'A' },
    { key: 1, href: '#section-b', title: 'B' },
  ],
});
// `title` 是**非字符串**（vnode）⇒ 不写 `title` 属性
push('anchor:title-vnode', {
  ...BP,
  items: [{ key: 'a', href: '#section-a', title: h('span', { className: 'title-span' }, 'A') }],
});
// 链接自己的 className / target / replace
push('anchor:link-props', {
  ...BP,
  items: [
    { key: 'a', href: '#section-a', title: 'A', className: 'link-cls', target: '_blank' },
    { key: 'b', href: 'https://example.com', title: 'B', replace: true },
  ],
});

// ---- 5. 废弃的 children 路径（`'items' in props` 为假）--------------------

push('anchor:children', {
  prefixCls: PREFIX,
  children: h('div', { className: 'legacy-child' }, 'legacy'),
});

// ---- 6. 语义化（四个槽）----------------------------------------------------

push('anchor:class-names', {
  ...BP,
  classNames: {
    root: 'custom-root',
    item: 'custom-item',
    itemTitle: 'custom-item-title',
    indicator: 'custom-indicator',
  },
});
push('anchor:styles', {
  ...BP,
  classNames: { root: 'custom-root' },
  styles: {
    root: { background: '#fafafa' },
    item: { opacity: 0.8 },
    itemTitle: { fontWeight: 'bold' },
    indicator: { backgroundColor: 'red' },
  },
});
// 函数式变体：入参的 `props.direction` 是**解析后的方向**
push('anchor:class-names-fn', {
  ...BP,
  direction: 'horizontal',
  classNames: ({ props }) => ({ root: `dir-${props.direction}`, item: 'fn-item' }),
});

const result = {
  $schema: '../schema.json',
  component: 'anchor',
  antdVersion: antdPkg.version,
  generatedAt: new Date().toISOString(),
  cases,
};

if (check) {
  const existing = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
  const same = JSON.stringify(existing.cases) === JSON.stringify(cases);
  if (!same) {
    console.error('[baseline] anchor.dom.json 与当前 antd 产物不一致');
    process.exit(1);
  }
  console.log('[baseline] anchor: check ok,', cases.length, 'cases');
} else {
  fs.writeFileSync(OUT_FILE, `${JSON.stringify(result, null, 2)}\n`);
  console.log('[baseline] anchor: wrote', cases.length, 'cases →', OUT_FILE);
}
