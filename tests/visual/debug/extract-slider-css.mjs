/**
 * extract-slider-css.mjs — dump antd 6.6.4 Slider 的真实 CSS 产物 / Component Token 值。
 *
 * 两种用法：
 *   node tests/visual/debug/extract-slider-css.mjs               # 原始产物
 *   node tests/visual/debug/extract-slider-css.mjs --tokens      # 只打印 18 个 Component Token 的判定值
 *
 * 为什么必须 dump 而不是读源码：`prepareComponentToken` 里有构建期算式
 * （`FastColor(...).setA(0.2)` / `.onBackground(...)` / `controlHeightLG/4`），
 * 判定值只能从产物里读（tour / form 同判）。
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
const { ConfigProvider, Slider } = require('antd');

const tokensOnly = process.argv.includes('--tokens');

const cache = createCache();

const mark = { style: { color: '#999' }, label: 'mark' };

const slides = [
  // 单把手 + marks（触发 rail/track/handle/mark/dot 全套规则）
  React.createElement(Slider, {
    key: 's1',
    defaultValue: 30,
    marks: { 0: '0', 50: mark, 100: '100' },
  }),
  // range + dots + tooltip
  React.createElement(Slider, {
    key: 's2',
    range: true,
    defaultValue: [20, 60],
    dots: true,
    tooltip: { open: true },
  }),
  // vertical + reverse + step null + included=false + disabled + startPoint
  React.createElement(Slider, { key: 's3', vertical: true, reverse: true, defaultValue: 40 }),
  React.createElement(Slider, {
    key: 's4',
    step: null,
    marks: { 0: 'a', 100: 'b' },
    defaultValue: 100,
  }),
  React.createElement(Slider, { key: 's5', included: false, defaultValue: 70 }),
  React.createElement(Slider, { key: 's6', disabled: true, defaultValue: 10 }),
  React.createElement(Slider, { key: 's7', startPoint: 20, defaultValue: 60 }),
  React.createElement(Slider, {
    key: 's8',
    orientation: 'vertical',
    range: { draggableTrack: true },
    defaultValue: [10, 90],
  }),
  React.createElement(Slider, { key: 's9', range: { editable: true }, defaultValue: [10, 50, 90] }),
];

const el = React.createElement(
  StyleProvider,
  { cache },
  React.createElement(
    ConfigProvider,
    { theme: { cssVar: true } },
    React.createElement('div', null, ...slides),
  ),
);
renderToStaticMarkup(el);
const raw = extractStyle(cache);

if (!tokensOnly) {
  console.log(raw);
  process.exit(0);
}

// 抓 `--ant-slider-*` 的声明块（css-var 轨）
const decls = new Map();
for (const m of raw.matchAll(/--ant-slider-([a-z0-9-]+)\s*:\s*([^;}"]+)/g)) {
  if (!decls.has(m[1])) decls.set(m[1], m[2].trim());
}
const sorted = [...decls.entries()].sort();
console.log(`# antd 6.6.4 Slider Component Token（判定值，共 ${sorted.length} 个）`);
for (const [k, v] of sorted) console.log(`${k}=${v}`);
