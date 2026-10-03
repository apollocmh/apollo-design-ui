/**
 * extract-transfer-css.mjs — dump antd 6.6.4 Transfer 的 CSS 产物 / Component Token 值。
 *
 * 三种用法：
 *   node tests/visual/debug/extract-transfer-css.mjs                 # 原始产物
 *   node tests/visual/debug/extract-transfer-css.mjs --tokens        # 7 个 Component Token 的判定值
 *   node tests/visual/debug/extract-transfer-css.mjs --emit-static   # 机械转换成静态 CSS（改名后的规则）
 *
 * 与 pagination 同判：`prepareComponentToken` 里有构建期算式
 * （itemPaddingBlock = (controlHeight - fontSize*lineHeight)/2 等），判定值只能从产物里读。
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
const { ConfigProvider, Transfer } = require('antd');

const tokensOnly = process.argv.includes('--tokens');
const cache = createCache();

const mockData = [];
for (let i = 0; i < 20; i += 1) {
  mockData.push({
    key: i.toString(),
    title: `content${i + 1}`,
    description: `description of content${i + 1}`,
    disabled: i % 4 === 0,
  });
}

const baseProps = { dataSource: mockData, targetKeys: ['1', '4'] };

/** 覆盖：常规 / 禁用项 / oneWay / 搜索 / 分页 / 状态 / 自定义按钮 / 禁用 / 自定义 footer。 */
const cases = [
  React.createElement(Transfer, { key: 't1', ...baseProps }),
  React.createElement(Transfer, {
    key: 't2',
    ...baseProps,
    oneWay: true,
    targetKeys: ['1', '2', '3'],
    selectedKeys: ['4'],
  }),
  React.createElement(Transfer, { key: 't3', ...baseProps, showSearch: true }),
  React.createElement(Transfer, { key: 't4', ...baseProps, pagination: { pageSize: 10 } }),
  React.createElement(Transfer, {
    key: 't5',
    ...baseProps,
    pagination: { pageSize: 5, showSizeChanger: true },
  }),
  React.createElement(Transfer, { key: 't6', ...baseProps, status: 'error' }),
  React.createElement(Transfer, { key: 't7', ...baseProps, status: 'warning' }),
  React.createElement(Transfer, {
    key: 't8',
    ...baseProps,
    actions: [h('span', null, 'R'), h('span', null, 'L')],
  }),
  React.createElement(Transfer, { key: 't9', ...baseProps, disabled: true }),
  React.createElement(Transfer, {
    key: 't10',
    ...baseProps,
    footer: () => h('div', { style: { padding: '8px' } }, 'footer'),
    listStyle: { width: 250, height: 300 },
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
        head.includes('transfer') || (head.startsWith('@media') && body.includes('transfer')),
    );
  console.error(`[extract-transfer] 规则 ${rules.length} 条`);
  console.log(rules.map(([h, b]) => `${h}{${b}}`).join('\n'));
  process.exit(0);
}

if (!tokensOnly) {
  console.log(raw);
  process.exit(0);
}

// ── --tokens：从产物里抽 transfer 的 7 个 Component Token ──
const varRe = /--ant-transfer-([a-z-]+):\s*([^;}]+)/g;
const found = new Map();
let m = varRe.exec(raw);
while (m !== null) {
  if (!found.has(m[1])) found.set(m[1], m[2].trim());
  m = varRe.exec(raw);
}
for (const [k, v] of found) console.log(`${k} = ${v}`);
