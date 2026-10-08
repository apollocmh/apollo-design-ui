---
title: Card 卡片
outline: [2, 3]
---

<!-- ⚠️ 本文件由 scripts/gen-component-pages.mjs 生成，请勿手改；改 packages/ui/src/<c>/index.zh-CN.md -->

::: v-pre

通用卡片容器。

## 何时使用

- 最基础的卡片容器，可承载文字、列表、图片、段落，常用于后台概览页面；
- 需要把一组相关信息聚合在一个容器里，并与周围内容区分开时。

:::

## 代码演示

::: v-pre

**basic**：包含标题、内容、操作区域。
`size` 支持 `medium`（默认）与 `small`。

:::

<DemoPreview component="card" demo="basic" />

::: v-pre

**border-less**：在灰色背景上使用无边框的卡片。
`variant="borderless"` 时不加 `-bordered` 类名，改用三级阴影（`boxShadowTertiary`）。

:::

<DemoPreview component="card" demo="border-less" />

::: v-pre

**flexible-content**：可以利用 `Card.Meta` 支持更灵活的内容。
⚠️ 封面用 **data URI** 而不是外网图片（与 `image` / `avatar` 的 demo 同判：外网图片会污染 L6 基线）。

:::

<DemoPreview component="card" demo="flexible-content" />

::: v-pre

**grid-card**：一种常见的卡片内容区隔模式。
`Card.Grid` 的 `hoverable` **默认 `true`**（与 `Card` 的默认 `false` 不同）；有 `Card.Grid`
子元素时根上会加 `-contain-grid`，body 变成 `flex-wrap` 容器。

:::

<DemoPreview component="card" demo="grid-card" />

::: v-pre

**in-column**：在系统概览页面常常和栅格进行配合。

:::

<DemoPreview component="card" demo="in-column" />

::: v-pre

**inner**：可以放在普通卡片内部，展示多层级结构的信息。
`type="inner"` 时根上加 `-type-inner`：head 背景变 `colorFillAlter`、字号降一档、
body 的上下 padding 变成 `padding`（左右仍是 `bodyPadding`）。

:::

<DemoPreview component="card" demo="inner" />

::: v-pre

**loading**：数据读入前会有文本块样式。
`loading` 时 body 里的内容被替换成 `Skeleton`（`active` + 4 行段落 + **无标题行**）。
⚠️ 两处 demo 级替换：`Avatar` **尚未落地** ⇒ 用原生等价物；上游的外网头像图换成同形状的色块
（外网图片会污染 L6 基线）。

:::

<DemoPreview component="card" demo="loading" />

::: v-pre

**meta**：一种支持封面、头像、标题和描述信息的卡片。
`Card.Meta` 的 `avatar` 在 `section` **外面**，`title` / `description` 在 **里面**。
⚠️ 两处 demo 级替换：封面用 **data URI**；`Avatar` **尚未落地** ⇒ 用原生等价物
（外网图片会污染 L6 基线）。

:::

<DemoPreview component="card" demo="meta" />

::: v-pre

**simple**：只包含内容区域。
没有 `title` / `extra` / `tabList` ⇒ **不渲染 head**（`isRenderable` 判据）。

:::

<DemoPreview component="card" demo="simple" />

::: v-pre

**tabs**：可承载更多内容。
`tabList` 的 `tab` 通道已废弃（用 `label`）；`activeTabKey` 与 `defaultActiveTabKey`
**二选一**（传了前者就用 `activeKey`，否则用 `defaultActiveKey`）。
⚠️ `onTabChange` 是**上游的 prop**（不是 emits），所以用 `:on-tab-change="..."`。

:::

<DemoPreview component="card" demo="tabs" />

::: v-pre

## API

### Card

| 参数 | 说明 | 类型 | 默认值 | 全局配置 |
|---|---|---|---|---|
| title | 卡片标题 | `VNodeChild` | — | × |
| extra | 右上角操作区 | `VNodeChild` | — | × |
| cover | 封面 | `VNodeChild` | — | × |
| actions | 操作区（每项包一层 `<li><span>`，宽度均分） | `VNodeChild[]` | — | × |
| loading | 加载中（内容替换成 `Skeleton`） | `boolean` | `false` | × |
| hoverable | 悬浮时显示阴影与手型光标 | `boolean` | `false` | × |
| size | 尺寸 | `'medium' \| 'small' \| 'middle' \| 'default'` | `medium` | ✅（`componentSize`） |
| type | 卡片类型（目前只有 `'inner'`） | `'inner'` | — | × |
| variant | 形态。`'borderless'` ⇒ 不加 `-bordered`、改用三级阴影 | `'outlined' \| 'borderless'` | `outlined` | ✅（`card.variant`） |
| tabList | 页签列表。⚠️ `tab` 已废弃，用 `label` | `CardTabListType[]` | — | × |
| activeTabKey | 受控的当前页签（**与 `defaultActiveTabKey` 二选一**） | `string` | — | × |
| defaultActiveTabKey | 非受控的初始页签 | `string` | — | × |
| tabBarExtraContent | 页签栏两侧的附加内容 | `VNodeChild \| { left, right }` | — | × |
| tabProps | 透传给内部 `Tabs` 的 props | `TabsProps` | — | × |
| onTabChange | 页签切换回调。⚠️ 这是 **prop**（不是事件） | `(key: string) => void` | — | × |
| classNames | 语义化类名（7 槽），支持函数形态 | `CardSemanticClassNames \| ((info) => …)` | — | ✅（`card.classNames`） |
| styles | 语义化样式（7 槽），支持函数形态 | `CardSemanticStyles \| ((info) => …)` | — | ✅（`card.styles`） |
| prefixCls | 类名前缀（**根前缀本身**，不是后缀） | `string` | 从 ConfigProvider 取，兜底 `apollo-card` | × |
| class / style | **根元素原生 attrs**（不是 Props） | `string \| array \| object` / `CSSProperties` | — | × |
| style | 根元素内联样式（**覆盖** `styles.root`） | `CSSProperties` | — | × |
| id | 根元素 id | `string` | — | × |
| bordered | ⚠️ **已废弃**，用 `variant` | `boolean` | — | × |
| headStyle | ⚠️ **已废弃**，用 `styles.header` | `CSSProperties` | — | × |
| bodyStyle | ⚠️ **已废弃**，用 `styles.body` | `CSSProperties` | — | × |

> ⚠️ 语义化槽**覆盖** deprecated 的 `headStyle` / `bodyStyle`（合并顺序是
> `{...headStyle, ...mergedStyles.header}`）。

### 事件

**没有组件事件。** `onTabChange` 是**上游的 prop**（没有 value/onChange 对 ⇒
`COMPATIBILITY.md` §3 的双发规则不适用）。⚠️ 本仓的 `Tabs` 用的是 `v-model:activeKey` +
`change` 事件，但 Card 沿上游保持 prop 形态。

### 插槽

| 名称 | 说明 |
|---|---|
| default | 卡片内容（antd 的 `children`） |

### Card.Meta

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| avatar | 头像 | `VNodeChild` | — |
| title | 标题 | `VNodeChild` | — |
| description | 描述 | `VNodeChild` | — |
| classNames | 语义化类名（`root` / `section` / `avatar` / `title` / `description`） | `CardMetaSemanticClassNames \| ((info) => …)` | — |
| styles | 语义化样式（同上五个槽） | `CardMetaSemanticStyles \| ((info) => …)` | — |
| prefixCls | 类名前缀（**card 的前缀**：传 `x` ⇒ `x-meta`） | `string` | 兜底 `apollo-card` |
| class / style | 根元素原生 attrs | `string` / `CSSProperties` | — |

> ⚠️ `avatar` 在 `section` **外面**，`title` / `description` 在 **里面**；
> 根上**没有** `-rtl`（`Card.Meta` 不读 `direction`）。

### Card.Grid

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| hoverable | 悬浮高亮。⚠️ **默认 `true`**（与 `Card` 的默认 `false` 不同） | `boolean` | `true` |
| prefixCls | 类名前缀（**card 的前缀**：传 `x` ⇒ `x-grid`） | `string` | 兜底 `apollo-card` |
| class / style | 根元素原生 attrs | `string` / `CSSProperties` | — |

### 实例方法（ref）

三个组件都暴露 `{ nativeElement }`（`HTMLDivElement | null`）。

> ⚠️ 上游 `Card` 是 `forwardRef<HTMLDivElement>`（ref 就是 DOM 元素本身），
> `Card.Grid` / `Card.Meta` 是 `{ nativeElement }`。本仓**统一成对象**（差异见 `README.md` §2 第 1 条）。

### 语义化 DOM

| 槽 | `Card` 的落点 | `Card.Meta` 的落点 |
|---|---|---|
| `root` | 根 `<div class="{prefixCls}">` | 根 `<div class="{prefixCls}-meta">` |
| `header` / `section` | `<div class="{prefixCls}-head">` | `<div class="{prefixCls}-meta-section">` |
| `body` / `avatar` | `<div class="{prefixCls}-body">` | `<div class="{prefixCls}-meta-avatar">` |
| `extra` / `title` | `<div class="{prefixCls}-extra">` | `<div class="{prefixCls}-meta-title">` |
| `title` / `description` | `<div class="{prefixCls}-head-title">` | `<div class="{prefixCls}-meta-description">` |
| `actions` | `<ul class="{prefixCls}-actions">` | — |
| `cover` | `<div class="{prefixCls}-cover">` | — |

## Theme

### Component Token（13 个）

| token | 说明 | 默认值 |
|---|---|---|
| `headerBg` | 卡片头部背景色 | `transparent` |
| `headerFontSize` | 卡片头部文字大小 | `fontSizeLG` |
| `headerFontSizeSM` | 小号卡片头部文字大小 | `fontSize` |
| `headerHeight` | 卡片头部高度 | `fontSizeLG * lineHeightLG + padding * 2` |
| `headerHeightSM` | 小号卡片头部高度 | `fontSize * lineHeight + paddingXS * 2` |
| `actionsBg` | 操作区背景色 | `colorBgContainer` |
| `actionsLiMargin` | 操作区每一项的外间距 | `${paddingSM}px 0` |
| `tabsMarginBottom` | 内置标签页组件下间距 | `-padding - lineWidth` |
| `extraColor` | 额外区文字颜色 | `colorText` |
| `bodyPaddingSM` | 小号卡片内边距 | `12` |
| `headerPaddingSM` | 小号卡片头部内边距 | `12` |
| `bodyPadding` | 卡片内边距 | `paddingLG` |
| `headerPadding` | 卡片头部内边距 | `paddingLG` |

> ⚠️ 上游的 `bodyPadding` / `headerPadding` 写的是 `token.bodyPadding ?? token.paddingLG`，
> 但那个键**不在** antd 6 的 `AliasToken` 里（v4 遗留）⇒ 实际恒取 `paddingLG`。
> 本仓直接写 `paddingLG`（见 `README.md` §2 第 2 条）。

运行时调参用 CSS 变量：`--apollo-card-header-height` / `--apollo-card-body-padding` /
`--apollo-card-actions-bg` 等（13 个，变量名与 antd 的 `--ant-card-*` 同构）。

:::
