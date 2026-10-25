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

### Expose

`forceAlign()`、`nativeElement`、`popupElement`（`TooltipRef` 同形）。

## 设计说明

- **薄包装**：主体逻辑全部在 Tooltip / `_internal/trigger.ts`，本组件只做内容
  与语义槽扩展（[`docs/analysis/popover.md`](../../../../docs/analysis/popover.md)）。
- 与 antd 的已知差异见组件 README。
