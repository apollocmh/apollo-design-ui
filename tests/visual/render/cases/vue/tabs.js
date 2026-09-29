/**
 * Vue 侧（@apollo-design/ui）的 Tabs 视觉用例。与 react/tabs.jsx 逐条对应。
 */

import { Tabs } from '@apollo-design/ui';
import { h } from 'vue';

// ⚠️ 本文件是 `.js`（rolldown 按**纯 JS** 解析）⇒ 不能写 TS 类型标注。
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

const box = (children) =>
  h('div', { style: { padding: '16px', background: '#fff', width: '640px' } }, children);

export default {
  basic: () => box(h(Tabs, { defaultActiveKey: '1', items })),

  activeThird: () => box(h(Tabs, { defaultActiveKey: '3', items })),

  card: () => box(h(Tabs, { defaultActiveKey: '1', type: 'card', items })),

  editableCard: () =>
    box(h(Tabs, { defaultActiveKey: '1', type: 'editable-card', items, onEdit: () => {} })),

  centeredCard: () => box(h(Tabs, { defaultActiveKey: '1', type: 'card', centered: true, items })),

  vertical: () => box(h(Tabs, { defaultActiveKey: '1', tabPlacement: 'left', items })),

  bottom: () => box(h(Tabs, { defaultActiveKey: '1', tabPlacement: 'bottom', items })),

  small: () => box(h(Tabs, { defaultActiveKey: '1', size: 'small', items })),

  large: () => box(h(Tabs, { defaultActiveKey: '1', size: 'large', items })),

  gutter: () => box(h(Tabs, { defaultActiveKey: '1', tabBarGutter: 36, items })),

  disabledItem: () => box(h(Tabs, { defaultActiveKey: '1', items: itemsWithDisabled })),

  extraContent: () =>
    box(
      h(Tabs, {
        defaultActiveKey: '1',
        items,
        tabBarExtraContent: h('span', { style: { color: '#1677ff' } }, 'extra'),
      }),
    ),

  indicatorStart: () =>
    box(h(Tabs, { defaultActiveKey: '1', indicator: { align: 'start' }, items })),
};
