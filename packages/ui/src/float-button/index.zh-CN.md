---
category: 其他
title: FloatButton
subtitle: 浮动按钮
---

悬浮在页面边缘的操作按钮。

## 何时使用

- 全局性常用操作（回到顶部、客服、反馈等）。
- 配合 `FloatButtonGroup` 聚合一组操作（menu 模式经 trigger 弹出）。

## 代码演示

见 [`demo/`](./demo)（12 个，与 antd 用户可见 demo 一一对应；`draggable` 为用户级
dnd 组合不对外、`render-panel` / `badge-debug` 为调试不对外）。

## API

### FloatButton Props

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| type | 类型 | `'default' \| 'primary'` | `'default'` |
| shape | 形状 | `'circle' \| 'square'` | `'circle'` |
| disabled | 禁用 | `boolean` | `false` |
| href / target / htmlType | 链接形态（href ⇒ `<a>`） | — | — |
| tooltip | 提示（string 或 TooltipProps 对象） | — | — |
| badge | 徽标（BadgeProps 减 status/text/title/children） | `object` | — |
| description | ⚠️ 已废弃（用 `#content` 插槽） | `string` | — |
| autoFocus / id / tabIndex 等 | 透传 Button | — | — |

### FloatButton Slots

| 插槽 | 说明 |
|---|---|
| #icon | 自定义图标（icon-only 时默认 FileTextOutlined） |
| #content | 文本内容（deprecated `description` 的对应物） |

### FloatButtonGroup Props

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| trigger | menu 模式（click / hover）；不传 = 纯列表 | `'click' \| 'hover'` | — |
| open / onOpenChange | 受控开合（`v-model:open`） | `boolean` / `fn` | — |
| placement | 菜单弹出方向 | `'top' \| 'left' \| 'right' \| 'bottom'` | `'top'` |
| shape / type / disabled 等 | 注入子按钮（context） | — | `'circle'` |

> Group 的 `#closeIcon` 插槽自定义触发按钮的关闭图标（默认 CloseOutlined）。

### FloatButton.BackTop Props

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| visibilityHeight | 滚动超过该高度才可见 | `number` | `400` |
| duration | 回顶时长 | `number` | `450` |
| showProgress | 进度环（v6.6.0） | `boolean` | `false` |
| target | 滚动容器 | `() => HTMLElement \| Window \| Document` | ownerDocument |

### Expose

`nativeElement`（FloatButton / Group / BackTop 均支持）。

## 设计说明

- **Button 的薄壳**（`prefixCls='float-btn'`，root 类与 Button 类共存）+ Group 列表
  （circle ⇒ Flex、square ⇒ Space.Compact）+ BackTop（滚动监听复用 back-top 基建）。
- **showProgress** 进度环经 CSS 变量 `--{prefix}-float-btn-progress`（`${x}turn`）
  喂 conic-gradient。
- **差异**：antd 的 icon-only 类在 Button 根不落（React 空子节点计数怪癖，D113
  UPSTREAM）；Group 的 trigger 系语义以 listContext 承担（Vue provide 时机限制）。
