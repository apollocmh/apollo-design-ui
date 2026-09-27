---
category: 导航
title: Dropdown
subtitle: 下拉菜单
---

向下弹出的列表。

## 何时使用

- 当页面上的操作命令过多时，用下拉菜单收纳。
- 触发元素任意（按钮/链接/文本），浮层是 Menu。

## 代码演示

见 [`demo/`](./demo)（19 个，与 antd 用户可见 demo 一一对应）。

## API

### Props

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| menu | 下拉内容（items 等全部 MenuProps） | `MenuProps` | — |
| trigger | 触发动作 | `('click' \| 'hover' \| 'contextMenu')[]` | `['hover']` |
| open / defaultOpen | 受控开合（`v-model:open`）/ 非受控初值 | `boolean` | `false` |
| onOpenChange | 开合回调（带 source: trigger/menu） | `(open, info) => void` | — |
| placement | 位置（14 个；Center 系 deprecated） | `DropdownPlacement` | `'bottomLeft'` |
| arrow | 箭头（`{ pointAtCenter }` 指中心） | `boolean \| object` | `false` |
| autoAdjustOverflow | 溢出自动调整 | `boolean` | `true` |
| disabled | 禁用（不响应触发） | `boolean` | `false` |
| destroyOnHidden | 关闭后卸载 portal | `boolean` | `false` |
| mouseEnterDelay / mouseLeaveDelay | 延迟（秒） | `number` | `0.15 / 0.1` |
| classNames / styles | 语义槽 `root/item/itemTitle/itemIcon/itemContent` | — | — |
| overlayClassName / overlayStyle / destroyPopupOnHide | ⚠️ 已废弃 | — | — |

> ⚠️ C8-R2：`popupRender(node)` / deprecated `dropdownRender` / `buttonsRender` / `icon` 已删除 ——
> 分别改用 `#popupRender="{ originNode }"`、`#buttonsRender="{ buttons }"`、`#icon` 插槽。

### DropdownButton

⚠️ antd 已 deprecated（Space.Compact + Dropdown + Button 替代），本仓保留同款告警。
`split` 拆分双钮；默认 placement `bottomRight`。

## 设计说明

- **Trigger 第 4 消费者**；stretch='minWidth'（浮层不窄于触发元素，D92）。
- **差异**：D91–D93（COMPATIBILITY §9.2）；缺口见 [`README.md`](./README.md) §4。
