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

见 [`demo/`](./demo)（17 个，覆盖 antd 的主要用户场景）。

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
| size | 尺寸（预设/数字/[w,h]/对象） | `'medium' \| 'middle' \| 'small' \| 'default' \| number \| [number \| string, number] \| { width?: number; height?: number }` | `'medium'` |
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

`rail` 指向线形轨道或连续圆环的 SVG 轨道；分段项使用 `track`，没有独立的 rail 节点。
圆环的 rail 样式直接落在 SVG 元素上。函数式语义配置读取当前 `{ props }`。

线形 size 中的数值宽度按 px 输出，数值、数值 tuple 或对象可设置对应宽度和轨道高度；非正宽度自适应。
`showInfo` 显示的指示文本可以使 body 高于轨道，size 的高度约束轨道。
tuple 宽度也支持 CSS 长度，例如 `['65%', 12]`；线形分段的 tuple 宽度约束每一段。
circle/dashboard 支持数字和预设尺寸，显式 `size` 优先于现存已废弃的 `width`。
保留 `middle`，同时支持文档默认值 `medium`。

`steps.gap` 控制 circle/dashboard 分段间距；`rounding` 控制线形分段取整。
`strokeColor` 数组为线形分段逐项设色，其他形态读取第一个颜色。
渐变接受 `from`/`to` 或百分比站点，`direction` 控制线形渐变方向；圆环站点按百分比排序。

`percentPosition` 替换或移除时，指示内容的宿主、对齐和亮色类同步更新。
`format` 保留为领域数值格式化回调，接收归一化后的进度值和成功进度值，可以返回完整 Vue 内容。
组件没有公开插槽、自有事件、v-model 或 expose 方法。

纯线内嵌文本根据当前不透明单色轨道选择可读的黑/白前景，包含主题色和状态色；
显式 `styles.indicator.color` 仍优先。自定义渐变、透明色或覆盖 track 背景时由作者配对文本颜色。
此处直接修正开发阶段亮色轨道默认对比度不足，没有兼容开关和弃用期。

Vue 原生 `class`、字符串/对象/数组 `style`、DOM attrs 与监听器落在根 progressbar，
每次 DOM 事件只触发一次监听。样式优先级依次为主题变量、Provider `styles`、
Provider `style`、组件 `styles`、原生根 `style`，语义类名合并。
ConfigProvider 的 `components.progress` 消费 `className`、`style`、`classNames`、`styles`，
支持整体替换和移除，并读取当前前缀与方向。

现有六个组件 Token 从 `theme.components.Progress` 消费：`circleTextColor`、`defaultColor`、
`remainingColor`、`lineBorderRadius`、`circleTextFontSize`、`circleIconFontSize`。
`lineBorderRadius` 数字使用 px，其他值为 CSS 字符串。当前主题别名与嵌套覆盖在 SSR 和动态更新时生效。
圆环默认成功段使用当前主题成功色，显式 `success.strokeColor` 优先。

实际 progressbar 的 `aria-valuenow` 优先读取 success.percent，否则读取 percent；
保留有限小数，限制到 0–100，非有限输入按 0。内部无障碍值保持权威，
原生 attrs 的同名值不会覆盖它。可访问名称通过 aria-label / aria-labelledby 提供。
status 的既有整数推导与显式 normal 状态保持原规则。

## 设计说明

- **SVG 圆环内核自研**（H5：不依赖 `@rc-component/progress`）：dasharray/dashoffset
  数学从 antd 实测 DOM 逐值反推（round 圆头修正、gap 旋转、steps 分段）。
- **渐变圆环**（plain object strokeColor）走 mask + foreignObject 的 conic 方案（PtgCircle 语义）。
- **≤20px 圆环**：indicator 经 Tooltip 展示（title 插槽）。
- **Token 6 个**：circleTextColor / defaultColor / remainingColor / lineBorderRadius /
  circleTextFontSize / circleIconFontSize。
- **线性渐变变量** `--progress-line-stroke-color` 无组件前缀（antd 产物逐字）。
