/** 临时：dump antd Transfer SSR HTML 的关键片段。 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { ConfigProvider, Transfer } = require('antd');

const DATA = Array.from({ length: 8 }, (_, i) => ({
  key: String(i),
  title: `content${i + 1}`,
  disabled: i === 3,
}));

const html = renderToStaticMarkup(
  React.createElement(
    ConfigProvider,
    { theme: { cssVar: true } },
    React.createElement(
      'div',
      null,
      React.createElement(Transfer, { dataSource: DATA, targetKeys: ['5', '1'] }),
      React.createElement(Transfer, { dataSource: DATA, showSearch: true }),
      React.createElement(Transfer, { dataSource: DATA, pagination: { pageSize: 3 } }),
    ),
  ),
);

const m = html.match(/ant-transfer-list-content-item-text[^>]*>([^<]*)</);
console.log('first item text node:', JSON.stringify(m ? m[1] : null));

const searchWrap = html.match(/ant-transfer-list-search[^>]*/g);
console.log('search class attrs:', JSON.stringify(searchWrap?.slice(0, 3)));

const pagIdx = html.indexOf('ant-transfer-list-pagination');
console.log('pag context:', JSON.stringify(html.slice(pagIdx - 120, pagIdx + 120)));
