/** 临时脚本：React SSR + cssinjs extractStyle，dump antd 6.6.4 Tree 的真实 CSS 产物。 */
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
const { ConfigProvider, Tree } = require('antd');

const cache = createCache();

const treeData = [
  {
    title: 'parent 1',
    key: '0-0',
    children: [
      { title: 'leaf', key: '0-0-0', isLeaf: true },
      { title: 'parent 1-1', key: '0-0-1', children: [{ title: 'leaf', key: '0-0-1-0' }] },
    ],
  },
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
      React.createElement(Tree, {
        treeData,
        checkable: true,
        defaultExpandAll: true,
        showLine: true,
      }),
      React.createElement(Tree.DirectoryTree, { treeData, defaultExpandAll: true }),
    ),
  ),
);
renderToStaticMarkup(el);
const css = extractStyle(cache);

console.log(css);
