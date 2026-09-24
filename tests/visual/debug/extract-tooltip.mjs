/**
 * 临时脚本：React SSR + cssinjs extractStyle，dump antd Tooltip 的真实 CSS 产物。
 * 用于 packages/ui/src/tooltip/style/index.ts 的机械转换（analysis §1）。
 *
 * @ant-design/cssinjs 未被 pnpm 提升到根 —— 用 antd 的依赖解析路径 require。
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const antdPath = require.resolve('antd');
const antdRoot = antdPath.slice(0, antdPath.indexOf('antd/es') >= 0 ? antdPath.indexOf('antd/es') : antdPath.indexOf('antd/dist'));
const cssinjsPath = require.resolve('@ant-design/cssinjs', { paths: [antdRoot] });

const { createCache, extractStyle, StyleProvider } = require(cssinjsPath);
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { ConfigProvider, Tooltip } = require('antd');

const cache = createCache();

const el = React.createElement(
  StyleProvider,
  { cache },
  React.createElement(
    ConfigProvider,
    { theme: { cssVar: true } },
    React.createElement(Tooltip, { title: 'x', open: true }, React.createElement('button', null, 't')),
  ),
);

renderToStaticMarkup(el);
const css = extractStyle(cache, true);

// 只留 tooltip 组件样式 + zoom-big-fast motion（tooltip 的 motionName）
const keep = [];
for (const rule of css.split('}')) {
  if (!rule.trim()) continue;
  const sel = rule.split('{')[0] ?? '';
  if (sel.includes('ant-tooltip') || sel.includes('zoom-big-fast')) {
    keep.push(`${rule}}`);
  }
}
// keyframes（嵌套块，括号配平提取）
const kf = [];
let idx = css.indexOf('@keyframes');
while (idx >= 0) {
  let depth = 0, end = idx;
  for (let i = idx; i < css.length; i++) {
    if (css[i] === '{') depth++;
    if (css[i] === '}') { depth--; if (depth === 0) { end = i + 1; break; } }
  }
  const block = css.slice(idx, end);
  if (block.includes('antFade') || block.includes('antZoomBig')) kf.push(block);
  idx = css.indexOf('@keyframes', end);
}
console.log(kf.join('
'));
console.log(keep.join('
'));
