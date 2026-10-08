---
title: Popover 气泡卡片
outline: [2, 3]
---

<!-- ⚠️ 本文件由 scripts/gen-component-pages.mjs 生成，请勿手改；改 packages/ui/src/<c>/index.zh-CN.md -->

::: v-pre

点击/鼠标移入时弹出气泡卡片。

## 何时使用

- 需要对目标元素做进一步说明时，用带标题/正文的气泡卡片。
- 复用 Tooltip 的触发协议，内容更丰富（标题 + 正文）。

:::

## 代码演示

::: v-pre

**arrow-point-at-center**：设置 `arrow.pointAtCenter` 后，箭头将指向目标元素中心。

:::

<DemoPreview component="popover" demo="arrow-point-at-center" />

::: v-pre

**arrow**：箭头可以隐藏、指向中心。

:::

<DemoPreview component="popover" demo="arrow" />

::: v-pre

**basic**：最简单的用法，浮层的大小由内容区域决定。

:::

<DemoPreview component="popover" demo="basic" />

::: v-pre

**component-token**：ConfigProvider 的组件级 token 覆盖不支持（D25/D83）。

:::

<DemoPreview component="popover" demo="component-token" />

::: v-pre

**control**：受控关闭。

:::

<DemoPreview component="popover" demo="control" />

::: v-pre

**hover-with-click**：同一次操作同时绑定 hover 与 click 触发。

:::

<DemoPreview component="popover" demo="hover-with-click" />

::: v-pre

**placement**：位置有十二个方向。

:::

<DemoPreview component="popover" demo="placement" />

::: v-pre

**render-panel**：使用 PurePanel 渲染静态的气泡卡片。

:::

<DemoPreview component="popover" demo="render-panel" />

::: v-pre

**shift**：浮层随窗口滚动跟随目标元素。

:::

<DemoPreview component="popover" demo="shift" />

::: v-pre

**style-class**：使用 styles 定制容器与内容，支持对象与函数两种形态。

:::

<DemoPreview component="popover" demo="style-class" />

::: v-pre

**triggerType**：鼠标移入、聚集、点击。

:::

<DemoPreview component="popover" demo="triggerType" />

::: v-pre

**wireframe**：wireframe 主题态不支持（D84），以默认主题渲染。

:::

<DemoPreview component="popover" demo="wireframe" />

::: v-pre

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

:::
