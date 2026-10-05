---
title: Popconfirm
titleTemplate: '%s - @apollo-design/ui'
description: A simple and compact confirmation dialog of an action.
---

# Popconfirm

A simple and compact confirmation dialog of an action. Compared with `Popover`, it ships with built-in OK / Cancel buttons.

## When To Use

A simple and compact dialog used for asking confirmation of an action from the user.

## Examples

### Basic

<code src="./demo/basic.vue"></code>

### Locale text

<code src="./demo/locale.vue"></code>

### Custom icon

<code src="./demo/icon.vue"></code>

### Promise

<code src="./demo/promise.vue"></code>

### Async close

<code src="./demo/async.vue"></code>

### Placement

<code src="./demo/placement.vue"></code>

### Dynamic trigger

<code src="./demo/dynamic-trigger.vue"></code>

### Render panel

<code src="./demo/render-panel.vue"></code>

### Semantic classNames & styles

<code src="./demo/style-class.vue"></code>

### Shift

<code src="./demo/shift.vue"></code>

## API

### PopconfirmProps

| Property | Description | Type | Default |
| --- | --- | --- | --- |
| title | Title of the confirmation (`0` is renderable; lazy function allowed) | ReactNode / () => ReactNode | - |
| description | Description of the confirmation | ReactNode / () => ReactNode | - |
| disabled | Whether the popconfirm is disabled (never opens, never emits `onOpenChange`) | boolean | false |
| open | Whether the floating layer is open (controlled) | boolean | - |
| defaultOpen | Whether the floating layer is open by default | boolean | false |
| trigger | Trigger mode | string \| string[] | 'click' |
| placement | Position of the floating layer | TooltipPlacement | 'top' |
| okText | Text of the OK button; falls back to locale when empty | string | OK |
| okType | Type of the OK button | LegacyButtonType | 'primary' |
| cancelText | Text of the Cancel button; falls back to locale when empty | string | Cancel |
| okButtonProps | Props of the OK button; use Vue-native `class` for root styling | PopconfirmButtonProps | - |
| cancelButtonProps | Props of the Cancel button; use Vue-native `class` for root styling | PopconfirmButtonProps | - |
| showCancel | Whether to show the Cancel button | boolean | true |
| icon | Custom icon; `false` hides it | VNode \| false | ExclamationCircleFilled |
| onOpenChange | Called when the open state changes | (open: boolean) => void | - |
| onConfirm | Called when OK is clicked; a returned Promise delays closing | (e?: MouseEvent) => void \| Promise | - |
| onCancel | Called when Cancel is clicked | (e?: MouseEvent) => void | - |
| onPopupClick | Called when the popup content is clicked | (e: MouseEvent) => void | - |
| classNames | Semantic class names (root / container / arrow / icon / title / content) | object or function | - |
| styles | Semantic styles (same slots) | object or function | - |

### Theme Variables

| Token | Description | Default |
| --- | --- | --- |
| zIndexPopup | z-index of the popup | zIndexPopupBase + 60 |
