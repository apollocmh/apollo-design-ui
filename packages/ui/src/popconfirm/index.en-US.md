---
title: Popconfirm
subtitle: Popconfirm
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
| title | Title data (`0` is valid); template content uses `#title` | VNodeChild | - |
| description | Description data; template content uses `#description` | VNodeChild | - |
| disabled | Disables trigger requests to open, without emitting `openChange` | boolean | false |
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
| icon | Icon data; `false` hides it. Template composition uses `#icon` | VNode \| string \| false | ExclamationCircleFilled |
| onConfirm | Called when OK is clicked; a returned Promise delays closing | (e?: MouseEvent) => void \| Promise | - |
| onCancel | Called when Cancel is clicked | (e?: MouseEvent) => void | - |
| classNames | Semantic class names (root / container / arrow / icon / title / content) | object or function | - |
| styles | Semantic styles (same slots) | object or function | - |

`onConfirm` / `onCancel` remain business callback props. A synchronous confirmation return requests closing. A returned Promise keeps the button loading until it settles: success requests closing; rejection keeps the panel open and reaches Vue error handling. After accepted hiding, the next opening starts a new confirmation session, and an older Promise cannot close the new panel. Callers clean up business requests and timers on cancellation and unmount. A refused controlled close keeps the current operation.

### Slots

| Name | Content |
| --- | --- |
| default | Trigger element (Popconfirm only) |
| title / description | Title / description, taking precedence over the matching prop |
| icon | Icon content, overriding icon data or the default; empty slots omit the wrapper |
| okText / cancelText | Button content, taking precedence over the string prop and locale |

`PopconfirmSlots` is exported. All five content slots also work in `PopconfirmPurePanel`. Present slots override all fallbacks, including empty content; removing a slot restores the prop, default icon or locale. Slots are read during render, and icon changes preserve the body nodes and input state. Render-function props are removed directly; async confirmation callbacks remain supported. See the [migration](../../../../docs/migrations/overlay-content-slots.md).

### Native class/style

Native class/style apply to the popup root. Style accepts strings, objects and mixed arrays, overriding matching semantic root styles. PopconfirmPurePanel routes root/container/arrow classNames/styles to its static panel and icon/title/content to the confirmation body; native style applies only to the panel root and does not override styles.container.

### Events

| Event | Description | Payload |
| --- | --- | --- |
| openChange | Requests a new open state; a controlled parent decides whether to accept it | `(open: boolean)` |
| update:open | Synchronization request for `v-model:open` | `(open: boolean)` |
| popupClick | Click on the confirmation body; also supported by PurePanel | `(event: MouseEvent)` |
| afterOpenChange | Opening or closing animation completed | `(open: boolean)` |

Templates use `@open-change` / `@popup-click` / `@after-open-change`, including `.once` and listener arrays. JSX / `h()` uses `onOpenChange` / `onPopupClick` / `onAfterOpenChange`. Replace old `:on-open-change` / `:on-popup-click` function props directly with events; there is no compatibility channel. The `onConfirm` / `onCancel` business callback props remain unchanged, including Promise returns from confirmation.

Native class/style apply only to the popup root; other native attributes and events target the trigger element. Removing controlled `open` preserves its last accepted value, without applying a request refused by the parent.

### Theme Variables

| Token | Description | Default |
| --- | --- | --- |
| zIndexPopup | z-index of the popup | zIndexPopupBase + 60 |

`theme.components.Popconfirm.zIndexPopup` and existing global visual tokens consume the current theme, including nested themes, replacement and removal; `0` is valid. Popconfirm and its static panel consume their own component configuration. Independent Popover / Tooltip instances in the content keep their own configuration. The wrapper shares a single z-index calculation, with explicit `zIndex` taking precedence.

[Native panel style migration](../../../../docs/migrations/overlay-native-styles.md).
