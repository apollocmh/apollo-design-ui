---
title: Popconfirm 气泡确认框
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
| title | 标题（`0` 合法；可为惰性函数） | ReactNode / () => ReactNode | - |
| description | 描述文案（可为惰性函数） | ReactNode / () => ReactNode | - |
| disabled | 是否禁用（禁用后不展开，也不发 `onOpenChange`） | boolean | false |
| open | 是否展开（受控） | boolean | - |
| defaultOpen | 默认是否展开 | boolean | false |
| trigger | 触发行为 | string \| string[] | 'click' |
| placement | 浮层位置 | TooltipPlacement | 'top' |
| okText | 确认按钮文案；为空回退 locale | string | OK |
| okType | 确认按钮类型 | LegacyButtonType | 'primary' |
| cancelText | 取消按钮文案；为空回退 locale | string | Cancel |
| okButtonProps | 确认按钮属性 | ButtonProps | - |
| cancelButtonProps | 取消按钮属性 | ButtonProps | - |
| showCancel | 是否显示取消按钮 | boolean | true |
| icon | 自定义图标；`false` 时不显示 | VNode \| false | ExclamationCircleFilled |
| onOpenChange | 展开状态变化 | (open: boolean) => void | - |
| onConfirm | 点击确认 | (e?: MouseEvent) => void \| Promise | - |
| onCancel | 点击取消 | (e?: MouseEvent) => void | - |
| onPopupClick | 点击浮层内容 | (e: MouseEvent) => void | - |
| classNames | 语义化类名（root / container / arrow / icon / title / content） | 对象或函数 | - |
| styles | 语义化样式（同上） | 对象或函数 | - |

> 回调类（`onConfirm` / `onCancel` / `onOpenChange` / `onPopupClick`）作为 props 传入（`on-confirm` / `:onConfirm`），不经过 emits 声明。

### Ref

`Popconfirm` 与 `Popover` 同物：`forceAlign` / `nativeElement` / `popupElement`。

### 主题变量

| Token | 说明 | 默认值 |
| --- | --- | --- |
| zIndexPopup | 浮层 z-index | zIndexPopupBase + 60 |
