/** 临时脚本：React SSR + cssinjs extractStyle，dump antd Steps 的真实 CSS 产物。 */
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
const { ConfigProvider, Steps } = require('antd');

const cache = createCache();

const items = [
  { title: 'One', content: 'c1' },
  { title: 'Two', content: 'c2' },
  { title: 'Three', content: 'c3' },
];
const many = Array.from({ length: 8 }, (_, i) => ({ title: `S${i}`, content: `c${i}` }));

const el = React.createElement(
  StyleProvider,
  { cache },
  React.createElement(
    ConfigProvider,
    { theme: { cssVar: true } },
    React.createElement(
      'div',
      null,
      // 默认（filled）× 状态推导
      React.createElement(Steps, { items, current: 1 }),
      // outlined
      React.createElement(Steps, { items, current: 1, variant: 'outlined' }),
      // 尺寸
      React.createElement(Steps, { items, current: 1, size: 'small' }),
      // vertical
      React.createElement(Steps, { items, current: 1, orientation: 'vertical' }),
      // titlePlacement
      React.createElement(Steps, { items, current: 1, titlePlacement: 'vertical' }),
      // nav
      React.createElement(Steps, { items, current: 1, type: 'navigation' }),
      // panel
      React.createElement(Steps, { items, current: 1, type: 'panel' }),
      // dot
      React.createElement(Steps, { items, current: 1, type: 'dot' }),
      // dot vertical
      React.createElement(Steps, { items, current: 1, type: 'dot', orientation: 'vertical' }),
      // inline
      React.createElement(Steps, { items, current: 1, type: 'inline' }),
      // progress
      React.createElement(Steps, { items, current: 1, percent: 60 }),
      // error 状态
      React.createElement(Steps, {
        items: [...items.slice(0, 1), { title: 'Two', content: 'c2', status: 'error' }],
        current: 1,
      }),
      // maxCount 折叠
      React.createElement(Steps, { items: many, current: 4, maxCount: 4 }),
      // clickable
      React.createElement(Steps, { items, current: 1, onChange: () => undefined }),
      // RTL
      React.createElement(
        ConfigProvider,
        { theme: { cssVar: true }, direction: 'rtl' },
        React.createElement(Steps, { items, current: 1 }),
      ),
    ),
  ),
);

renderToStaticMarkup(el);
const css = extractStyle(cache, { plain: true });

// 按括号配平拆块（与 select 提取脚本同法），过滤 ant-steps 相关 + 保留 at-rule 块体
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
  if (sel.includes('ant-steps') || body.includes('ant-steps') || sel.includes('@keyframes')) {
    blocks.push(block);
  }
  idx = end;
}
console.log(blocks.join('\n'));
