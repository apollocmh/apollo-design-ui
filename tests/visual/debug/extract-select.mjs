/** 临时脚本：React SSR + cssinjs extractStyle，dump antd Select 的真实 CSS 产物。 */
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
const { ConfigProvider, Select } = require('antd');
const fs = require('node:fs');

const cache = createCache();

const options = [
  { value: 'one', label: 'One' },
  { value: 'two', label: 'Two', disabled: true },
  { value: 'three', label: 'Three' },
];
const groupOptions = [
  {
    label: 'Group',
    options: [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
    ],
  },
];

const el = React.createElement(
  StyleProvider,
  { cache },
  React.createElement(
    ConfigProvider,
    { theme: { cssVar: true } },
    React.createElement(
      'div',
      null,
      // 单选 × 尺寸 × 变体 × 状态 × 打开
      React.createElement(Select, { options, open: true, value: 'one' }),
      React.createElement(Select, { options, open: true, size: 'small' }),
      React.createElement(Select, { options, open: true, size: 'large' }),
      React.createElement(Select, { options, open: true, variant: 'filled' }),
      React.createElement(Select, { options, open: true, variant: 'borderless' }),
      React.createElement(Select, { options, open: true, variant: 'underlined' }),
      React.createElement(Select, { options, open: true, status: 'error' }),
      React.createElement(Select, { options, open: true, status: 'warning' }),
      React.createElement(Select, { options, open: true, disabled: true }),
      React.createElement(Select, { options, open: true, allowClear: true, value: 'one' }),
      React.createElement(Select, { options, open: true, showSearch: true }),
      React.createElement(Select, { options, open: true, loading: true }),
      React.createElement(Select, { options, open: true, placement: 'topLeft' }),
      React.createElement(Select, { options: groupOptions, open: true }),
      React.createElement(Select, { options: [], open: true }),
      // 多选 / tags
      React.createElement(Select, {
        options,
        open: true,
        mode: 'multiple',
        value: ['one', 'two'],
      }),
      React.createElement(Select, {
        options,
        open: true,
        mode: 'tags',
        value: ['one'],
        maxTagCount: 1,
      }),
      React.createElement(Select, {
        options,
        open: true,
        mode: 'multiple',
        disabled: true,
        value: ['two'],
      }),
      // rtl
      React.createElement(
        ConfigProvider,
        { direction: 'rtl' },
        React.createElement(Select, { options, open: true }),
      ),
    ),
  ),
);

renderToStaticMarkup(el);
const css = extractStyle(cache, true);

fs.writeFileSync('/tmp/select-full.css', css);

// 括号配平逐块提取（tooltip 期教训）
const blocks = [];
let idx = 0;
while (idx < css.length) {
  const braceStart = css.indexOf('{', idx);
  if (braceStart < 0) break;
  let start = idx;
  for (let i = braceStart - 1; i >= idx; i--) {
    if (css[i] === '}' || css[i] === ';') {
      start = i + 1;
      break;
    }
  }
  let depth = 0;
  let end = braceStart;
  for (let i = braceStart; i < css.length; i++) {
    if (css[i] === '{') depth++;
    if (css[i] === '}') {
      depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  const block = css.slice(start, end);
  const sel = block.slice(0, block.indexOf('{'));
  // ⚠️ at-rule（@media / @supports）的选择器里不含 `ant-select` —— 必须看**块体**
  // （modal 期的教训：按选择器过滤会整块丢掉响应式规则）
  const body = block.slice(block.indexOf('{'));
  if (sel.includes('ant-select') || body.includes('ant-select') || sel.includes('@keyframes')) {
    if (!sel.includes('@keyframes') || body.includes('slide-up') || body.includes('slide-down')) {
      blocks.push(block);
    }
  }
  idx = end;
}
console.log(blocks.join('\n'));
