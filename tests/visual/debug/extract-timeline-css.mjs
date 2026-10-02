/**
 * 临时脚本：React SSR + cssinjs extractStyle，dump antd 6.6.4 Timeline 的真实 CSS 产物。
 *
 * 用法：
 *   node tests/visual/debug/extract-timeline-css.mjs > /tmp/timeline-antd.css
 *
 * ⚠️ `Timeline` **没有自己的 DOM** —— 它是 `<Steps type="dot" />` 的薄壳
 *    ⇒ 产物里同时含 `ant-timeline-*` 与 `ant-steps-*` 两组规则；
 *    只统计/对照 `ant-timeline` 的那部分（Steps 的已由它自己的产物覆盖）。
 *
 * 覆盖：basic / alternate / 横向 / titleSpan / 自定义 color / pending / reverse /
 *       loading / variant / 语义化 classNames。
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
const { ConfigProvider, Timeline } = require('antd');

const cache = createCache();
const h = React.createElement;

const items = (n, extra = {}) =>
  Array.from({ length: n }, (_, i) => ({
    key: `k${i}`,
    title: `Step ${i}`,
    content: `content ${i}`,
    ...extra,
  }));

const el = h(
  StyleProvider,
  { cache },
  h(
    ConfigProvider,
    { theme: { cssVar: true } },
    h(
      'div',
      null,
      // 1) basic（默认 mode=start、vertical）
      h(Timeline, { items: items(3) }),
      // 2) alternate
      h(Timeline, { mode: 'alternate', items: items(4) }),
      // 3) 横向
      h(Timeline, { orientation: 'horizontal', items: items(3) }),
      // 4) titleSpan（数字 / 字符串两条分支）
      h(Timeline, { titleSpan: 100, items: items(3) }),
      h(Timeline, { titleSpan: '20%', items: items(3) }),
      // 5) 自定义颜色（预设 + 任意色值两条分支）
      h(Timeline, {
        items: [
          { key: 'a', title: 'A', color: 'red' },
          { key: 'b', title: 'B', color: 'green' },
          { key: 'c', title: 'C', color: '#00f' },
        ],
      }),
      // 6) loading / icon / pending
      h(Timeline, { items: [{ key: 'a', title: 'A', loading: true }] }),
      h(Timeline, { items: [{ key: 'a', title: 'A', icon: h('span', null, 'i') }] }),
      h(Timeline, { pending: 'pending', items: items(2) }),
      // 7) reverse
      h(Timeline, { reverse: true, items: items(3) }),
      // 8) variant / size / percent（透传给 Steps 的 props）
      h(Timeline, { variant: 'outlined', items: items(2) }),
      h(Timeline, { variant: 'filled', items: items(2) }),
      // 9) 语义化 classNames
      h(Timeline, {
        items: items(2),
        classNames: { item: 'my-item', itemTitle: 'my-title', itemRail: 'my-rail' },
      }),
      // 10) 仅 content、无 title（layoutAlternate 的判据）
      h(Timeline, { items: [{ key: 'a', content: 'only content' }] }),
    ),
  ),
);
renderToStaticMarkup(el);
const css = extractStyle(cache);

console.log(css);
