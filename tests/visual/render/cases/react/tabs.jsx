/**
 * React 侧（antd 6.6.4）的 Tabs 视觉用例。与 vue/tabs.js 逐条对应。
 *
 * ⚠️ 覆盖的是**静态形态**。tabs 有两处「由 DOM 实测驱动」的东西，它们是**真浏览器下**的
 *    正常路径（视觉层跑的就是真 Chrome）：
 *      - `-ink-bar` 的 `left` / `width`（来自 `getBoundingClientRect` + rAF）；
 *      - 导航区**不溢出**时的 `-nav-operations-hidden`（宽度够时成立）。
 *    两侧的测量链一致 ⇒ 像素可比。**窄容器**不做（那会引入「溢出下拉是否打开」的时刻问题）。
 *
 * ⚠️ 两侧都**不传 `id`**：视觉层只比像素，`id` 的异步生成不影响渲染结果。
 */

import { Tabs } from 'antd';

const items = [
  { key: '1', label: 'Tab 1', children: 'Content of Tab Pane 1' },
  { key: '2', label: 'Tab 2', children: 'Content of Tab Pane 2' },
  { key: '3', label: 'Tab 3', children: 'Content of Tab Pane 3' },
];

const itemsWithDisabled = [
  { key: '1', label: 'Tab 1', children: 'Content of Tab Pane 1' },
  { key: '2', label: 'Tab 2', children: 'Content of Tab Pane 2', disabled: true },
  { key: '3', label: 'Tab 3', children: 'Content of Tab Pane 3' },
];

const box = (children) => (
  <div style={{ padding: 16, background: '#fff', width: 640 }}>{children}</div>
);

export default {
  basic: () => box(<Tabs defaultActiveKey="1" items={items} />),

  activeThird: () => box(<Tabs defaultActiveKey="3" items={items} />),

  card: () => box(<Tabs defaultActiveKey="1" type="card" items={items} />),

  editableCard: () =>
    box(<Tabs defaultActiveKey="1" type="editable-card" items={items} onEdit={() => {}} />),

  centeredCard: () => box(<Tabs defaultActiveKey="1" type="card" centered items={items} />),

  // ⚠️ 用 `start` 不用 `left`（同 vue 侧：`left` 在 antd 里走 `default:` 直通，LTR 侥幸等价）。
  vertical: () => box(<Tabs defaultActiveKey="1" tabPlacement="start" items={items} />),

  bottom: () => box(<Tabs defaultActiveKey="1" tabPlacement="bottom" items={items} />),

  small: () => box(<Tabs defaultActiveKey="1" size="small" items={items} />),

  large: () => box(<Tabs defaultActiveKey="1" size="large" items={items} />),

  gutter: () => box(<Tabs defaultActiveKey="1" tabBarGutter={36} items={items} />),

  disabledItem: () => box(<Tabs defaultActiveKey="1" items={itemsWithDisabled} />),

  extraContent: () =>
    box(
      <Tabs
        defaultActiveKey="1"
        items={items}
        tabBarExtraContent={<span style={{ color: '#1677ff' }}>extra</span>}
      />,
    ),

  indicatorStart: () =>
    box(<Tabs defaultActiveKey="1" indicator={{ align: 'start' }} items={items} />),
};
