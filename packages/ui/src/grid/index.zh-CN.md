---
category: 布局
title: Grid
subtitle: 栅格
---

24 栅格系统。

## 何时使用

- 在多数业务情况下，需要在设计区域内解决大量信息收纳的问题 —— 基于 12 栅格将设计建议区域按 24 等分划分。
- 通过 `Row` 在水平方向建立一组 `Col`；只有 `Col` 可以作为 `Row` 的直接元素。

## 代码演示

见 [`demo/`](./demo)（13 个，与 antd 一一对应）。

| demo | 内容 |
|---|---|
| `basic` | 基础栅格（span 24/12/8/6） |
| `gutter` | 区块间隔 |
| `offset` | 左右偏移 |
| `sort` | 栅格排序（push/pull） |
| `flex` | 排版（justify 六种） |
| `flex-align` | 对齐（align 三种） |
| `flex-order` | 排序（order） |
| `flex-stretch` | Flex 填充 |
| `responsive` | 响应式布局 |
| `responsive-flex` | Flex 响应式布局 |
| `responsive-more` | 其他属性的响应式 |
| `playground` | 栅格配置器 |
| `useBreakpoint` | useBreakpoint Hook |

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
