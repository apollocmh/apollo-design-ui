---
category: 反馈
title: Popconfirm
subtitle: 气泡确认框
titleTemplate: '%s - @apollo-design/ui'
description: 点击元素，弹出气泡式的确认框。
---

# Popconfirm 气泡确认框

目标元素的操作需要用户进一步的确认时使用。与 `Popover` 相比它内置了「确认 / 取消」两个按钮。

## 引入

```ts
import { Popconfirm } from '@apollo-design/ui';
```

## 代码演示

### 基本

<code src="./demo/basic.vue"></code>

### 定制按钮文案

<code src="./demo/locale.vue"></code>

### 自定义图标

<code src="./demo/icon.vue"></code>

### Promise 关闭

<code src="./demo/promise.vue"></code>

### 受控与异步

<code src="./demo/async.vue"></code>

### 位置

<code src="./demo/placement.vue"></code>

### 条件触发

<code src="./demo/dynamic-trigger.vue"></code>

### 自定义面板渲染

<code src="./demo/render-panel.vue"></code>

### 语义化结构

<code src="./demo/style-class.vue"></code>

### 大页面下的浮层

<code src="./demo/shift.vue"></code>

## API

### PopconfirmProps

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| title | 标题数据（`0` 合法）；模板内容使用 `#title` | VNodeChild | - |
| description | 描述数据；模板内容使用 `#description` | VNodeChild | - |
| disabled | 是否禁用（禁用后不通过触发器展开，也不发 `openChange`） | boolean | false |
| open | 是否展开（受控） | boolean | - |
| defaultOpen | 默认是否展开 | boolean | false |
| trigger | 触发行为 | string \| string[] | 'click' |
| placement | 浮层位置 | TooltipPlacement | 'top' |
| okText | 确认按钮文案；为空回退 locale。富内容走 `#okText` 插槽（优先） | string \| slot | OK |
| okType | 确认按钮类型 | LegacyButtonType | 'primary' |
| cancelText | 取消按钮文案；为空回退 locale。富内容走 `#cancelText` 插槽（优先） | string \| slot | Cancel |
| okButtonProps | 确认按钮属性；根类名使用 Vue 原生 `class` | PopconfirmButtonProps | - |
| cancelButtonProps | 取消按钮属性；根类名使用 Vue 原生 `class` | PopconfirmButtonProps | - |
| showCancel | 是否显示取消按钮 | boolean | true |
| icon | 图标数据；`false` 时不显示。模板组合使用 `#icon` | VNode \| string \| false | ExclamationCircleFilled |
| onConfirm | 点击确认 | (e?: MouseEvent) => void \| Promise | - |
| onCancel | 点击取消 | (e?: MouseEvent) => void | - |
| classNames | 语义化类名（root / container / arrow / icon / title / content） | 对象或函数 | - |
| styles | 语义化样式（同上） | 对象或函数 | - |

> `onConfirm` / `onCancel` 是业务回调 props，支持 `:on-confirm` / `:onConfirm` 等 Vue 绑定；确认回调的返回值用于等待 Promise。状态同步通过 `update:open` / `v-model:open`。

确认同步返回时请求关闭；返回 Promise 时，按钮进入 loading，成功后请求关闭，失败保持面板并通过 Vue 错误处理上报。实际接受关闭后，下次打开使用新的确认会话，旧 Promise 不会关闭新面板；业务请求和定时器仍由调用者在取消及卸载时清理。受控父级拒绝关闭时，当前操作继续。

### 插槽

| 名称 | 说明 |
| --- | --- |
| default | 触发元素（仅 Popconfirm） |
| title / description | 标题 / 描述，优先于同名 prop |
| icon | 图标内容，优先于 icon 数据或默认图标；空槽不渲染包裹 |
| okText / cancelText | 按钮内容，优先于字符串 prop 和 locale |

导出 `PopconfirmSlots`。五个内容槽也适用于 `PopconfirmPurePanel`；空槽不回退，移除槽才恢复 prop、默认图标或 locale。条件槽在当前 render 读取，图标切换保持正文节点与输入状态。内容函数 prop 已直接移除；异步确认等业务回调保留，见 [迁移记录](../../../../docs/migrations/overlay-content-slots.md)。

### 原生 class/style

原生 `class/style` 作用于浮层根，style 支持字符串、对象和混合数组，优先于语义根样式。PopconfirmPurePanel 转发 root/container/arrow 的 classNames/styles 给静态面板，icon/title/content 给确认正文；原生 style 只作用于面板根，不覆盖 styles.container。

### 事件

| 事件 | 说明 | 参数 |
| --- | --- | --- |
| openChange | 请求改变展开状态；受控时由父级决定是否接受 | `(open: boolean)` |
| update:open | `v-model:open` 同步请求 | `(open: boolean)` |
| popupClick | 确认正文被点击；静态面板同样支持 | `(event: MouseEvent)` |
| afterOpenChange | 开合动画完成 | `(open: boolean)` |

模板使用 `@open-change` / `@popup-click` / `@after-open-change`，支持 `.once` 和监听器数组；JSX / `h()` 使用 `onOpenChange` / `onPopupClick` / `onAfterOpenChange`。旧的 `:on-open-change` / `:on-popup-click` 函数 prop 直接改为事件，不保留兼容通道。`onConfirm` / `onCancel` 业务回调保持原契约。

原生 `class/style` 只作用于浮层根，其他原生 attrs 和事件传给触发元素。撤销受控 `open` 后保留最后接受的值，父级拒绝的更新请求不会成为本地状态。

### Ref

`Popconfirm` 与 `Popover` 同物：`forceAlign` / `nativeElement` / `popupElement`。

### 主题变量

| Token | 说明 | 默认值 |
| --- | --- | --- |
| zIndexPopup | 浮层 z-index | zIndexPopupBase + 60 |

`theme.components.Popconfirm.zIndexPopup` 与现有全局视觉 Token 读取当前主题，支持嵌套、替换和移除，`0` 是有效层级。Popconfirm 与静态面板只消费自己的组件配置；正文中的独立 Popover / Tooltip 仍消费各自配置。内部共享一次层级计算，显式 `zIndex` 优先。

[静态面板原生 style 迁移](../../../../docs/migrations/overlay-native-styles.md)。
