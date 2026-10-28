---
category: Navigation
title: Menu
subtitle: Menu
---

为页面和功能提供导航的菜单列表。

## When To Use

- Navigation menu for pages and features.

## API

Inline submenus expand and collapse with a height transition when activated by click or keyboard.
Closing keeps the list hidden after the transition; changing mode or enabling `inlineCollapsed`
removes the inline list after its leave transition. The initial menu mount does not animate.

### Props

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| items | 菜单内容（唯一真源） | `ItemType[]` | — |
| mode | 菜单类型 | `'horizontal' \| 'vertical' \| 'inline'` | `'vertical'` |
| theme | 主题 | `'light' \| 'dark'` | `'light'` |
| selectedKeys / defaultSelectedKeys | 受控/非受控选中（`v-model:selectedKeys`） | `string[]` | — |
| openKeys / defaultOpenKeys | 受控/非受控展开（`v-model:openKeys`） | `string[]` | — |
| onSelect / onDeselect / onClick | 选择事件（keyPath 为 **逆序**，antd 同款） | — | — |
| onOpenChange | 子菜单展开回调 | `(openKeys) => void` | — |
| selectable / multiple | 是否可选中 / 多选 | `boolean` | `true` / `false` |
| inlineCollapsed | 折叠为图标条（配合 Tooltip 显示标题） | `boolean` | — |
| tooltip | Tooltip config for collapsed items; `false` disables it | `false \| TooltipProps` | — |
| inlineIndent | 缩进（px） | `number` | `24` |
| triggerSubMenuAction | 子菜单触发方式 | `'hover' \| 'click'` | `'hover'` |
| disabledOverflow | 关闭水平溢出折叠 | `boolean` | `false` |
| classNames / styles | 语义槽 `root/list/itemTitle/item/itemIcon/itemContent`（+popup/subMenu） | — | — |

### ItemType

```ts
{ key, label, icon?, danger?, disabled?, extra?, children?, type?: 'group' | 'divider' }
```

### Slots（C8-R2）

Static sub-components `AMenuItem` / `AMenu.SubMenu` use slots for rich content (aligns with antd's VNode props):

| Component | Slot | Description | Former prop |
|---|---|---|---|
| AMenuItem / AMenu.SubMenu | `#title` | Rich title (text may still use `title` prop; slot wins) | `title` |
| AMenuItem | `#extra` | Right-aligned extra content (rich) | `extra` |

> `title` prop is narrowed to `string` (data carrier); `extra` prop is removed — rich content goes through `items[].extra` or the `#extra` slot.

### Expose

`focus(options?)`、`list`、`findItem({key})`。

## 设计说明

- **rc-menu 内核自建**：items 解析 / key↔path 登记 / 键盘导航三件 engine，
  Overflow 溢出折叠为新基建（`_internal/overflow.ts`）。
- 与 antd 的已知差异见组件 README。

## Keyboard and native actions

When the item itself has focus, Enter or Space activates its single native link or button. Plain items emit one action. Focused child controls retain browser activation without an extra keydown click. Disabled items block native navigation, and domEvent.preventDefault() can cancel link navigation. Editors retain their own keys. For multiple actions, focus the intended control directly; the item does not guess.
