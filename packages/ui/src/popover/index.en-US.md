---
category: Data Display
title: Popover
subtitle: Popover
---

点击/鼠标移入时弹出气泡卡片。

## When To Use

- A bubble card with title and content for further explanation.

## API

### Props

继承 [Tooltip](../tooltip/index.zh-CN.md) 的全部 props，另有：

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| title | Title data (`0` is valid); template content uses `#title` | `TooltipContent` (VNodeChild) | — |
| content | Body data (`0` is valid); template content uses `#content` | `TooltipContent` (VNodeChild) | — |
| classNames / styles | 语义槽 `root / container / arrow / title / content`（含函数式） | — | — |

⚠️ 受控 `open` 时不做 noTitle 压制（antd 口径）：title/content 均空仍会开空浮层。

### 插槽

| 名称 | 说明 |
|---|---|
| default | 触发元素 |
| title / content | Title / body; a present slot overrides its prop, including empty content |

`PopoverSlots` is exported. Both Popover and PopoverPurePanel read current slots during render, including conditional additions, removals and content updates. Render-function props are removed directly; see the [migration](../../../../docs/migrations/overlay-content-slots.md).

### Native class/style

Popover applies native class/style to the popup root. Style accepts strings, objects and mixed arrays, overriding matching styles.root values until removed. Other native attrs and listeners keep Tooltip's trigger-element target. PopoverPurePanel applies attrs and native class/style to its own root, without duplicating styles on the container. Use styles.container/arrow and matching classNames for individual sections.

### Events

| Event | Payload | Meaning |
|---|---|---|
| update:open | `boolean` | `v-model:open`; the caller decides whether to accept a controlled proposal |
| open-change | `boolean` | Opening or closing proposal, sent with the model event |
| after-open-change | `boolean` | Actual opening or closing animation completion |
| popup-click | `MouseEvent` | Original click event from popup content |

Notifications use Vue emits, including `.once` and listener arrays. `h()` listeners use `onOpenChange`, `onAfterOpenChange` and `onPopupClick`; they are no longer called manually as function props. `PopoverEmits` is exported. The old `afterOpenChange` callback prop is removed.

### Expose

`forceAlign()`, `nativeElement: HTMLElement | null` and `popupElement: HTMLDivElement | null` are described by `PopoverRef`. The element fields are current DOM properties; `popupElement` becomes `null` after removal.

### Current configuration and theme

Popover and PopoverPurePanel consume the current `ConfigProvider.components.popover` classes, semantic styles and root styles. Tooltip's component configuration does not leak into them. PurePanel supports `title`, `content`, `color`, `placement`, `prefixCls`, `classNames` and `styles`, with the same content-slot contract.

`theme.components.Popover` supports these numeric tokens. Replacing, nesting or removing theme configuration updates the actual popup and static panel while preserving content inputs and focus. Native and semantic styles can still override the corresponding CSS variables.

| Token | Default | Meaning |
|---|---|---|
| titleMinWidth | `177` | Minimum title width in px |
| zIndexPopup | Global `zIndexPopupBase + 30` | Popup layer; explicit `zIndex` and parent layering still apply |
| innerPadding | `12` | Container padding in px |
| titleMarginBottom | `8` | Title bottom spacing in px |

Existing Tooltip aliases `overlayClassName`, `overlayStyle`, `overlayInnerStyle` and `destroyTooltipOnHide` follow their inherited contracts. Prefer `classNames.root`, `styles.root/container` and `destroyOnHidden`. Wireframe remains a recorded limitation.

## 设计说明

- Tooltip / `_internal/trigger.ts` owns popup lifecycle and positioning. Popover owns its content, events, Provider configuration and tokens ([historical analysis](../../../../docs/analysis/popover.md)).
- 与 antd 的已知差异见组件 README。

[Native panel style migration](../../../../docs/migrations/overlay-native-styles.md).
