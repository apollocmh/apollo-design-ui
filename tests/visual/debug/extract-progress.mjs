/** 临时脚本：React SSR + cssinjs extractStyle，dump antd Progress 的真实 CSS 产物。 */
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
const { ConfigProvider, Progress } = require('antd');

const cache = createCache();

const el = React.createElement(
  StyleProvider,
  { cache },
  React.createElement(
    ConfigProvider,
    { theme: { cssVar: true } },
    React.createElement(
      'div',
      null,
      React.createElement(Progress, { percent: 75 }),
      React.createElement(Progress, { percent: 75, type: 'circle' }),
      React.createElement(Progress, { percent: 75, type: 'dashboard' }),
      React.createElement(Progress, { percent: 60, steps: 5 }),
      React.createElement(Progress, { percent: 60, size: 'small' }),
      React.createElement(Progress, { percent: 40, status: 'active' }),
      React.createElement(Progress, { percent: 70, status: 'exception' }),
      React.createElement(Progress, { percent: 100 }),
      React.createElement(Progress, {
        percent: 60,
        strokeColor: { '0%': '#108ee9', '100%': '#87d068' },
      }),
      React.createElement(Progress, {
        percent: 60,
        strokeColor: { from: '#108ee9', to: '#87d068' },
      }),
      React.createElement(Progress, { percent: 60, success: { percent: 20 } }),
      React.createElement(Progress, { percent: 60, percentPosition: { align: 'center' } }),
      React.createElement(Progress, { percent: 60, percentPosition: { type: 'inner' } }),
      React.createElement(Progress, { type: 'circle', percent: 75, steps: 5 }),
      React.createElement(Progress, {
        type: 'circle',
        percent: 60,
        strokeColor: { '0%': '#108ee9', '100%': '#87d068' },
      }),
      React.createElement(Progress, { percent: 60, size: 14, type: 'circle' }),
      React.createElement(Progress, { percent: 60, strokeLinecap: 'butt' }),
      React.createElement(Progress, { percent: 60, railColor: '#eee' }),
      React.createElement(Progress, { percent: 60, type: 'circle', size: 14 }),
      React.createElement(Progress, { percent: 60, format: () => 'x' }),
    ),
  ),
);

const html = renderToStaticMarkup(el);
const style = extractStyle(cache, true);
process.stdout.write(style);
