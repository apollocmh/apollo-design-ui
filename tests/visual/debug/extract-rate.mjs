/** 临时脚本：React SSR + cssinjs extractStyle，dump antd Rate 的真实 CSS 产物。 */
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
const { ConfigProvider, Rate } = require('antd');

const cache = createCache();

const el = React.createElement(
  StyleProvider,
  { cache },
  React.createElement(
    ConfigProvider,
    { theme: { cssVar: true } },
    React.createElement(
      'div',
      null,
      React.createElement(Rate, { defaultValue: 3 }),
      React.createElement(Rate, { defaultValue: 2.5, allowHalf: true }),
      React.createElement(Rate, { defaultValue: 3, allowClear: false }),
      React.createElement(Rate, { defaultValue: 2, disabled: true }),
      React.createElement(Rate, { defaultValue: 3, size: 'large' }),
      React.createElement(Rate, { defaultValue: 3, size: 'small' }),
      React.createElement(Rate, { defaultValue: 3, character: 'A' }),
      React.createElement(
        ConfigProvider,
        { theme: { cssVar: true }, direction: 'rtl' },
        React.createElement(Rate, { defaultValue: 3 }),
      ),
    ),
  ),
);

renderToStaticMarkup(el);
const css = extractStyle(cache, { plain: true });

// 按括号配平拆块（与 steps 提取脚本同法），过滤 ant-rate 相关 + 保留 at-rule 块体
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
  const body = block.slice(block.indexOf('{'));
  if (sel.includes('ant-rate') || body.includes('ant-rate') || sel.includes('@keyframes')) {
    blocks.push(block);
  }
  idx = end;
}
console.log(blocks.join('\n'));
