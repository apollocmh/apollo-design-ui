/** 临时脚本：React SSR + cssinjs extractStyle，dump antd 6.6.4 Table 的真实 CSS 产物。 */
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
const { ConfigProvider, Table, Tag } = require('antd');

const cache = createCache();

const columns = [
  { title: 'Name', dataIndex: 'name', key: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
  {
    title: 'Age',
    dataIndex: 'age',
    key: 'age',
    filters: [
      { text: 'Young', value: 'young' },
      { text: 'Old', value: 'old' },
    ],
    onFilter: () => true,
    filterSearch: true,
  },
  { title: 'Address', dataIndex: 'address', key: 'address', ellipsis: true },
  {
    title: 'Action',
    key: 'action',
    fixed: 'right',
    width: 100,
    render: () => React.createElement(Tag, null, 'x'),
  },
];

const data = [
  { key: '1', name: 'John Brown', age: 32, address: 'New York No. 1 Lake Park' },
  { key: '2', name: 'Jim Green', age: 42, address: 'London No. 1 Lake Park' },
];

/** ⚠️ antd 的 `summary` 是**函数** `(data) => ReactNode`，不是元素。 */
const summary = () =>
  React.createElement(
    Table.Summary,
    { fixed: true },
    React.createElement(
      Table.Summary.Row,
      null,
      React.createElement(Table.Summary.Cell, { index: 0 }, 'Total'),
      React.createElement(Table.Summary.Cell, { index: 1 }, '2'),
      React.createElement(Table.Summary.Cell, { index: 2 }, '-'),
      React.createElement(Table.Summary.Cell, { index: 3 }, '-'),
    ),
  );

const expandable = {
  expandedRowRender: () => React.createElement('p', null, 'expanded'),
  expandedRowKeys: ['1'],
};

const rowSelection = { selectedRowKeys: ['1'] };

const el = React.createElement(
  StyleProvider,
  { cache },
  React.createElement(
    ConfigProvider,
    { theme: { cssVar: true } },
    React.createElement(
      'div',
      null,
      // 基础 + size + bordered + 空态
      React.createElement(Table, { columns, dataSource: data, pagination: false }),
      React.createElement(Table, { columns, dataSource: data, size: 'middle', pagination: false }),
      React.createElement(Table, { columns, dataSource: data, size: 'small', pagination: false }),
      React.createElement(Table, { columns, dataSource: data, bordered: true, pagination: false }),
      React.createElement(Table, { columns, dataSource: [], pagination: false }),
      // 选择 / 展开 / 汇总 / 分页
      React.createElement(Table, { columns, dataSource: data, rowSelection, pagination: false }),
      React.createElement(Table, { columns, dataSource: data, expandable, pagination: false }),
      React.createElement(Table, { columns, dataSource: data, summary, pagination: false }),
      React.createElement(Table, { columns, dataSource: data }),
      // 固定表头 / 固定列 / 粘性
      React.createElement(Table, {
        columns,
        dataSource: data,
        scroll: { x: 1200, y: 200 },
        pagination: false,
        sticky: true,
      }),
      // 虚拟
      React.createElement(Table, {
        columns,
        dataSource: data,
        virtual: true,
        scroll: { x: 1200, y: 200 },
        pagination: false,
      }),
      // 排序激活 / 过滤激活 / loading / 无表头 / 省略号
      React.createElement(Table, {
        columns: columns.map((c) => (c.key === 'name' ? { ...c, sortOrder: 'ascend' } : c)),
        dataSource: data,
        pagination: false,
        showSorterTooltip: false,
      }),
      React.createElement(Table, {
        columns: columns.map((c) => (c.key === 'age' ? { ...c, filteredValue: ['young'] } : c)),
        dataSource: data,
        pagination: false,
      }),
      React.createElement(Table, { columns, dataSource: data, loading: true, pagination: false }),
      React.createElement(Table, {
        columns,
        dataSource: data,
        showHeader: false,
        pagination: false,
      }),
      React.createElement(Table, {
        columns: columns.map((c) => ({ ...c, ellipsis: true })),
        dataSource: data,
        pagination: false,
      }),
      // RTL
      React.createElement(
        ConfigProvider,
        { direction: 'rtl' },
        React.createElement(Table, { columns, dataSource: data, pagination: false }),
      ),
    ),
  ),
);

renderToStaticMarkup(el);
const css = extractStyle(cache, { plain: true });

// 按括号配平拆块
const blocks = [];
let idx = 0;
while (idx < css.length) {
  const braceStart = css.indexOf('{', idx);
  if (braceStart < 0) break;
  let start = idx;
  for (let i = braceStart - 1; i >= idx; i--) {
    if (css[i] === '}' || css[i] === ';') {
      start = i + 1;
      break;
    }
  }
  let depth = 0;
  let end = braceStart;
  for (let i = braceStart; i < css.length; i++) {
    if (css[i] === '{') depth++;
    if (css[i] === '}') {
      depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  blocks.push(css.slice(start, end));
  idx = end;
}

const only = process.argv.includes('--tokens') ? 'tokens' : 'rules';
for (const block of blocks) {
  const isTokenBlock =
    /ant-table-css-var\s*\{/.test(block) || /css-var-[\w-]+\s*\.ant-table\b/.test(block);
  if (only === 'tokens') {
    if (isTokenBlock) console.log(block);
    continue;
  }
  if (block.includes('ant-table')) console.log(block);
}
