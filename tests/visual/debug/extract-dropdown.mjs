/** 临时脚本：React SSR + cssinjs extractStyle，dump antd Dropdown 的真实 CSS 产物。 */
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
const { ConfigProvider, Dropdown, Button } = require('antd');

const cache = createCache();

const menuItems = [
  { key: '1', label: 'One' },
  { key: 'sub', label: 'Sub', children: [{ key: '2', label: 'Two' }] },
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
      React.createElement(
        Dropdown,
        { menu: { items: menuItems }, open: true },
        React.createElement(Button, null, 't'),
      ),
      React.createElement(
        Dropdown,
        { menu: { items: menuItems }, open: true, placement: 'topLeft', arrow: true },
        React.createElement(Button, null, 't'),
      ),
      React.createElement(
        Dropdown,
        { menu: { items: menuItems }, open: true, placement: 'bottomRight', disabled: true },
        React.createElement(Button, null, 't'),
      ),
      React.createElement(
        Dropdown,
        { menu: { items: menuItems }, open: true, placement: 'top' },
        React.createElement(Button, null, 't'),
      ),
    ),
  ),
);

renderToStaticMarkup(el);
const css = extractStyle(cache, true);

require('node:fs').writeFileSync('/tmp/dropdown-full.css', css);

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
  if (
    sel.includes('ant-dropdown') ||
    sel.includes('slide-up') ||
    sel.includes('slide-down') ||
    sel.includes('slide-left') ||
    sel.includes('slide-right') ||
    sel.includes('@keyframes')
  ) {
    blocks.push(block);
  }
  idx = end;
}
console.log(blocks.join('\n'));
