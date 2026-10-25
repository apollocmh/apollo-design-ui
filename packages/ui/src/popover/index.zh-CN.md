---
category: 数据展示
title: Popover
subtitle: 气泡卡片
---

点击/鼠标移入时弹出气泡卡片。

## 何时使用

- 需要对目标元素做进一步说明时，用带标题/正文的气泡卡片。
- 复用 Tooltip 的触发协议，内容更丰富（标题 + 正文）。

## 代码演示

见 [`demo/`](./demo)（12 个，覆盖 antd 的主要用户场景；Segmented 未落地 ⇒
原生 select 替换，见各文件头）。

## API

### Props

继承 [Tooltip](../tooltip/index.zh-CN.md) 的全部 props，另有：

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| title | 标题数据（`0` 合法）；模板内容使用 `#title` | `TooltipContent`（VNodeChild） | — |
| content | 正文数据（`0` 合法）；模板内容使用 `#content` | `TooltipContent`（VNodeChild） | — |
| classNames / styles | 语义槽 `root / container / arrow / title / content`（含函数式） | — | — |

⚠️ 受控 `open` 时不做 noTitle 压制（antd 口径）：title/content 均空仍会开空浮层。

### 插槽

| 名称 | 说明 |
|---|---|
| default | 触发元素 |
| title / content | 标题 / 正文；存在则覆盖同名 prop，空槽不回退 |

导出 `PopoverSlots`。主组件与 `PopoverPurePanel` 均在当前 render 读取槽，支持条件出现、移除与内容更新。内容函数 prop 已直接移除，见 [迁移记录](../../../../docs/migrations/overlay-content-slots.md)。

### Expose

`forceAlign()`、`nativeElement`、`popupElement`（`TooltipRef` 同形）。

## 设计说明

- **薄包装**：主体逻辑全部在 Tooltip / `_internal/trigger.ts`，本组件只做内容
  与语义槽扩展（[`docs/analysis/popover.md`](../../../../docs/analysis/popover.md)）。
- 与 antd 的已知差异见组件 README。
