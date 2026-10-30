---
title: Pagination
subtitle: Pagination
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
| `itemRender` | 自定义每一项（替代 `itemRender` prop） | `{ page, type, element }` |
| `total` | 自定义总数展示（替代 `showTotal` prop） | `{ total, range }` |
| `sizeChanger` | 自定义尺寸切换器（替代 `sizeChangerRender` / antd 的 `components.sizeChanger`） | `{ value, onSizeChange, onChange, disabled, className, options, 'aria-label' }` |

### Keyboard

| Key | Behavior |
| --- | --- |
| Enter | 在页码 / 上一页 / 下一页 / 跳页项上触发 |
| Enter（快速跳转输入框） | 跳到输入页；↑ / ↓ 在简化模式下是 ∓1 |

`current` and `pageSize` are independently controlled. Defaults initialize uncontrolled state once. External updates emit no events; releasing control retains the last received value and discards rejected requests. An uncontrolled page stays clamped after total shrinks and grows; a controlled page follows its input. Size changes notify in this order: `update:pageSize`, `showSizeChange`, `update:current`, `change`. The `showSizeChange` page is the previous page.

Simple input shows the actual model after Enter or blur; empty input restores the current page. Moving focus to this instance's page controls, including custom slot buttons, lets that control handle navigation. Moving to another pagination still commits the quick jumper. `goButton` accepts Vue content including `0`; `true` uses the default button, while `false` / `null` / `undefined` hide confirmation content. Enter and arrow keys support `KeyboardEvent.key`; an Enter already cancelled by slot content is respected. Disabled controls and the zero-total placeholder leave the tab order and report `aria-disabled`. Disabled size callbacks, unchanged sizes and non-positive/non-integer size requests do not emit updates.

Select configuration in `showSizeChanger` accepts native `class` strings, arrays and objects. Replace the undeclared `showSizeChanger.className` spelling from older tests with `showSizeChanger.class`; there is no compatibility alias. `classNames.item` / `styles.item` still target pagination items. There are no public exposed methods; the Vue instance's `$el` references the current root `<ul>` (a comment when hidden).

> ⚠️ **尺寸切换器注入点有两个字段名**：rc 的 `sizeChangerRender` 实参叫 `onSizeChange`，
> antd 的 `components.sizeChanger` 叫 `onChange` —— 本仓**两个都给**（同一个函数），
> 照哪份文档写都能用（见 `COMPATIBILITY.md` 的 U14 上下文）。

## Design Token

| Token | Default (light) | Description |
| --- | --- | --- |
| `itemBg` / `itemActiveBg` / `itemLinkBg` / `itemInputBg` | `#ffffff` | Page / active page / regular previous-next button / simple input backgrounds |
| `itemSize` / `itemSizeSM` / `itemSizeLG` | `32px` / `24px` / `40px` | 页码尺寸（`controlHeight` 三档） |
| `itemActiveColor` / `itemActiveColorHover` | `#1677ff` / `#4096ff` | 激活态文字色 / hover |
| `itemActiveColorDisabled` | `rgba(0,0,0,0.25)` | 激活态禁用文字色 |
| `itemActiveBgDisabled` | `rgba(0,0,0,0.15)` | 激活态禁用背景 |
| `miniOptionsSizeChangerTop` | `0px` | mini 形态下切换器上边距 |

`ConfigProvider`'s `theme.components.Pagination` accepts these 12 component tokens. Dimensions accept CSS strings or numbers in pixels; `miniOptionsSizeChangerTop` also accepts negative offsets. Replacing or removing overrides derives fallbacks from the current global tokens. Native root `style` takes priority over semantic root styles, followed by theme variables. A custom `prefixCls` uses the corresponding component variable namespace and requires matching caller-provided styles.

Quick-jumper font, padding and focus variables derive from current global tokens and are not additional Pagination component override fields. The size Select owns its own tokens. With no active source theme, static CSS and ancestor CSS variables retain control. Theme updates write root variables; style rules remain static.

Content uses native #itemRender/#total/#sizeChanger slots. The three renderer props are removed directly without compatibility or deprecation layers. Item slots cover page/prev/next/jump-prev/jump-next. Empty slots suppress defaults; conditional addition/removal and reactive updates work after mount. PaginationItemSlotProps/PaginationTotalSlotProps/PaginationSlots export the contracts. Native root id/title/events and string/object/array styles are forwarded and merged with semantic root styles using Vue rules.
