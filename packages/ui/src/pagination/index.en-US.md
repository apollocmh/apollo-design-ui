---
title: Pagination
titleTemplate: '%s - @apollo-design/ui'
description: A long list can be divided into several pages, and only one page will be loaded at a time.
---

# Pagination

A long list can be divided into several pages, and only one page will be loaded at a time.

## When To Use

- When it will take a long time to load/render all items.
- When the data set is too large to show at once.
- When users need to jump between pages quickly.

## Import

```ts
import { Pagination } from '@apollo-design/ui';
```

## Examples

### Basic

<code src="./demo/basic.vue"></code>

### Total

<code src="./demo/total.vue"></code>

### All

<code src="./demo/all.vue"></code>

### Changer

<code src="./demo/changer.vue"></code>

### Controlled

<code src="./demo/controlled.vue"></code>

### Simple

<code src="./demo/simple.vue"></code>

### Jump

<code src="./demo/jump.vue"></code>

### Mini

<code src="./demo/mini.vue"></code>

### More

<code src="./demo/more.vue"></code>

### Align

<code src="./demo/align.vue"></code>

### Custom item render

<code src="./demo/itemRender.vue"></code>

### Custom size changer

<code src="./demo/components.vue"></code>

## API

### Pagination

| Property | Description | Type | Default |
| --- | --- | --- | --- |
| current（`v-model:current`） | 当前页 | `number` | —— |
| defaultCurrent | 非受控初始页 | `number` | `1` |
| pageSize（`v-model:pageSize`） | 每页条数 | `number` | —— |
| defaultPageSize | 非受控初始每页条数 | `number` | `10` |
| total | 数据总数 | `number` | `0` |
| pageSizeOptions | 每页条数可选项（⚠️ 只收数字） | `number[]` | `[10, 20, 50, 100]` |
| totalBoundaryShowSizeChanger | 尺寸切换器的显示阈值 | `number` | `50` |
| showSizeChanger | 尺寸切换器：`true` / `false` / **Select 的 props 对象** | `boolean \| SelectProps` | `total > 50` |
| showQuickJumper | 快速跳转；`{ goButton }` 可自定义确认按钮 | `boolean \| { goButton?: VNodeChild }` | `false` |
| showPrevNextJumpers | 是否显示跳页项 | `boolean` | `true` |
| showLessItems | 每页显示更少的页码（buffer 2→1、跳页步长 5→3） | `boolean` | `false` |
| showTitle | 是否给 `li` 加 `title` | `boolean` | `true` |
| showTotal | 展示总数：`(total, range) => VNodeChild` | `function` | —— |
| itemRender | 自定义每一项：`(page, type, element) => VNodeChild` | `function` | —— |
| sizeChangerRender | 自定义尺寸切换器 | `(info) => VNodeChild` | —— |
| simple | 简化模式；`{ readOnly: true }` 时页码不可输入 | `boolean \| { readOnly?: boolean }` | `false` |
| hideOnSinglePage | 只有一页时隐藏 | `boolean` | `false` |
| disabled | 禁用 | `boolean` | `false` |
| size | 尺寸 | `'small' \| 'default' \| 'large'` | —— |
| responsive | `xs` 断点且未指定 `size` 时用 `small` | `boolean` | `false` |
| align | 整体对齐 | `'start' \| 'center' \| 'end'` | —— |
| locale | 覆盖语言包（与 ConfigProvider 的 `Pagination` 分片合并，**props 优先**） | `PaginationLocale` | —— |
| role | 根 `<ul>` 的 role | `string` | —— |
| classNames | 语义化类名：`root` / `item` | `PaginationSemanticClassNames` | —— |
| styles | 语义化样式：同上 2 槽 | `PaginationSemanticStyles` | —— |

### Events

| Event | Description | Arguments |
| --- | --- | --- |
| `update:current` | 当前页变化（`v-model:current`） | `(current: number)` |
| `update:pageSize` | 每页条数变化（`v-model:pageSize`） | `(pageSize: number)` |
| `change` | 页码或每页条数变化（与 `update:*` 同时发出） | `(current: number, pageSize: number)` |
| `showSizeChange` | 仅每页条数变化时（⚠️ `current` 是**变化前**的页） | `(current: number, size: number)` |

### Slots

| Slot | Description | Arguments |
| --- | --- | --- |
| `itemRender` | 自定义每一项（替代 `itemRender` prop） | `(page, type, element)` |
| `total` | 自定义总数展示（替代 `showTotal` prop） | `(total, range)` |
| `sizeChanger` | 自定义尺寸切换器（替代 `sizeChangerRender` / antd 的 `components.sizeChanger`） | `{ value, onSizeChange, onChange, disabled, className, options, 'aria-label' }` |

### Keyboard

| Key | Behavior |
| --- | --- |
| Enter | 在页码 / 上一页 / 下一页 / 跳页项上触发 |
| Enter（快速跳转输入框） | 跳到输入页；↑ / ↓ 在简化模式下是 ∓1 |

> ⚠️ **尺寸切换器注入点有两个字段名**：rc 的 `sizeChangerRender` 实参叫 `onSizeChange`，
> antd 的 `components.sizeChanger` 叫 `onChange` —— 本仓**两个都给**（同一个函数），
> 照哪份文档写都能用（见 `COMPATIBILITY.md` 的 U14 上下文）。

## Design Token

| Token | Default (light) | Description |
| --- | --- | --- |
| `itemBg` / `itemActiveBg` / `itemLinkBg` / `itemInputBg` | `#ffffff` | 页码 / 激活 / 链接 / 输入背景 |
| `itemSize` / `itemSizeSM` / `itemSizeLG` | `32px` / `24px` / `40px` | 页码尺寸（`controlHeight` 三档） |
| `itemActiveColor` / `itemActiveColorHover` | `#1677ff` / `#4096ff` | 激活态文字色 / hover |
| `itemActiveColorDisabled` | `rgba(0,0,0,0.25)` | 激活态禁用文字色 |
| `itemActiveBgDisabled` | `rgba(0,0,0,0.15)` | 激活态禁用背景 |
| `miniOptionsSizeChangerTop` | `0px` | mini 形态下切换器上边距 |

⚠️ 另有 **输入框族 19 个** token（`paddingBlock` / `paddingInline` / `activeShadow` …）与
**2 个派生** token（`itemSizeActual` / `itemSpacingActual`）—— 前者与 `Input` 同式（尺寸切换器的
Select 与快速跳转的 input 消费它们），后者的 `itemSizeActual` 是 **var 套 var**。

Switch themes through `ConfigProvider`'s `theme`; component styles are static CSS + CSS variables (zero runtime).
