---
title: Grid 栅格
outline: [2, 3]
---

<!-- ⚠️ 本文件由 scripts/gen-component-pages.mjs 生成，请勿手改；改 packages/ui/src/<c>/index.zh-CN.md -->

::: v-pre

24 栅格系统。

## 何时使用

- 在多数业务情况下，需要在设计区域内解决大量信息收纳的问题 —— 基于 12 栅格将设计建议区域按 24 等分划分。
- 通过 `Row` 在水平方向建立一组 `Col`；只有 `Col` 可以作为 `Row` 的直接元素。

:::

## 代码演示

::: v-pre

**basic**：从堆叠到水平排列。使用单一的一组 `Row` 和 `Col` 栅格组件，就可以创建一个基本的栅格系统，所有列（Col）必须放在 `Row` 内。

:::

<DemoPreview component="grid" demo="basic" />

::: v-pre

**flex-align**：子元素垂直对齐方式：`align` 取 `top` / `middle` / `bottom`。

:::

<DemoPreview component="grid" demo="flex-align" />

::: v-pre

**flex-order**：通过 `order` 改变元素的排序。

:::

<DemoPreview component="grid" demo="flex-order" />

::: v-pre

**flex-stretch**：`Col` 配合 `flex` 样式实现内容填充。

:::

<DemoPreview component="grid" demo="flex-stretch" />

::: v-pre

**flex**：子元素水平对齐方式：`justify` 取 `start` / `center` / `end` / `space-between` / `space-around` / `space-evenly`。

:::

<DemoPreview component="grid" demo="flex" />

::: v-pre

**gutter**：栅格常常需要和间隔进行配合，你可以使用 `Row` 的 `gutter` 属性，我们推荐使用 `(16 + 8n)px` 作为栅格间隔。

:::

<DemoPreview component="grid" demo="gutter" />

::: v-pre

**offset**：使用 `offset` 可以将列向右侧偏移。

:::

<DemoPreview component="grid" demo="offset" />

::: v-pre

**playground**：栅格配置器（Slider 用原生 input 等价替换，缺口见 README §7）。

:::

<DemoPreview component="grid" demo="playground" />

::: v-pre

**responsive-flex**：`Col` 的 `flex` 与 `Row` 的 `gutter` 均支持响应式对象写法。

:::

<DemoPreview component="grid" demo="responsive-flex" />

::: v-pre

**responsive-more**：`span` / `offset` 等属性均支持响应式对象写法。

:::

<DemoPreview component="grid" demo="responsive-more" />

::: v-pre

**responsive**：`xs` … `xxxl` 预设六个响应式尺寸（参照 Bootstrap 的 ≤576 / ≥576 / ≥768 / ≥992 / ≥1200 / ≥1600 / ≥1920），也可传对象配置 span/offset 等。

:::

<DemoPreview component="grid" demo="responsive" />

::: v-pre

**sort**：列排序。使用 `push`（右移）和 `pull`（左移）改变列的顺序。

:::

<DemoPreview component="grid" demo="sort" />

::: v-pre

**useBreakpoint**：`useBreakpoint` 返回各断点的命中状态（基于 `window.matchMedia` 订阅）。

:::

<DemoPreview component="grid" demo="useBreakpoint" />

::: v-pre

## API

### Row

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| gutter | 栅格间隔（数字/字符串/响应式对象/`[水平, 纵向]` 数组） | `number \| string \| object \| array` | `0` |
| justify | 水平排列方式（支持响应式对象） | `'start' \| 'end' \| 'center' \| 'space-around' \| 'space-between' \| 'space-evenly'` | — |
| align | 垂直对齐方式（支持响应式对象） | `'top' \| 'middle' \| 'bottom' \| 'stretch'` | — |
| wrap | 是否自动换行 | `boolean` | `true` |
| prefixCls | 类名前缀 | `string` | 兜底 `apollo-row` |
| class / style | **根元素原生 attrs**（不是 Props）；调用方 `style` 覆盖 gutter 值 | — | — |

### Col

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| span | 栅格占位格数（0 相当于 `display: none`） | `number` | — |
| order / offset / push / pull | 排序与偏移 | `number` | — |
| flex | flex 布局属性（`'auto'`、数字 `n n auto`、长度串 `0 0 n`） | `string \| number` | — |
| xs … xxxl | 响应式栅格（≥576 / ≥768 / ≥992 / ≥1200 / ≥1600 / ≥1920；xs 为 <576） | `number \| object` | — |
| prefixCls | 类名前缀 | `string` | 兜底 `apollo-col` |
| class / style | 根元素原生 attrs；`style` 的合并位置在**响应式 sizeStyle 之前**（sizeStyle 仍最后胜出） | — | — |

### Hook

`useBreakpoint(refreshOnChange?, defaultScreens?)` —— 订阅断点，返回各断点命中状态。

## Theme

### Component Token

Row 与 Col 均**无 Component Token**（与 antd 逐字一致）。栅格常量 `gridColumns = 24` 非 token。

## 设计说明

- gutter 双半规则：Row `margin-inline: -g/2`、Col `padding-inline: +g/2`；纵向走 `row-gap`。
- 数字补 px（`0 → '0'`）、字符串走 `calc(x / ±2)`；Vue 侧数字必须手动补 px（PITFALLS 32）。
- 响应式 size 类**全量渲染**（xs…xxxl 同时在 DOM 上），由 CSS media query 裁决 —— SSR 天然一致。
- 响应式 flex 走 CSS 变量：内联 `--apollo-col-{size}-flex` + 规则 `flex: var(...)`。
- `flex === 0` 与 `wrap === false`（补 `min-width: 0`，Firefox hack）逐字对齐 antd。

:::
