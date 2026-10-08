---
title: Progress 进度条
outline: [2, 3]
---

<!-- ⚠️ 本文件由 scripts/gen-component-pages.mjs 生成，请勿手改；改 packages/ui/src/<c>/index.zh-CN.md -->

::: v-pre

展示操作当前的进度。

## 何时使用

- 需要准确展示当前进度（上传、加载、步骤完成度等）。
- 支持线形 / 圆环 / 仪表盘三种形态，以及分段进度。

:::

## 代码演示

::: v-pre

**circle-micro**：微型圆环（≤20px，indicator 经 Tooltip 展示）。

:::

<DemoPreview component="progress" demo="circle-micro" />

::: v-pre

**circle-mini**：小号圆环进度条（`size` 数字）。

:::

<DemoPreview component="progress" demo="circle-mini" />

::: v-pre

**circle-steps**：圆环分段（circle-steps）。

:::

<DemoPreview component="progress" demo="circle-steps" />

::: v-pre

**circle**：圆环进度条（exception/success 形态）。

:::

<DemoPreview component="progress" demo="circle" />

::: v-pre

**dashboard**：仪表盘（`gapDegree` / `gapPlacement` 可调）。

:::

<DemoPreview component="progress" demo="dashboard" />

::: v-pre

**dynamic**：动态改变进度值。

:::

<DemoPreview component="progress" demo="dynamic" />

::: v-pre

**format**：`format` 自定义 indicator 内容。

:::

<DemoPreview component="progress" demo="format" />

::: v-pre

**gradient-line**：渐变色进度条（线性多键 / from-to / conic 圆环）。

:::

<DemoPreview component="progress" demo="gradient-line" />

::: v-pre

**info-position**：`percentPosition` 控制 indicator 位置（inner/outer × start/center/end）。

:::

<DemoPreview component="progress" demo="info-position" />

::: v-pre

**line-mini**：小号线形进度条。

:::

<DemoPreview component="progress" demo="line-mini" />

::: v-pre

**line**：普通的线形进度条（status 四态 + 隐藏 indicator）。

:::

<DemoPreview component="progress" demo="line" />

::: v-pre

**linecap**：`strokeLinecap="butt"` 方角。

:::

<DemoPreview component="progress" demo="linecap" />

::: v-pre

**segment**：`success` 分段（正确的部分显示为绿色）。

:::

<DemoPreview component="progress" demo="segment" />

::: v-pre

**semantic**：语义化 `classNames` / `styles`（函数式变体按 percent 派生色相）。

:::

<DemoPreview component="progress" demo="semantic" />

::: v-pre

**size**：`size` 全形态（预设 / 数字 / 数组）。

:::

<DemoPreview component="progress" demo="size" />

::: v-pre

**steps**：分段进度条（`steps` + `strokeColor` 数组）。

:::

<DemoPreview component="progress" demo="steps" />

::: v-pre

**style-class**：语义化 `classNames` / `styles`（对象式）。

:::

<DemoPreview component="progress" demo="style-class" />

::: v-pre

## API

### Props

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| type | 形态 | `'line' \| 'circle' \| 'dashboard'` | `'line'` |
| percent | 百分比 | `number` | `0` |
| format | 内容格式（fn prop） | `(percent?, successPercent?) => VNodeChild` | `${n}%` |
| status | 状态 | `'normal' \| 'exception' \| 'active' \| 'success'` | —（percent>=100 自动 success） |
| showInfo | 显示指示文本 | `boolean` | `true` |
| strokeColor | 进度色（支持渐变对象） | `string \| string[] \| ProgressGradient` | — |
| railColor | 轨道色 | `string` | — |
| trailColor | ⚠️ 已废弃（用 `railColor`） | `string` | — |
| strokeLinecap | 端点形状 | `'round' \| 'butt' \| 'square'` | `'round'` |
| strokeWidth | 描边宽（line ⇒ 轨道高；circle ⇒ 描边） | `number` | line 8 / circle max(6, 3/宽×100) |
| size | 尺寸（预设/数字/[w,h]/对象） | `ProgressSize \| number \| [number \| string, number] \| object` | `'medium'` |
| width | ⚠️ 已废弃（用 `size`） | `number` | — |
| success | 成功分段 | `{ percent?, strokeColor? }` | — |
| steps | 分段数 | `number \| { count, gap }` | — |
| gapDegree / gapPlacement | 仪表盘缺口（`gapPosition` 已废弃） | `number` / `'top' \| 'bottom' \| 'start' \| 'end'` | dashboard 75 / `'bottom'` |
| percentPosition | 指示文本位置 | `{ align?: 'start'\|'center'\|'end'; type?: 'inner'\|'outer' }` | `{ align: 'end', type: 'outer' }` |
| rounding | 分段取整函数 | `(step: number) => number` | `Math.round` |
| aria-label / aria-labelledby | 无障碍标签 | `string` | — |

> ⚠️ deprecated：`width` → `size`、`trailColor` → `railColor`、`gapPosition` → `gapPlacement`、
> `size="default"` → `size="medium"`（均带告警）。

### 语义面（classNames / styles）

`root` / `body` / `rail` / `track` / `indicator`（对象式与函数式 `({ props }) => …`）。

## 设计说明

- **SVG 圆环内核自研**（H5：不依赖 `@rc-component/progress`）：dasharray/dashoffset
  数学从 antd 实测 DOM 逐值反推（round 圆头修正、gap 旋转、steps 分段）。
- **渐变圆环**（plain object strokeColor）走 mask + foreignObject 的 conic 方案（PtgCircle 语义）。
- **≤20px 圆环**：indicator 经 Tooltip 展示（title 插槽）。
- **Token 6 个**：circleTextColor / defaultColor / remainingColor / lineBorderRadius /
  circleTextFontSize / circleIconFontSize。
- **线性渐变变量** `--progress-line-stroke-color` 无组件前缀（antd 产物逐字）。

:::
