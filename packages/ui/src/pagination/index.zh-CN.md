---
category: 导航
title: Pagination
subtitle: 分页
titleTemplate: '%s - @apollo-design/ui'
description: 采用分页的形式分隔长列表，每次只加载一个页面。
---

# Pagination 分页

采用分页的形式分隔长列表，每次只加载一个页面。

## 何时使用

- 当加载/渲染所有数据将花费很多时间时；
- 当数据量太大、需要分屏展示时；
- 需要让用户快速在页之间跳转时。

## 引入

```ts
import { Pagination } from '@apollo-design/ui';
```

## 代码演示

### 基本

<code src="./demo/basic.vue"></code>

### 总数

<code src="./demo/total.vue"></code>

### 组合

<code src="./demo/all.vue"></code>

### 改变页码大小

<code src="./demo/changer.vue"></code>

### 受控

<code src="./demo/controlled.vue"></code>

### 简洁

<code src="./demo/simple.vue"></code>

### 跳转

<code src="./demo/jump.vue"></code>

### 小尺寸

<code src="./demo/mini.vue"></code>

### 更多

<code src="./demo/more.vue"></code>

### 对齐

<code src="./demo/align.vue"></code>

### 自定义页码

<code src="./demo/itemRender.vue"></code>

### 自定义切换器

<code src="./demo/components.vue"></code>

## API

### Pagination

| 参数 | 说明 | 类型 | 默认值 |
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

### 事件

| 事件 | 说明 | 参数 |
| --- | --- | --- |
| `update:current` | 当前页变化（`v-model:current`） | `(current: number)` |
| `update:pageSize` | 每页条数变化（`v-model:pageSize`） | `(pageSize: number)` |
| `change` | 页码或每页条数变化（与 `update:*` 同时发出） | `(current: number, pageSize: number)` |
| `showSizeChange` | 仅每页条数变化时（⚠️ `current` 是**变化前**的页） | `(current: number, size: number)` |

### 插槽

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `itemRender` | 自定义每一项（替代 `itemRender` prop） | `{ page, type, element }` |
| `total` | 自定义总数展示（替代 `showTotal` prop） | `{ total, range }` |
| `sizeChanger` | 自定义尺寸切换器（替代 `sizeChangerRender` / antd 的 `components.sizeChanger`） | `{ value, onSizeChange, onChange, disabled, className, options, 'aria-label' }` |

### 键盘

| 按键 | 行为 |
| --- | --- |
| Enter | 在页码 / 上一页 / 下一页 / 跳页项上触发 |
| Enter（快速跳转输入框） | 跳到输入页；↑ / ↓ 在简化模式下是 ∓1 |

`current` 与 `pageSize` 分别受控。`defaultCurrent` / `defaultPageSize` 只初始化非受控状态；外部赋值不发事件，移除控制后延续最后接收的值，不采纳被拒绝的更新请求。非受控当前页在总量收缩时保存钳制结果，随后总量回涨不会恢复旧页；受控当前页始终以传入值为准。尺寸切换仍按 `update:pageSize` → `showSizeChange` → `update:current` → `change` 的顺序通知，`showSizeChange` 的页码为切换前值。

简化输入在 Enter / 失焦后显示实际模型值，空输入恢复当前页。快速跳转失焦到本实例页码控件（含自定义槽中的按钮）时由该控件处理；移到其他分页实例仍正常提交。`goButton` 支持包含 `0` 的 Vue 内容，`true` 使用默认按钮，`false` / `null` / `undefined` 不显示确认内容。现代 `KeyboardEvent.key` 可用于 Enter 和方向键；槽内已取消的 Enter 不再由分页激活。禁用与零总量的占位项不参与 Tab 顺序并标记 `aria-disabled`，禁用时尺寸槽回调也不触发更新；尺寸必须为正整数且不同于当前值。

`showSizeChanger` 的 Select 配置使用原生 `class`，支持字符串、数组和对象；旧测试中的 `showSizeChanger.className` 写法改为 `showSizeChanger.class`，不保留该未声明别名。`classNames.item` / `styles.item` 继续控制分页项。没有公开 expose 方法，组件实例的 `$el` 指向当前根 `<ul>`（隐藏时为注释节点）。

> ⚠️ **尺寸切换器注入点有两个字段名**：rc 的 `sizeChangerRender` 实参叫 `onSizeChange`，
> antd 的 `components.sizeChanger` 叫 `onChange` —— 本仓**两个都给**（同一个函数），
> 照哪份文档写都能用（见 `COMPATIBILITY.md` 的 U14 上下文）。

## 设计 Token

| Token | 默认值（light） | 说明 |
| --- | --- | --- |
| `itemBg` / `itemActiveBg` / `itemLinkBg` / `itemInputBg` | `#ffffff` | 页码 / 激活 / 常规上一页下一页按钮 / 简化输入背景 |
| `itemSize` / `itemSizeSM` / `itemSizeLG` | `32px` / `24px` / `40px` | 页码尺寸（`controlHeight` 三档） |
| `itemActiveColor` / `itemActiveColorHover` | `#1677ff` / `#4096ff` | 激活态文字色 / hover |
| `itemActiveColorDisabled` | `rgba(0,0,0,0.25)` | 激活态禁用文字色 |
| `itemActiveBgDisabled` | `rgba(0,0,0,0.15)` | 激活态禁用背景 |
| `miniOptionsSizeChangerTop` | `0px` | mini 形态下切换器上边距 |

`ConfigProvider` 的 `theme.components.Pagination` 支持以上 12 个组件 Token；尺寸可用 CSS 字符串或数值（按 `px`），`miniOptionsSizeChangerTop` 可为负偏移。覆盖支持替换与移除，移除后从当前全局 Token 重新派生。根原生 `style` 优先于语义 root 样式，再优先于主题变量。自定义 `prefixCls` 对应同名前缀的组件变量，仍需调用方提供对应前缀样式。

快速跳转输入的字号、内边距、焦点等由当前全局 Token 派生，不是额外的 Pagination 组件覆盖字段；尺寸选择器本体使用 Select 的 Token。未启用源码主题时，组件保留静态 CSS 与祖先 CSS 变量的控制权。主题更新只写根 CSS 变量，样式规则保持静态。

原生 `#itemRender` / `#total` / `#sizeChanger` 是内容入口，三个渲染函数 prop 已直接移除，无兼容层或弃用期。页码槽覆盖 page/prev/next/jump-prev/jump-next；存在的空槽压住默认内容。插槽支持挂载后的条件出现、移除与响应式更新。`PaginationItemSlotProps` / `PaginationTotalSlotProps` / `PaginationSlots` 导出精确类型。根 id、title、原生事件及字符串/对象/数组 style 按 Vue 规则透传，与语义 root 样式合并。
