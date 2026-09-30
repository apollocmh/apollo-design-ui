/**
 * extract-date-picker-css.mjs — dump antd 6.6.4 DatePicker 的 CSS 产物 / Component Token。
 *
 * 三种用法：
 *   node tests/visual/debug/extract-date-picker-css.mjs                 # 原始 CSS 产物
 *   node tests/visual/debug/extract-date-picker-css.mjs --tokens        # 45 个变量 + 引用面
 *   node tests/visual/debug/extract-date-picker-css.mjs --emit-static   # 机械转换成静态 CSS
 *
 * ── 🚨 面板规则怎么进产物（本轮的关键）──────────────────────────────────────
 *
 * SSR 下浮层走 Portal ⇒ **不渲染**（实测 `open: true` 的 SSR 只有 889 B，与不传 `open`
 * 字节相同）⇒ 面板那批规则（`-panel` / `-cell` / `-time-panel` / `-preset`）**不会进 cache**。
 *
 * 解法（与 `extract-cascader-css.mjs` 同路）：直接渲染 **`PurePanel`**
 * （`DatePicker._InternalPanelDoNotUseOrYouWillBeFired` / `RangePicker` 的同名导出）——
 * 它跳过输入框与浮层、**只出面板**，于是面板规则照样注册进 cssinjs cache。
 *
 * ⚠️ `ant-picker` 这个前缀**同时被 date-picker 与 time-picker 使用**（上游刻意共用）⇒
 * 产物里会含 time-picker 的规则。那是**对的**（同一组件族），但移植时要知道。
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

const emitStatic = process.argv.includes('--emit-static');
const tokensOnly = process.argv.includes('--tokens');
const cache = createCache();

const { RangePicker } = DatePicker;
const D = (s) => dayjs(s);

/**
 * 面板直渲的出口（名字带「别用」⇒ 上游刻意保留原名）。
 *
 * ⚠️ **两个名字不一样**，且**都在 `DatePicker` 上**（不在 `RangePicker` 上）——
 * 实测 `Object.keys(DatePicker)`：
 * ```
 * _InternalPanelDoNotUseOrYouWillBeFired        ← 单值面板
 * _InternalRangePanelDoNotUseOrYouWillBeFired   ← 范围面板（注意中间有 Range）
 * ```
 * 写成 `RangePicker._InternalPanelDoNotUseOrYouWillBeFired` 会拿到 `undefined`，
 * 报「Element type is invalid … but got: undefined」（本轮实测）。
 */
const SinglePanel = DatePicker._InternalPanelDoNotUseOrYouWillBeFired;
const RangePanel = DatePicker._InternalRangePanelDoNotUseOrYouWillBeFired;

/**
 * 触发器侧的用例（尺寸 / 变体 / 状态 / 禁用 / multiple / presets / 自定义分隔符）。
 *
 * ⚠️ 这些**只贡献触发器规则**；面板规则由下面的 `panelCases` 提供。
 */
const triggerCases = [
  React.createElement(DatePicker, { key: 't1' }),
  React.createElement(DatePicker, { key: 't2', defaultValue: D('2026-09-30') }),
  React.createElement(DatePicker, { key: 't3', size: 'small' }),
  React.createElement(DatePicker, { key: 't4', size: 'large' }),
  React.createElement(DatePicker, { key: 't5', variant: 'filled' }),
  React.createElement(DatePicker, { key: 't6', variant: 'borderless' }),
  React.createElement(DatePicker, { key: 't7', variant: 'underlined' }),
  React.createElement(DatePicker, { key: 't8', status: 'error' }),
  React.createElement(DatePicker, { key: 't9', status: 'warning' }),
  React.createElement(DatePicker, { key: 't10', disabled: true }),
  React.createElement(DatePicker, {
    key: 't11',
    allowClear: false,
    defaultValue: D('2026-09-30'),
  }),
  React.createElement(DatePicker, { key: 't12', prefix: 'P' }),
  React.createElement(DatePicker, {
    key: 't13',
    multiple: true,
    defaultValue: [D('2026-09-30')],
  }),
  React.createElement(DatePicker, {
    key: 't14',
    presets: [{ label: 'Now', value: D('2026-09-30') }],
  }),
  React.createElement(RangePicker, { key: 't15' }),
  React.createElement(RangePicker, {
    key: 't16',
    defaultValue: [D('2026-09-28'), D('2026-09-30')],
  }),
  React.createElement(RangePicker, { key: 't17', separator: '→' }),
  React.createElement(RangePicker, { key: 't18', allowEmpty: [true, true] }),
  React.createElement(RangePicker, {
    key: 't19',
    presets: [{ label: 'W', value: [D('2026-09-28'), D('2026-09-30')] }],
  }),
];

/**
 * 面板侧：**直渲 `PurePanel`** ⇒ 面板规则进 cache（SSR 下浮层不渲染，见文件头）。
 *
 * 覆盖 6 个 `picker` 粒度 + `showTime`（`datetime` 面板）+ `multiple` + 上下钻模式 + 范围版。
 */
const panelCases = [
  React.createElement(SinglePanel, { key: 'p1', picker: 'date' }),
  React.createElement(SinglePanel, { key: 'p2', picker: 'week' }),
  React.createElement(SinglePanel, { key: 'p3', picker: 'month' }),
  React.createElement(SinglePanel, { key: 'p4', picker: 'quarter' }),
  React.createElement(SinglePanel, { key: 'p5', picker: 'year' }),
  React.createElement(SinglePanel, { key: 'p6', picker: 'time' }),
  // `date` + `showTime` ⇒ `datetime` 面板（时间列 + 确定按钮）
  React.createElement(SinglePanel, { key: 'p7', picker: 'date', showTime: true }),
  React.createElement(SinglePanel, { key: 'p8', picker: 'date', showTime: { use12Hours: true } }),
  React.createElement(SinglePanel, { key: 'p9', picker: 'date', multiple: true }),
  React.createElement(SinglePanel, { key: 'p10', picker: 'date', mode: 'year' }),
  React.createElement(SinglePanel, { key: 'p11', picker: 'date', mode: 'decade' }),
  React.createElement(RangePanel, { key: 'p12', picker: 'date' }),
  React.createElement(RangePanel, { key: 'p13', picker: 'date', showTime: true }),
];

renderToStaticMarkup(
  React.createElement(
    StyleProvider,
    { cache },
    React.createElement(
      ConfigProvider,
      { theme: { cssVar: true } },
      React.createElement('div', null, ...triggerCases, ...panelCases),
    ),
  ),
);
const raw = extractStyle(cache);

// ── --emit-static：机械转换成静态 CSS（与 tabs / form / slider / pagination 同一套）──
if (emitStatic) {
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
        head.includes('picker') || (head.startsWith('@media') && body.includes('picker')),
    );
  console.error(`[extract-date-picker] 规则 ${rules.length} 条`);
  console.log(rules.map(([h, b]) => `${h}{${b}}`).join('\n'));
  process.exit(0);
}

// ── --tokens：抓 `--ant-date-picker-*` 的声明值 ──
if (tokensOnly) {
  const decls = new Map();
  for (const m of raw.matchAll(/--ant-date-picker-([a-z0-9-]+)\s*:\s*([^;}"]+)/g)) {
    if (!decls.has(m[1])) decls.set(m[1], m[2].trim());
  }
  const sorted = [...decls.entries()].sort();
  console.log(`# antd 6.6.4 DatePicker 的 --ant-date-picker-*（判定值，共 ${sorted.length} 个）`);
  for (const [k, v] of sorted) console.log(`${k}=${v}`);

  const foreign = new Set();
  for (const m of raw.matchAll(/var\((--ant-(?!date-picker-)[a-z0-9-]+)/g)) foreign.add(m[1]);
  console.log(`\n# 规则里引用的其它变量（${foreign.size} 个，供 B7 核对是否都在 theme 声明）`);
  for (const k of [...foreign].sort()) console.log(k);

  console.log('\n# FastColor.lighten 的独立判定值');
  for (const amount of [35, 20]) {
    console.log(
      `lighten(${amount}) from #1677ff = ${new FastColor('#1677ff').lighten(amount).toHexString()}`,
    );
  }
  process.exit(0);
}

console.log(raw);
