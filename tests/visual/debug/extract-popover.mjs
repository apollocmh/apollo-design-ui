/**
 * 临时脚本：React SSR + cssinjs extractStyle，dump antd Popover 的真实 CSS 产物。
 * 用于 packages/ui/src/popover/style/index.ts 的机械转换（同 tooltip 管线）。
 *
 * Popover 内部渲染 Tooltip ⇒ tooltip 样式也会进 cache，按选择器过滤：
 * 只留 ant-popover 组件样式 + zoom-big（非 fast）motion。
 * 额外 dump 全量 CSS 里 popover 关联的 @keyframes 名单（SSR 不吐 keyframes）。
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
const { ConfigProvider, Popover } = require('antd');

const cache = createCache();

const el = React.createElement(
  StyleProvider,
  { cache },
  React.createElement(
    ConfigProvider,
    { theme: { cssVar: true } },
    React.createElement(
      Popover,
      { title: 'x', content: 'y', open: true },
      React.createElement('button', null, 't'),
    ),
  ),
);

renderToStaticMarkup(el);
const css = extractStyle(cache, true);

require('node:fs').writeFileSync('/tmp/popover-full.css', css);

// 只留 popover 组件样式 + zoom-big（非 fast）motion
const keep = [];
for (const rule of css.split('}')) {
  if (!rule.trim()) continue;
  const sel = rule.split('{')[0] ?? '';
  const isZoomBig = sel.includes('zoom-big') && !sel.includes('fast');
  if (sel.includes('ant-popover') || isZoomBig) {
    keep.push(`${rule}}`);
  }
}
console.log(keep.join('\n'));
