/**
 * 临时脚本：React SSR + cssinjs extractStyle，dump antd Menu 的真实 CSS 产物。
 * 用于 packages/ui/src/menu/style/index.ts 的机械转换（同 tooltip/popover 管线）。
 *
 * 过滤：ant-menu 组件样式 + motion（slide-up / zoom-big / motion-collapse ——
 * antd defaultMotions 的三个 motion；collapse 是 cssinjs 的 CollapseMotion）。
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
const { ConfigProvider, Menu } = require('antd');

const cache = createCache();

const items = [
  { key: '1', label: 'One' },
  { key: 'sub1', label: 'Sub', children: [{ key: '3', label: 'Three' }] },
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
      React.createElement(Menu, { items, defaultOpenKeys: ['sub1'], mode: 'inline' }),
      React.createElement(Menu, { items, mode: 'vertical' }),
      React.createElement(Menu, { items, mode: 'horizontal' }),
    ),
  ),
);

renderToStaticMarkup(el);
const css = extractStyle(cache, true);

require('node:fs').writeFileSync('/tmp/menu-full.css', css);

// 括号配平逐块提取（tooltip 期教训：按 } 切会把 @keyframes 切碎）
const blocks = [];
let idx = 0;
while (idx < css.length) {
  const braceStart = css.indexOf('{', idx);
  if (braceStart < 0) break;
  // 规则起点 = 上一个 } 或 ; 之后
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
    sel.includes('ant-menu') ||
    sel.includes('slide-up') ||
    sel.includes('zoom-big') ||
    sel.includes('motion-collapse') ||
    sel.includes('@keyframes') ||
    sel.includes('anticon')
  ) {
    blocks.push(block);
  }
  idx = end;
}
const keep = blocks;
console.log(keep.join('\n'));
