---
category: 导航
title: Menu
subtitle: 导航菜单
---

为页面和功能提供导航的菜单列表。

## 何时使用

- 需要为网站提供全局性的导航菜单（顶部/侧边）。
- 支持水平/垂直/内嵌三种模式与亮暗双主题。

## 代码演示

见 [`demo/`](./demo)（13 个，与 antd 用户可见 demo 一一对应）。

## API

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
| inlineIndent | 缩进（px） | `number` | `24` |
| triggerSubMenuAction | 子菜单触发方式 | `'hover' \| 'click'` | `'hover'` |
| disabledOverflow | 关闭水平溢出折叠 | `boolean` | `false` |
| classNames / styles | 语义槽 `root/list/itemTitle/item/itemIcon/itemContent`（+popup/subMenu） | — | — |

### ItemType

```ts
{ key, label, icon?, danger?, disabled?, extra?, children?, type?: 'group' | 'divider' }
```

### Expose

`focus(options?)`、`list`、`findItem({key})`。

## 设计说明

- **rc-menu 内核自建**：items 解析 / key↔path 登记 / 键盘导航三件 engine，
  Overflow 溢出折叠为新基建（`_internal/overflow.ts`）。
- **差异**：D87–D90（COMPATIBILITY §9.2）；已知缺口见 [`README.md`](./README.md) §3。
