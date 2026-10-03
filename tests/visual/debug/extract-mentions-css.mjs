/** 临时脚本：React SSR + cssinjs extractStyle，dump antd 6.6.4 Mentions 的真实 CSS 产物。 */
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
const { ConfigProvider, Mentions } = require('antd');

const cache = createCache();

const options = [
  { value: 'afc163', label: 'afc163' },
  { value: 'zombieJ', label: 'zombieJ' },
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
      React.createElement(Mentions, { options, value: '@', style: { width: '100%' } }),
      React.createElement(Mentions, { options, variant: 'filled' }),
      React.createElement(Mentions, { options, variant: 'borderless' }),
      React.createElement(Mentions, { options, variant: 'underlined' }),
      React.createElement(Mentions, { options, size: 'large' }),
      React.createElement(Mentions, { options, size: 'small' }),
      React.createElement(Mentions, { options, status: 'error' }),
      React.createElement(Mentions, { options, status: 'warning' }),
      React.createElement(Mentions, { options, disabled: true }),
      React.createElement(Mentions, { options, readOnly: true }),
      React.createElement(Mentions, { options, allowClear: true, value: '@x' }),
      React.createElement(Mentions, { options, showCount: true, maxLength: 20 }),
      React.createElement(Mentions, { options, loading: true }),
      React.createElement(Mentions, { options, notFoundContent: 'x' }),
      React.createElement(Mentions, { options, rows: 3 }),
      React.createElement(
        ConfigProvider,
        { direction: 'rtl' },
        React.createElement(Mentions, { options }),
      ),
    ),
  ),
);

renderToStaticMarkup(el);
const css = extractStyle(cache, { plain: true });

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
  if (sel.includes('ant-mentions') || body.includes('ant-mentions') || sel.includes('@keyframes')) {
    blocks.push(block);
  }
  idx = end;
}
console.log(blocks.join('\n'));
