/** 临时脚本：React SSR + cssinjs extractStyle，dump antd 6.6.4 Card 的真实 CSS 产物。 */
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
const { ConfigProvider, Card } = require('antd');

const cache = createCache();

const h = React.createElement;

const el = h(
  StyleProvider,
  { cache },
  h(
    ConfigProvider,
    { theme: { cssVar: true } },
    h(
      'div',
      null,
      // 覆盖全部根形态
      h(Card, { title: 'T', extra: 'E' }, 'body'),
      h(Card, { title: 'T', hoverable: true }, 'body'),
      h(Card, { loading: true, title: 'T' }, 'body'),
      h(Card, { size: 'small', title: 'T' }, 'body'),
      h(Card, { variant: 'borderless', title: 'T' }, 'body'),
      h(Card, { type: 'inner', title: 'T' }, 'body'),
      h(Card, { actions: [h('span', { key: 'a' }, 'A')], title: 'T' }, 'body'),
      h(Card, { cover: h('img', { alt: 'c' }), title: 'T' }, 'body'),
      h(
        Card,
        { title: 'T' },
        h(Card.Grid, { key: 'g1' }, 'g'),
        h(Card.Grid, { key: 'g2', hoverable: false }, 'g'),
      ),
      h(Card, { tabList: [{ key: 'k1', tab: 'Tab1' }] }, 'body'),
      h(
        Card,
        { title: 'T' },
        h(Card.Meta, { avatar: h('span', null, 'av'), title: 'mt', description: 'md' }),
      ),
    ),
  ),
);
renderToStaticMarkup(el);
const css = extractStyle(cache);

console.log(css);
