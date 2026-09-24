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
| title | 标题内容（`0` 合法；可为函数） | `TooltipContent` | — |
| content | 正文内容（`0` 合法；可为函数） | `TooltipContent` | — |
| classNames / styles | 语义槽 `root / container / arrow / title / content`（含函数式） | — | — |

⚠️ 受控 `open` 时不做 noTitle 压制（antd 口径）：title/content 均空仍会开空浮层。

### 插槽

| 名称 | 说明 |
|---|---|
| default | 触发元素 |
| title / content | 标题 / 正文（props 未传时生效） |

### Expose

`forceAlign()`、`nativeElement`、`popupElement`（`TooltipRef` 同形）。

## 设计说明

- **薄包装**：主体逻辑全部在 Tooltip / `_internal/trigger.ts`，本组件只做内容
  与语义槽扩展（[`docs/analysis/popover.md`](../../../../docs/analysis/popover.md)）。
- **差异**：D83–D86（COMPATIBILITY §9.2）；缺口见 [`README.md`](./README.md) §4。
