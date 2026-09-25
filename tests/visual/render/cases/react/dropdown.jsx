/**
 * React 侧（antd 6.6.4）的 Dropdown 视觉用例。与 vue/dropdown.js 逐条对应。
 * ⚠️ open 受控静态帧 + placement="bottom" + autoAdjustOverflow=false 钉死落点
 *    （tooltip 期结论：翻转几何由 position 包 oracle 承担）。
 */

import { Button, Dropdown } from 'antd';

const box = (children) => <div style={{ minHeight: 280, padding: 16, width: 420 }}>{children}</div>;

const menu = {
  items: [
    { key: '1', label: 'One' },
    { key: '2', label: 'Two', danger: true },
    { key: '3', label: 'Three', disabled: true },
  ],
};

export default {
  basicOpen: () =>
    box(
      <Dropdown menu={menu} open placement="bottom" autoAdjustOverflow={false}>
        <Button>Hover me</Button>
      </Dropdown>,
    ),

  arrow: () =>
    box(
      <Dropdown menu={menu} open placement="bottom" autoAdjustOverflow={false} arrow>
        <Button>Arrow</Button>
      </Dropdown>,
    ),
};
