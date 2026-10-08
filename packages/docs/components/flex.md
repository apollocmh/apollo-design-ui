---
title: Flex 弹性布局
outline: [2, 3]
---

<!-- ⚠️ 本文件由 scripts/gen-component-pages.mjs 生成，请勿手改；改 packages/ui/src/<c>/index.zh-CN.md -->

::: v-pre

用于对齐的弹性布局容器。

## 何时使用

- 适合设置元素之间的间距。
- 适合设置各种水平、垂直对齐方式。

### 与 Space 组件的区别

- Space 为内联元素提供间距，其本身会为每一个子元素添加包裹元素用于内联对齐。适用于行、列中多个子元素的等距排列。
- Flex 为块级元素提供间距，其本身不会添加包裹元素。适用于垂直或水平方向上的子元素布局，并提供了更多的灵活性和控制能力。

:::

## 代码演示

::: v-pre

**align**：`justify` 控制主轴对齐、`align` 控制交叉轴对齐（Segmented 用原生 select 等价替换）。

:::

<DemoPreview component="flex" demo="align" />

::: v-pre

**basic**：通过 `vertical` 控制主轴方向（演示区同时可切换方向）。

:::

<DemoPreview component="flex" demo="basic" />

::: v-pre

**combination**：嵌套 `Flex` 完成复杂布局（Card / Typography 用原生元素等价替换）。

:::

<DemoPreview component="flex" demo="combination" />

::: v-pre

**debug**：垂直 / 水平两种形态的空隙基线（antd 标记为 `debug` 的调试 demo）。

:::

<DemoPreview component="flex" demo="debug" />

::: v-pre

**gap**：预设 `small` / `medium` / `large` 三档（走 token），或自定义数字间隙。

:::

<DemoPreview component="flex" demo="gap" />

::: v-pre

**wrap**：`wrap` 使元素多行显示（`flex-wrap: wrap`）。

:::

<DemoPreview component="flex" demo="wrap" />

::: v-pre

## API

> 自 antd@5.10.0 起提供。Flex 默认行为在水平模式下为向上对齐，在垂直模式下为拉伸对齐。

### Props

| 参数 | 说明 | 类型 | 默认值 | 全局配置 |
|---|---|---|---|---|
| vertical | flex 主轴的方向是否垂直（`flex-direction: column`） | `boolean` | `false` | ✅（`flex.vertical`） |
| orientation | 主轴的方向类型。优先级高于 `vertical` | `'horizontal' \| 'vertical'` | `'horizontal'` | × |
| wrap | 设置元素单行显示还是多行显示 | `flex-wrap \| boolean` | — | × |
| justify | 设置元素在主轴方向上的对齐方式 | `justify-content` | — | × |
| align | 设置元素在交叉轴方向上的对齐方式 | `align-items` | — | × |
| flex | flex CSS 简写属性（数字按 unitless 处理） | `flex` | — | × |
| gap | 设置网格之间的间隙。预设串走类名，其它值内联 | `'small' \| 'medium' \| 'large' \| string \| number` | — | × |
| component | 自定义元素类型 | `Component \| string` | `'div'` | × |
| prefixCls | 类名前缀 | `string` | 从 ConfigProvider 取，兜底 `apollo-flex` | × |

> **根节点原生属性**：根元素的 `class` / `style` 是 **Vue 原生 attrs**（不是 Props）——
> `<Flex class="..." :style="..." />`。合并优先级（低 → 高）：
> ConfigProvider `flex.style` → 调用方原生 `style` → 由 `flex` / `gap` prop 派生的内联样式。

### Ref

| 名称 | 类型 | 说明 |
|---|---|---|
| nativeElement | `HTMLElement \| null` | 根元素（对应 antd 的 forwardRef ref） |

### Slots

| 名称 | 说明 |
|---|---|
| default（默认） | 子元素。对应 antd 的 `children` |

## Theme

### Component Token

Flex **没有 Component Token**（与 antd 逐字一致：`prepareComponentToken = () => ({})`）。

gap 三档来自别名 token 派生（antd 的 `flexToken`，**用户不可通过 `theme.components.Flex` 覆盖**）：

| 派生 token | 来源 | CSS 落地 |
|---|---|---|
| flexGapSM | `paddingXS` | `var(--apollo-padding-xs)` |
| flexGap | `padding` | `var(--apollo-padding)` |
| flexGapLG | `paddingLG` | `var(--apollo-padding-lg)` |

## 设计说明

- `justify` / `wrap` / `align` 只产生类名，**不透传到 DOM**（与 antd 的 `omit` 语义一致）。
- `gap: 0` 会写内联 `style.gap`（`isNonNullable` 判据）—— 与 Space 的 `size: 0`（不产生任何间距节点）行为不同，这是上游的原始语义，逐字对齐。
- `flex` 是 unitless 属性：数字 `1` 输出 `'1'`（不是 `'1px'`）。
- antd 的 `resetStyle: false`：Flex 不吃 resetComponent 的字体样式（上游 issue 46403），我们同样不输出。

:::
