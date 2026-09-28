---
category: 反馈
title: Progress
subtitle: 进度条
---

展示操作当前的进度。

## 何时使用

- 需要准确展示当前进度（上传、加载、步骤完成度等）。
- 支持线形 / 圆环 / 仪表盘三种形态，以及分段进度。

## 代码演示

见 [`demo/`](./demo)（17 个，与 antd 用户可见 demo 一一对应）。

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
