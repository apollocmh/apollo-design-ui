/**
 * extract-date-picker-css.mjs — dump antd 6.6.4 DatePicker 的 Component Token 判定值。
 *
 * 用法：
 *   node tests/visual/debug/extract-date-picker-css.mjs --tokens   # --ant-picker-* 的声明值
 *   node tests/visual/debug/extract-date-picker-css.mjs            # 原始 CSS 产物（很大）
 *
 * 为什么必须 dump：`prepareComponentToken` 里有**构建期算式**
 * （`cellHoverWithRangeBg` 的 `lighten(35)`、`timeColumnHeight` 的 `28*8`、
 * `zIndexPopup` 的 `zIndexPopupBase + 50`、padding 系算式），
 * 判定值只能从产物里读，不能推演（tabs / pagination / slider / tour 同判）。
 *
 * ⚠️ 面板侧（`-panel` / `-cell` / `-time-panel`）的规则要进产物，**必须真的把浮层打开**。
 *    SSR 下 Portal 不渲染（实测 `open: true` 的 SSR 只有 889 B）⇒ 这里改用
 *    「渲染一次触发器 + 手动 `open`」拿不到面板规则；因此本探针**只抓 token 声明**，
 *    面板规则的机械移植放到 G4 时用 `DatePicker` 的 cssinjs `override` 走一遍
 *    （或直接读 `es/date-picker/style/panel.js` 的源码算式）。
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const antdPath = require.resolve('antd');
const antdRoot = antdPath.slice(
  0,
  antdPath.indexOf('antd/es') >= 0 ? antdPath.indexOf('antd/es') : antdPath.indexOf('antd/dist'),
);
const cssinjsPath = require.resolve('@ant-design/cssinjs', { paths: [antdRoot] });
const fastColorPath = require.resolve('@ant-design/fast-color', { paths: [antdRoot] });

const { createCache, extractStyle, StyleProvider } = require(cssinjsPath);
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { ConfigProvider, DatePicker } = require('antd');
const { FastColor } = require(fastColorPath);
const dayjs = require(require.resolve('dayjs', { paths: [antdRoot] }));

const onlyTokens = !process.argv.includes('--raw');
const cache = createCache();

const { RangePicker } = DatePicker;
const D = (s) => dayjs(s);

/**
 * 覆盖：单值（有值 / 无值）· 范围 · multiple · showTime · 各 picker 粒度 ·
 * size 三档 · variant 三档 · status · disabled · presets · 自定义 separator。
 *
 * ⚠️ `multiple` 与 `presets` 各自带一整块样式（`style/multiple.js` 94 行、
 *    `-preset` 段）—— 不渲染就漏。
 */
const cases = [
  React.createElement(DatePicker),
  React.createElement(DatePicker, { defaultValue: D('2026-09-30') }),
  React.createElement(DatePicker, { size: 'small' }),
  React.createElement(DatePicker, { size: 'large' }),
  React.createElement(DatePicker, { variant: 'filled' }),
  React.createElement(DatePicker, { variant: 'borderless' }),
  React.createElement(DatePicker, { status: 'error' }),
  React.createElement(DatePicker, { status: 'warning' }),
  React.createElement(DatePicker, { disabled: true }),
  React.createElement(DatePicker, { showTime: true }),
  React.createElement(DatePicker, { picker: 'week' }),
  React.createElement(DatePicker, { picker: 'month' }),
  React.createElement(DatePicker, { picker: 'quarter' }),
  React.createElement(DatePicker, { picker: 'year' }),
  React.createElement(DatePicker, { multiple: true, defaultValue: [D('2026-09-30')] }),
  React.createElement(DatePicker, {
    presets: [{ label: 'Now', value: D('2026-09-30') }],
  }),
  React.createElement(RangePicker),
  React.createElement(RangePicker, { showTime: true }),
  React.createElement(RangePicker, { separator: '→' }),
  React.createElement(RangePicker, {
    presets: [{ label: 'W', value: [D('2026-09-28'), D('2026-09-30')] }],
  }),
];

const raw = renderToStaticMarkup(
  React.createElement(
    StyleProvider,
    { cache },
    React.createElement(ConfigProvider, null, React.createElement('div', null, cases)),
  ),
);
const css = extractStyle(cache, true);

if (!onlyTokens) {
  console.log(css);
  process.exit(0);
}

// ── --tokens：抓 `--ant-picker-*` 的声明块 ──
const decls = new Map();
for (const m of css.matchAll(/--ant-date-picker-([a-z0-9-]+)\s*:\s*([^;}"]+)/g)) {
  if (!decls.has(m[1])) decls.set(m[1], m[2].trim());
}
const sorted = [...decls.entries()].sort();
console.log(`# antd 6.6.4 DatePicker 的 --ant-date-picker-*（声明值，共 ${sorted.length} 个）`);
for (const [k, v] of sorted) console.log(`${k}=${v}`);

// 规则里引用的**非 picker 前缀**变量（别名 token 与其它组件族的）
const foreign = new Set();
for (const m of css.matchAll(/var\((--ant-(?!date-picker-)[a-z0-9-]+)/g)) foreign.add(m[1]);
console.log(`\n# 规则里引用的其它变量（${foreign.size} 个，供 B7 核对是否都在 theme 声明）`);
for (const k of [...foreign].sort()) console.log(k);

// ── 直接算一遍 lighten 家族，给 token.ts 的断言当独立判据 ──
console.log(
  '\n# FastColor.lighten 的独立判定值（token.ts 里 cellHoverWithRangeBg / cellRangeBorderColor）',
);
for (const amount of [35, 20]) {
  console.log(
    `lighten(${amount}) from #1677ff = ${new FastColor('#1677ff').lighten(amount).toHexString()}`,
  );
}
void raw;
