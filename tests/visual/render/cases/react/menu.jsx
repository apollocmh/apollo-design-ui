/**
 * React 侧（antd 6.6.4）的 Menu 视觉用例。与 vue/menu.js 逐条对应。
 * 全部静态帧（open/selectedKeys 受控）；horizontal 依赖 ResizeObserver ——
 * 真实浏览器里 overflow 计算，视口宽度足够 ⇒ 全显示。
 */

import { Menu } from 'antd';

const box = (children) => <div style={{ minHeight: 280, padding: 16, width: 420 }}>{children}</div>;

const items = [
  { key: '1', label: 'One' },
  { key: '2', label: 'Two' },
  { type: 'divider', key: 'd1' },
  {
    key: 'sub1',
    label: 'Sub',
    children: [
      { key: '3', label: 'Three' },
      { key: '4', label: 'Four' },
    ],
  },
  { type: 'group', key: 'g1', label: 'Group', children: [{ key: '5', label: 'Five' }] },
];

const darkItems = [
  { key: '1', label: 'Option 1' },
  { key: 'sub1', label: 'Navigation One', children: [{ key: '3', label: 'Option 3' }] },
];

export default {
  vertical: () =>
    box(
      <Menu
        items={items}
        defaultOpenKeys={['sub1']}
        mode="vertical"
        selectedKeys={['1']}
        style={{ width: 256 }}
      />,
    ),

  inline: () =>
    box(
      <Menu
        items={items}
        defaultOpenKeys={['sub1']}
        mode="inline"
        selectedKeys={['1']}
        style={{ width: 256 }}
      />,
    ),

  dark: () =>
    box(
      <Menu
        items={darkItems}
        defaultOpenKeys={['sub1']}
        mode="inline"
        theme="dark"
        selectedKeys={['1']}
        style={{ width: 256 }}
      />,
    ),

  horizontal: () =>
    box(<Menu items={items} mode="horizontal" selectedKeys={['1']} style={{ width: 400 }} />),
};
