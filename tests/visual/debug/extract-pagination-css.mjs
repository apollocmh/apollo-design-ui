/**
 * extract-pagination-css.mjs — dump antd 6.6.4 Pagination 的 CSS 产物 / Component Token 值。
 *
 * 三种用法：
 *   node tests/visual/debug/extract-pagination-css.mjs                 # 原始产物
 *   node tests/visual/debug/extract-pagination-css.mjs --tokens        # 12 个 Component Token 的判定值
 *   node tests/visual/debug/extract-pagination-css.mjs --emit-static   # 机械转换成静态 CSS（改名后的规则）
 *
 * 为什么必须 dump：`prepareComponentToken` 里有构建期算式 + `initComponentToken(token)`
 * 展开的输入框族 token（与 input / input-number 同式），判定值只能从产物里读（tour / form / slider 同判）。
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
const { ConfigProvider, Pagination } = require('antd');

const tokensOnly = process.argv.includes('--tokens');
const cache = createCache();

/** 覆盖：常规 / 简版 / 显示总数 / 快速跳转 / 尺寸切换 / 大尺寸 / 对齐 / 禁用。 */
const cases = [
  React.createElement(Pagination, { key: 'p1', defaultCurrent: 3, total: 500 }),
  React.createElement(Pagination, {
    key: 'p2',
    defaultCurrent: 3,
    total: 500,
    showTotal: (t) => `共 ${t} 条`,
  }),
  React.createElement(Pagination, {
    key: 'p3',
    defaultCurrent: 3,
    total: 500,
    showQuickJumper: true,
  }),
  React.createElement(Pagination, {
    key: 'p4',
    defaultCurrent: 3,
    total: 500,
    showSizeChanger: true,
  }),
  React.createElement(Pagination, { key: 'p5', defaultCurrent: 3, total: 500, simple: true }),
  React.createElement(Pagination, { key: 'p6', defaultCurrent: 3, total: 500, size: 'small' }),
  React.createElement(Pagination, { key: 'p7', defaultCurrent: 3, total: 500, size: 'large' }),
  React.createElement(Pagination, { key: 'p8', defaultCurrent: 3, total: 500, align: 'center' }),
  React.createElement(Pagination, { key: 'p9', defaultCurrent: 3, total: 500, disabled: true }),
  React.createElement(Pagination, {
    key: 'p10',
    defaultCurrent: 3,
    total: 500,
    showLessItems: true,
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

// ── --emit-static：机械转换成静态 CSS（与 form / slider 同一套转换）──
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
        head.includes('pagination') || (head.startsWith('@media') && body.includes('pagination')),
    );
  console.error(`[extract-pagination] 规则 ${rules.length} 条`);
  console.log(rules.map(([h, b]) => `${h}{${b}}`).join('\n'));
  process.exit(0);
}

if (!tokensOnly) {
  console.log(raw);
  process.exit(0);
}

// ── --tokens：抓 `--ant-pagination-*` 的声明块 ──
const decls = new Map();
for (const m of raw.matchAll(/--ant-pagination-([a-z0-9-]+)\s*:\s*([^;}"]+)/g)) {
  if (!decls.has(m[1])) decls.set(m[1], m[2].trim());
}
const sorted = [...decls.entries()].sort();
console.log(`# antd 6.6.4 Pagination Component Token（判定值，共 ${sorted.length} 个）`);
for (const [k, v] of sorted) console.log(`${k}=${v}`);

// 输入框族（initComponentToken 展开）单独列，便于与 input/input-number 对拍
const inputDecls = new Map();
for (const m of raw.matchAll(/--ant-input-([a-z0-9-]+)\s*:\s*([^;}"]+)/g)) {
  if (!inputDecls.has(m[1])) inputDecls.set(m[1], m[2].trim());
}
console.log(`\n# 输入框族（--ant-input-*，共 ${inputDecls.size} 个）`);
for (const [k, v] of [...inputDecls.entries()].sort()) console.log(`${k}=${v}`);
