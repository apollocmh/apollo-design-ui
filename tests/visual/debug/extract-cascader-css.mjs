/** 临时脚本：React SSR + cssinjs extractStyle，dump antd 6.6.4 Cascader 的真实 CSS 产物。 */
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
const { ConfigProvider, Cascader } = require('antd');

const cache = createCache();

const options = [
  {
    value: 'zj',
    label: '浙江',
    children: [
      { value: 'hz', label: '杭州', children: [{ value: 'xh', label: '西湖' }] },
      { value: 'nb', label: '宁波' },
    ],
  },
  { value: 'js', label: '江苏', children: [{ value: 'nj', label: '南京' }] },
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
      React.createElement(Cascader, { options, open: true, value: ['zj', 'hz'] }),
      React.createElement(Cascader, { options, multiple: true, open: true }),
      React.createElement(Cascader.Panel, { options }),
      React.createElement(Cascader.Panel, { options, multiple: true }),
      React.createElement(Cascader.Panel, { options: [] }),
      React.createElement(Cascader, { options, open: true, disabled: true }),
      React.createElement(Cascader, { options, open: true, size: 'small' }),
      React.createElement(Cascader, { options, open: true, size: 'large' }),
      React.createElement(Cascader, { options, open: true, variant: 'filled' }),
      React.createElement(Cascader, { options, open: true, variant: 'borderless' }),
      React.createElement(Cascader, { options, open: true, status: 'error' }),
    ),
  ),
);
renderToStaticMarkup(el);
const css = extractStyle(cache);

console.log(css);
