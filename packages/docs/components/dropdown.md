---
title: Dropdown 下拉菜单
outline: [2, 3]
---

<!-- ⚠️ 本文件由 scripts/gen-component-pages.mjs 生成，请勿手改；改 packages/ui/src/<c>/index.zh-CN.md -->

::: v-pre

向下弹出的列表。

## 何时使用

- 当页面上的操作命令过多时，用下拉菜单收纳。
- 触发元素任意（按钮/链接/文本），浮层是 Menu。

:::

## 代码演示

::: v-pre

**arrow-center**：设置箭头指向目标元素中心。

:::

<DemoPreview component="dropdown" demo="arrow-center" />

::: v-pre

**arrow**：可以支持箭头。

:::

<DemoPreview component="dropdown" demo="arrow" />

::: v-pre

**basic**：鼠标移入，出现下拉菜单。

:::

<DemoPreview component="dropdown" demo="basic" />

::: v-pre

**context-menu**：默认是鼠标移入触发菜单，可以设置成鼠标右击触发。

:::

<DemoPreview component="dropdown" demo="context-menu" />

::: v-pre

**custom-dropdown**：使用 popupRender 对菜单进行扩展。

:::

<DemoPreview component="dropdown" demo="custom-dropdown" />

::: v-pre

**dropdown-button**：左边是按钮，右边是额外的相关功能菜单。

:::

<DemoPreview component="dropdown" demo="dropdown-button" />

::: v-pre

**event**：点击菜单项后会触发事件。

:::

<DemoPreview component="dropdown" demo="event" />

::: v-pre

**extra**：支持附加的节点展示（extra）。

:::

<DemoPreview component="dropdown" demo="extra" />

::: v-pre

**item**：默认是 hover 触发菜单，菜单项支持 disabled。

:::

<DemoPreview component="dropdown" demo="item" />

::: v-pre

**loading**：加载中的状态下展示下拉菜单。

:::

<DemoPreview component="dropdown" demo="loading" />

::: v-pre

**menu-full**：menu 属性的完整能力（danger/divider/disabled）。

:::

<DemoPreview component="dropdown" demo="menu-full" />

::: v-pre

**overlay-open**：受控 open 的展示。

:::

<DemoPreview component="dropdown" demo="overlay-open" />

::: v-pre

**placement**：按钮有六个 placement 选项。

:::

<DemoPreview component="dropdown" demo="placement" />

::: v-pre

**render-panel**：PurePanel 静态面板（Tooltip._InternalPanelDoNotUseOrYouWillBeFired 对应物）。

:::

<DemoPreview component="dropdown" demo="render-panel" />

::: v-pre

**selectable**：菜单项可选择。

:::

<DemoPreview component="dropdown" demo="selectable" />

::: v-pre

**selection**：多选的菜单项。

:::

<DemoPreview component="dropdown" demo="selection" />

::: v-pre

**style-class**：自定义 classNames/styles 语义槽。

:::

<DemoPreview component="dropdown" demo="style-class" />

::: v-pre

**sub-menu**：传入的菜单里有子菜单。

:::

<DemoPreview component="dropdown" demo="sub-menu" />

::: v-pre

**trigger**：支持点击、右键触发。

:::

<DemoPreview component="dropdown" demo="trigger" />

::: v-pre

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

:::
