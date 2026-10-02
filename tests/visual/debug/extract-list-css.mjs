/**
 * 临时脚本：React SSR + cssinjs extractStyle，dump antd 6.6.4 List 的真实 CSS 产物。
 *
 * 用法：
 *   node tests/visual/debug/extract-list-css.mjs > /tmp/list-antd.css
 *   grep -c '^\.ant-list' /tmp/list-antd.css     # 规则条数
 *
 * ⚠️ `List` 在 antd 6.6.4 里**整体 deprecated**（源码对非生产环境发 `console.error`，
 *    指向 `Listy`）。脚本里 `console.error` 会被 antd 打到 stderr，不影响 stdout 的 CSS。
 *
 * 覆盖全部样式分支：base / bordered / responsive(media) / split / vertical / grid /
 * size(lg,sm) / loading / empty / header+footer / item-action / item-meta。
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
const { ConfigProvider, List } = require('antd');

const cache = createCache();
const h = React.createElement;

const item = (text, extra) =>
  h(
    List.Item,
    { actions: [h('a', { key: 'a' }, 'edit'), h('a', { key: 'b' }, 'more')], extra },
    h(List.Item.Meta, {
      avatar: h('span', { className: 'avatar' }, 'A'),
      title: h('a', { href: '#' }, text),
      description: 'description text',
    }),
    'item content',
  );

const data = ['Alpha', 'Beta', 'Gamma'];

const el = h(
  StyleProvider,
  { cache },
  h(
    ConfigProvider,
    { theme: { cssVar: true } },
    h(
      'div',
      null,
      // base
      h(List, { dataSource: data, renderItem: (t) => item(t) }),
      // bordered + header/footer
      h(List, {
        bordered: true,
        header: 'Header',
        footer: 'Footer',
        dataSource: data,
        renderItem: (t) => item(t),
      }),
      // split=false
      h(List, { split: false, dataSource: data, renderItem: (t) => item(t) }),
      // size
      h(List, { size: 'large', dataSource: data, renderItem: (t) => item(t) }),
      h(List, { size: 'small', dataSource: data, renderItem: (t) => item(t) }),
      // vertical + extra
      h(List, {
        itemLayout: 'vertical',
        dataSource: data,
        renderItem: (t) => item(t, h('span', null, 'extra')),
      }),
      // grid
      h(List, { grid: { column: 3, gutter: 16 }, dataSource: data, renderItem: (t) => item(t) }),
      h(List, {
        grid: { column: 2, xs: 1, sm: 2, md: 3, lg: 4, xl: 5, xxl: 6, xxxl: 7 },
        dataSource: data,
        renderItem: (t) => item(t),
      }),
      // pagination / loadMore / loading / empty
      h(List, {
        pagination: { pageSize: 2, position: 'both' },
        dataSource: data,
        renderItem: (t) => item(t),
      }),
      h(List, { loadMore: h('div', null, 'more'), dataSource: data, renderItem: (t) => item(t) }),
      h(List, { loading: true, dataSource: data, renderItem: (t) => item(t) }),
      h(List, { loading: { spinning: true } }),
      h(List, null),
      // no-flex（多文本子节点）
      h(List, { dataSource: data, renderItem: (t) => h(List.Item, null, 'a', 'b', t) }),
    ),
  ),
);
renderToStaticMarkup(el);
const css = extractStyle(cache);

console.log(css);
