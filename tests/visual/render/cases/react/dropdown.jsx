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

  /**
   * 🚨 **这条是那条 CSS 唯一的执行证据**：`dropdown/style` 里
   *    `.apollo-dropdown-trigger.apollo-btn > .apollo-icon-down { font-size: var(--apollo-font-size-icon) }`
   *    只在**用户自己往触发器里放下箭头图标**时生效 —— 原有 basicOpen / arrow 的触发器都只有文字，
   *    所以这条规则从没被 L6 覆盖过（也因此 2026-10-07 才发现它的前缀写成了 `.ant-btn`）。
   *
   *    ⚠️ 两侧都不引图标包（视觉层只链接 theme+ui，`@apollo-design/icons` 解析不到），
   *    用「两侧同构替身」：同一字形 `↓` 的 span + 各自图标类名 ⇒ 字号变化会落在像素上。
   */
  buttonIcon: () =>
    box(
      <Dropdown menu={menu} open placement="bottom" autoAdjustOverflow={false}>
        <Button>
          Trigger <span className="anticon anticon-down">↓</span>
        </Button>
      </Dropdown>,
    ),
};
