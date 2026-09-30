/**
 * extract-tabs-css.mjs — dump antd 6.6.4 Tabs 的 CSS 产物 / Component Token 值。
 *
 * 三种用法：
 *   node tests/visual/debug/extract-tabs-css.mjs                 # 原始产物
 *   node tests/visual/debug/extract-tabs-css.mjs --tokens        # 26 个 Component Token + 6 个内部 token 的判定值
 *   node tests/visual/debug/extract-tabs-css.mjs --emit-static   # 机械转换成静态 CSS（改名后的规则）
 *
 * 为什么必须 dump：`prepareComponentToken` 里有**构建期算式**
 * （`cardPadding` 家族的 `(h − fontHeight)/2 − lineWidth`、`cardGutter = marginXXS/2`、
 * `zIndexPopup = zIndexPopupBase + 50`），判定值只能从产物里读（pagination / slider / tour 同判）。
 *
 * ⚠️ `--emit-static` 必须放在「打印原始产物」那个出口**之前**（slider 踩过这条）。
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const antdPath = require.resolve('antd');
const antdRoot = antdPath.slice(
  0,
  antdPath.indexOf('antd/es') >= 0 ? antdPath.indexOf('antd/es') : antdPath.indexOf('antd/dist'),
);
const cssinjsPath = require.resolve('@ant-design/cssinjs', { paths: [antdRoot] });

const { createCache, extractStyle, StyleProvider } = require(cssinjsPath);
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { ConfigProvider, Tabs } = require('antd');

const tokensOnly = process.argv.includes('--tokens');
const cache = createCache();

const items = [
  { key: '1', label: 'Tab 1', children: 'Content of Tab Pane 1' },
  { key: '2', label: 'Tab 2', children: 'Content of Tab Pane 2' },
  {
    key: '3',
    // ⚠️ 这个脚本是 `.mjs`（不是 `.mjsx`）⇒ **不能写 JSX**，用 `createElement`。
    //    带 icon 的 label 是为了让 `${componentCls}-tab-icon` 那批规则进产物。
    label: React.createElement(
      'span',
      null,
      React.createElement('span', { className: 'demo-icon' }),
      'Tab 3',
    ),
    children: 'Content of Tab Pane 3',
    disabled: true,
  },
];

/**
 * 覆盖：line（top/bottom）· card · editable-card · 纵向 · centered · size · 带 icon ·
 * extraContent · 溢出下拉（more）· 隐藏指示条。
 *
 * ⚠️ 溢出下拉（`-dropdown`）**必须真的让它出现**：导航区宽度够时 `OperationNode` 不渲染，
 *    那批规则就不会进产物 ⇒ 机械移植会漏一大块（pagination 的 `-options` 同判）。
 */
const cases = [
  React.createElement(Tabs, { key: 't1', defaultActiveKey: '1', items }),
  React.createElement(Tabs, {
    key: 't2',
    defaultActiveKey: '1',
    items,
    tabPlacement: 'bottom',
  }),
  React.createElement(Tabs, { key: 't3', defaultActiveKey: '1', items, type: 'card' }),
  React.createElement(Tabs, {
    key: 't4',
    defaultActiveKey: '1',
    type: 'editable-card',
    items: items.map((it) => ({ ...it, closable: true })),
    onEdit: () => {},
  }),
  React.createElement(Tabs, {
    key: 't5',
    defaultActiveKey: '1',
    items,
    tabPlacement: 'start',
  }),
  React.createElement(Tabs, {
    key: 't6',
    defaultActiveKey: '1',
    items,
    tabPlacement: 'end',
  }),
  React.createElement(Tabs, {
    key: 't7',
    defaultActiveKey: '1',
    items,
    centered: true,
    type: 'card',
  }),
  React.createElement(Tabs, { key: 't8', defaultActiveKey: '1', items, size: 'small' }),
  React.createElement(Tabs, { key: 't9', defaultActiveKey: '1', items, size: 'large' }),
  React.createElement(Tabs, {
    key: 't10',
    defaultActiveKey: '1',
    items,
    tabBarExtraContent: React.createElement('span', null, 'extra'),
  }),
  React.createElement(Tabs, {
    key: 't11',
    defaultActiveKey: '1',
    items,
    // 窄容器 ⇒ 导航区溢出，`-nav-more` / `-dropdown` 出现
    style: { width: 120 },
  }),
  React.createElement(Tabs, {
    key: 't12',
    defaultActiveKey: '1',
    items,
    indicator: { size: 20, align: 'start' },
  }),
];

const el = React.createElement(
  StyleProvider,
  { cache },
  React.createElement(
    ConfigProvider,
    { theme: { cssVar: true } },
    React.createElement('div', null, ...cases),
  ),
);
renderToStaticMarkup(el);
const raw = extractStyle(cache);

// ── --emit-static：机械转换成静态 CSS（与 form / slider / pagination 同一套转换）──
if (process.argv.includes('--emit-static')) {
  const splitRules = (css) => {
    const out = [];
    let depth = 0;
    let start = 0;
    let at = 0;
    for (let i = 0; i < css.length; i += 1) {
      const ch = css[i];
      if (ch === '{') {
        if (depth === 0) at = i;
        depth += 1;
      } else if (ch === '}') {
        depth -= 1;
        if (depth === 0) {
          out.push([css.slice(start, at).trim(), css.slice(at + 1, i)]);
          start = i + 1;
        }
      }
    }
    return out;
  };
  const stripScope = (s) =>
    s
      .replace(/<\/?style[^>]*>/g, '')
      .replace(/:where\([^)]*\)/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  const rename = (s) =>
    s
      .replace(/--ant-/g, '--apollo-')
      .replace(/\.ant-/g, '.apollo-')
      .replace(/"ant-/g, '"apollo-')
      .replace(/'ant-/g, "'apollo-")
      .replace(/" ant-/g, '" apollo-');
  const clean = (s) => rename(stripScope(s)).replace(/\.anticon/g, '.apollo-icon');
  const rules = splitRules(raw)
    .map(([head, body]) => [clean(head), clean(body)])
    .filter(([head]) => !head.includes('-css-var'))
    .filter(
      ([head, body]) =>
        head.includes('tabs') || (head.startsWith('@media') && body.includes('tabs')),
    );
  console.error(`[extract-tabs] 规则 ${rules.length} 条`);
  console.log(rules.map(([h, b]) => `${h}{${b}}`).join('\n'));
  process.exit(0);
}

if (!tokensOnly) {
  console.log(raw);
  process.exit(0);
}

// ── --tokens：抓 `--ant-tabs-*` 的声明块 ──
const decls = new Map();
for (const m of raw.matchAll(/--ant-tabs-([a-z0-9-]+)\s*:\s*([^;}"]+)/g)) {
  if (!decls.has(m[1])) decls.set(m[1], m[2].trim());
}
const sorted = [...decls.entries()].sort();
console.log(`# antd 6.6.4 Tabs 的 --ant-tabs-*（判定值，共 ${sorted.length} 个）`);
for (const [k, v] of sorted) console.log(`${k}=${v}`);

// 规则里消费的**非 tabs 前缀**变量（别名 token 与其它组件族的），单独列出来供 B7 核对
const foreign = new Set();
for (const m of raw.matchAll(/var\((--ant-(?!tabs-)[a-z0-9-]+)/g)) foreign.add(m[1]);
console.log(`\n# 规则里引用的其它变量（${foreign.size} 个，供 B7 核对是否都在 theme 声明）`);
for (const k of [...foreign].sort()) console.log(k);
