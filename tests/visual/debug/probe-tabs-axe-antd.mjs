/**
 * probe-tabs-axe-antd.mjs — 用 **antd 自己的 DOM** 跑 axe，判断某条 violation 是
 * 「本仓引入的」还是「上游同款」。
 *
 * 用法：`node tests/visual/debug/probe-tabs-axe-antd.mjs`
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { JSDOM } = require(require.resolve('jsdom', { paths: [process.cwd()] }));
const axe = require(require.resolve('axe-core', { paths: [process.cwd()] }));
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { ConfigProvider, Tabs } = require('antd');

const items = [
  { key: '1', label: 'Tab 1', children: 'Pane 1' },
  { key: '2', label: 'Tab 2', children: 'Pane 2' },
  { key: '3', label: 'Tab 3', children: 'Pane 3', disabled: true },
];

const html = renderToStaticMarkup(
  React.createElement(
    ConfigProvider,
    { prefixCls: 'apollo', iconPrefixCls: 'apollo-icon' },
    React.createElement(Tabs, { id: 'test', defaultActiveKey: '1', type: 'editable-card', items }),
  ),
);

const dom = new JSDOM(`<!doctype html><html><body>${html}</body></html>`);

axe
  .run(dom.window.document.body, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
  })
  .then((results) => {
    const list = results.violations.map((v) => ({
      id: v.id,
      html: v.nodes.map((n) => n.html.slice(0, 130)),
    }));
    console.log('ANTD_VIOLATIONS:', JSON.stringify(list, null, 2));
  })
  .catch((e) => {
    console.error('axe 失败（jsdom 环境可能不支持）:', e.message);
  });
