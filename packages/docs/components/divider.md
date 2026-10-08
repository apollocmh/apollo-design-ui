---
title: Divider 分割线
outline: [2, 3]
---

<!-- ⚠️ 本文件由 scripts/gen-component-pages.mjs 生成，请勿手改；改 packages/ui/src/<c>/index.zh-CN.md -->

::: v-pre

区隔内容的分割线。

## 何时使用

- 对不同章节的文本段落进行分割。
- 对行内文字/链接进行分割，例如表格的操作列。

:::

## 代码演示

::: v-pre

**component-token**：Divider 有 3 个组件 Token（与 antd 同名同默认值，定义在 `style/token.ts`）：
| Component Token | 默认值 | 我们这边的落点 | 可运行时覆盖 |
| --- | --- | --- | --- |
| `verticalMarginInline` | `token.marginXS` | `var(--apollo-margin-xs)` | ✅ 覆盖变量 |
| `textPaddingInline` | `'1em'` | 常量内联 | ❌ 见下 |
| `orientationMargin` | `0.05` | 常量内联 | ❌ 见下 |
antd 的写法是 `<ConfigProvider theme={{ components: { Divider: { ... } } }}>`。本仓库是
**零运行时架构**（ADR 0001）：Token 的最终形态就是 CSS 变量，所以覆盖方式是**就地重声明变量**
（下面的 `--apollo-*`）。别名派生的那个 Token 因此可以覆盖。
⚠️ **登记缺口**：`textPaddingInline` / `orientationMargin` 是**字面量** Token，在零运行时管线里
被内联成常量，**没有**对应的 CSS 变量 —— 因为 `packages/theme` 的 `tokens.css` 只声明
**Alias** 层变量，不声明组件层变量（`getDesignToken()` 的返回类型是 `AliasToken`）。
所以这两个 Token 目前**不可运行时覆盖**，antd 的 `theme.components.Divider` 覆盖写法对它们无效。
这不是 Divider 独有的问题，而是**全库的管线缺口**：修复位置在 `packages/theme` 的
`tokens.css` 生成处（把每个组件的 `prepareComponentToken(...)` 结果也声明成变量），
属于 foundation 侧的工作，不在本组件的文件域内。详见 `README.md` §7。
等价的临时手段：用 `styles.content.padding` 覆盖 `textPaddingInline` 的效果、
用 `styles.content.margin` 覆盖 `orientationMargin` 的效果。

:::

<DemoPreview component="divider" demo="component-token" />

::: v-pre

**customize-style**：`style` 直接落在根元素上，且会**覆盖** `styles.root`（与 antd 的合并顺序一致）。
⚠️ 注意 `borderWidth: 2` 这类**数值**：Vue 运行时的 `setStyle` 不像 React 的
`dangerousStyleValue` 那样补单位，裸数字会被静默丢弃。请写 `'2px'` 或 `2` 之外的单位串。
（组件内部的 `orientationMargin` 已按这条规则处理，见 `README.md` §6。）

:::

<DemoPreview component="divider" demo="customize-style" />

::: v-pre

**horizontal**：默认是水平分割线。加 `dashed` 变成虚线。

:::

<DemoPreview component="divider" demo="horizontal" />

::: v-pre

**plain**：`plain` 让标题退回正文样式（`colorText` / `fontSize` / `font-weight: normal`），
而不是默认的标题样式（`colorTextHeading` / `fontSizeLG` / `500`）。

:::

<DemoPreview component="divider" demo="plain" />

::: v-pre

**size**：`size` 控制水平分割线的纵向间距（`margin-block`），**只对水平布局有效**。
`middle` 是 `medium` 的旧写法（antd 已废弃 `middle`），两者落到同一个类名。

:::

<DemoPreview component="divider" demo="size" />

::: v-pre

**style-class**：`classNames` / `styles` 各有三个槽位：`root` / `rail` / `content`。
两者都接受**对象**或**函数**（`(info: { props }) => 对象`），与 antd 完全对齐。
函数式拿到的 `info.props` 是**合并后**的 props —— `titlePlacement` 已折成 `start` / `end`、
`orientation` 已合并成 `horizontal` / `vertical`、`size` 已并入 ConfigProvider 的取值。
所以可以用它做条件分支。
⚠️ `rail` 槽位在**没有 children** 时落在**根元素**上（不是子元素）；有 children 时落在两个
rail 子元素上。这是上游行为，不是笔误。

:::

<DemoPreview component="divider" demo="style-class" />

::: v-pre

**variant**：`variant` 取 `solid`（默认）/ `dashed` / `dotted`。
⚠️ `dashed` 布尔 prop 是 `variant="dashed"` 的旧写法，两者**可以叠加**（不会输出重复类名）。

:::

<DemoPreview component="divider" demo="variant" />

::: v-pre

**vertical**：`orientation="vertical"` 与 `vertical` 等价，同时配置时以 `orientation` 优先。
⚠️ 垂直模式下**不能带标题**：`children` 会被忽略并输出告警（与 antd 一致）。

:::

<DemoPreview component="divider" demo="vertical" />

::: v-pre

**with-text**：`titlePlacement` 控制标题位置：`start` / `center`（默认）/ `end`。
标题与最近那条边框的距离由 `styles.content.margin` 控制 —— 这是替代已废弃的
`orientationMargin` 的写法（`orientationMargin` 仍可用，但会输出 deprecated 告警）。

:::

<DemoPreview component="divider" demo="with-text" />

::: v-pre

## API

### Props

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| prefixCls | 类名前缀 | `string` | 从 ConfigProvider 取，兜底 `apollo-divider` |
| orientation | 分割方向 | `'horizontal' \| 'vertical'` | `'horizontal'` |
| vertical | 是否垂直。与 `orientation` 同时配置时以 `orientation` 优先 | `boolean` | `false` |
| titlePlacement | 标题位置 | `'start' \| 'end' \| 'center'` | `'center'` |
| plain | 标题是否使用正文样式 | `boolean` | `false` |
| variant | 线型 | `'dashed' \| 'dotted' \| 'solid'` | `'solid'` |
| dashed | 是否虚线。等价于 `variant="dashed"`，但**两者可叠加** | `boolean` | `false` |
| size | 间距大小，**仅对水平布局有效** | `'small' \| 'medium' \| 'middle' \| 'large'` | — |
| classNames | 语义化类名 | `DividerSemanticClassNames \| ((info: { props }) => DividerSemanticClassNames)` | — |
| styles | 语义化样式 | `DividerSemanticStyles \| ((info: { props }) => DividerSemanticStyles)` | — |
| ~~type~~ | ⚠️ 已废弃，请用 `orientation` | `'horizontal' \| 'vertical'` | — |
| ~~orientationMargin~~ | ⚠️ 已废弃，请用 `styles.content.margin`。标题与最近边框的距离；不带单位的字符串数字按 px 处理 | `string \| number` | — |

### 根节点原生属性

根节点是单个 `<div role="separator">`。Vue 原生 `class`、`style` 及其它 `$attrs` 会透传到该节点；`class` 支持字符串、数组、对象，调用方 `style` 优先于 `styles.root`。它们不是 Divider 专属 Props，因此不声明 `className` / `rootClassName` / `style`。

```vue
<Divider class="my-divider" :style="{ borderColor: 'red' }" />
```

### 插槽

| 名称 | 说明 |
|---|---|
| default | 分割线中间的标题。⚠️ 垂直模式下**不渲染**（并输出开发期告警，与 antd 一致） |

### 语义化槽位

`classNames` / `styles` 各有三个槽位：`root` / `rail` / `content`。

合并优先级（低 → 高）：

```
ConfigProvider.divider.classNames/styles
  → 组件的 classNames / styles
  → 根节点原生 class / style attrs
```

其中调用处原生 **`:style` 会覆盖 `styles.root`**（保持合并优先级；该值走 Vue `$attrs`，不是 `DividerProps.style`）。

⚠️ `rail` 槽位在**没有默认插槽**时落在**根元素**上，有插槽时落在两个 rail 子元素上 ——
这是上游行为，不是笔误。

### 类型导出

`DividerProps`、`DividerRef`、`DividerConfig`、`DividerSize`、`DividerVariant`、
`Orientation`、`TitlePlacement`、`DividerSemanticType`、`DividerSemanticAllType`、
`DividerSemanticClassNames`、`DividerSemanticStyles`、`DividerSemanticValue`、
`DividerSlot`、`DividerComponentToken`。

### ref

| 名称 | 说明 |
|---|---|
| nativeElement | 根 `div`。首次渲染前为 `null` |

### 工具导出

| 名称 | 说明 |
|---|---|
| `genDividerStyle(prefixCls)` | 生成该前缀下的 CSS 文本（自定义 `prefixCls` 时自行产出样式用） |
| `prepareDividerComponentToken(token)` | 组件 Token 的默认值计算（与 antd 的 `prepareComponentToken` 逐字相同） |

## 设计说明

### 方向的优先级

`orientation` > `vertical` > `type`，三者都不传时兜底 `horizontal`。

⚠️ `vertical` 的判据是 `typeof vertical === 'boolean'`，**不是真值判断** ——
所以「不传」与「显式传 `false`」是两条不同的分支：显式传 `false` 会压过 `type`。

另外 `orientation` 在 v6 里**身兼两职**：取 `horizontal` / `vertical` 时是方向；
取 `left` / `right` / `center` / `start` / `end` 时被当作**旧版的标题位置**并输出告警。

### 标题位置

`titlePlacement` 优先；未传时若 `orientation` 是合法的位置值就用它，否则 `center`。
`left` / `right` 再按文字方向折算成 `start` / `end`（RTL 时互换）。

### `orientationMargin` 与单位

`orientationMargin` 接受数字或字符串：

| 输入 | 效果 |
|---|---|
| `20` | `20px` |
| `'10'` | `10px`（纯数字字符串按数字处理） |
| `'2em'` | `2em`（原样） |
| `0` | `0`（数值 0 **不**补单位，与 React 一致） |

仅在 `titlePlacement` 为 `start` / `end` 时生效。

### 组件 Token

| Token | 默认值 | 说明 |
|---|---|---|
| `verticalMarginInline` | `token.marginXS` | 纵向分割线的横向外间距 |
| `textPaddingInline` | `'1em'` | 文本横向内间距 |
| `orientationMargin` | `0.05` | 文本与边缘距离，取值 0 ～ 1 |

⚠️ **缺口**：antd 可以通过 `theme.components.Divider` 覆盖这三个 Token；本仓库目前
**只能覆盖 `verticalMarginInline`**（它派生自 Alias token，落成 `var(--apollo-margin-xs)`）。
另外两个是**字面量** Token，在零运行时管线里被内联成常量、没有对应的 CSS 变量 ——
因为 `packages/theme` 的 `tokens.css` 只声明 Alias 层变量。这是全库的管线缺口，
详见 [`README.md`](./README.md) §5.3 与 §9。

等价的临时手段：用 `styles.content.padding` 覆盖 `textPaddingInline` 的效果、
用 `styles.content.margin` 覆盖 `orientationMargin` 的效果。

### 样式引入

```ts
import '@apollo-design/theme/tokens.css';   // 主题变量，必须先引
import '@apollo-design/ui/divider/style.css'; // 按需
// 或
import '@apollo-design/ui/style.css';         // 汇总
```

自定义 `prefixCls`（如 `my-app`）时用 `genDividerStyle('my-app')` 自行产出 CSS ——
静态产物只覆盖 `apollo` 与 `ant` 两套前缀。

:::
