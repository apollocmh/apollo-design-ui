/** 临时脚本：React SSR + cssinjs extractStyle，dump antd 6.6.4 Avatar 的真实 CSS 产物。 */
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
const { ConfigProvider, Avatar } = require('antd');

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
      h(Avatar, null, 'U'),
      h(Avatar, { size: 'large' }, 'U'),
      h(Avatar, { size: 'small' }, 'U'),
      h(Avatar, { size: 40 }, 'U'),
      h(Avatar, { shape: 'square' }, 'U'),
      h(Avatar, { icon: h('span', { className: 'anticon' }, 'i') }),
      h(Avatar, { src: 'x.png' }),
      h(Avatar, { src: h('img', { src: 'x.png', alt: 'a' }) }),
      h(Avatar.Group, null, h(Avatar, null, 'A'), h(Avatar, null, 'B')),
      h(Avatar.Group, { max: { count: 1 } }, h(Avatar, null, 'A'), h(Avatar, null, 'B')),
    ),
  ),
);
renderToStaticMarkup(el);
const css = extractStyle(cache);

console.log(css);
