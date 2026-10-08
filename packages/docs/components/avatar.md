---
title: Avatar 头像
outline: [2, 3]
---

<!-- ⚠️ 本文件由 scripts/gen-component-pages.mjs 生成，请勿手改；改 packages/ui/src/<c>/index.zh-CN.md -->

::: v-pre

用来代表用户或事物，支持图片、图标或字符。

## 何时使用

- 需要展示用户头像、账号头像时；
- 需要以图片、图标或字符代表某个实体时。

:::

## 代码演示

::: v-pre

**badge**：通常用于消息提示。

:::

<DemoPreview component="avatar" demo="badge" />

::: v-pre

**basic**：头像有三种尺寸，两种形状可选。

:::

<DemoPreview component="avatar" demo="basic" />

::: v-pre

**dynamic**：对于字符型的头像，当字符串较长时，字体大小可以根据头像宽度自动调整。也可使用 `gap` 来设置字符距离左右两侧边界单位像素。

:::

<DemoPreview component="avatar" demo="dynamic" />

::: v-pre

**fallback**：图片不存在时，如果 `src` 本身是个 ReactElement/VNode，会尝试回退到 `src`，否则尝试回退到 `icon`，最后回退到显示 `children`。

:::

<DemoPreview component="avatar" demo="fallback" />

::: v-pre

**group**：头像组合展现。`size` 与 `shape` 会经 context 透传给所有子头像。

:::

<DemoPreview component="avatar" demo="group" />

::: v-pre

**max-count**：使用 HOC 封装 `Avatar.Group`，添加 `overflowInFinal` 属性。开启后 `max.count` 表示总共显示的元素数量，会预留 1 个位置给溢出指示器。

:::

<DemoPreview component="avatar" demo="max-count" />

::: v-pre

**responsive**：头像大小可以根据屏幕大小自动调整。

:::

<DemoPreview component="avatar" demo="responsive" />

::: v-pre

**toggle-debug**：切换 Avatar 显示的时候，文本样式应该居中并正确调整字体大小。

:::

<DemoPreview component="avatar" demo="toggle-debug" />

::: v-pre

**type**：支持三种类型：**图标**、**字符**和**图片**。

:::

<DemoPreview component="avatar" demo="type" />

::: v-pre

## API

### Avatar

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| shape | 形状 | `'circle' \| 'square'` | 取 `Avatar.Group` 的 `shape`，再兜底 `'circle'` |
| size | 尺寸 | `SizeType \| 'default'(废弃) \| number \| ScreenSizeMap` | 取 `Avatar.Group` 的 `size` → `ConfigProvider.componentSize` → `'medium'` |
| gap | 字符左右留白（像素） | `number` | `4` |
| src | 图片来源。字符串 ⇒ `<img>`；VNode ⇒ 原样渲染 | `VNodeChild` | — |
| srcSet | `<img>` 的 `srcset` | `string` | — |
| draggable | `<img>` 的 `draggable` | `boolean \| 'true' \| 'false'` | — |
| icon | 图标 | `VNodeChild` | — |
| alt | `<img>` 的 `alt`。⚠️ **不传会没有 alt** ⇒ 读屏与 axe 都会报 | `string` | — |
| crossOrigin | `<img>` 的 `crossorigin` | `'' \| 'anonymous' \| 'use-credentials'` | — |
| onClick | 点击回调（**prop**，不是事件） | `(e?: MouseEvent) => void` | — |
| onError | 图片加载失败回调。⚠️ **返回 `false` 阻止内置回退**（判据 `!== false`） | `() => boolean` | — |
| prefixCls | 类名前缀 | `string` | 从 ConfigProvider 取 |
| class / style | **根元素原生 attrs**（不是 Props） | `string \| array \| object` / `CSSProperties` | — |

> ⚠️ **渲染优先级是五路互斥**：字符串 `src` → `src` 是 VNode → `icon` → 字符（带缩放）→ 字符（首帧 `opacity:0`）。

### Avatar.Group

| 参数 | 说明 | 类型 |
|---|---|---|
| max | 溢出配置 | `{ count?, style?, popover? }` |
| size | 透传给所有子头像（经 context） | `AvatarSize` |
| shape | 透传给所有子头像（经 context） | `'circle' \| 'square'` |
| maxCount / maxStyle / maxPopoverPlacement / maxPopoverTrigger | ⚠️ **都已废弃**，用 `max={{ … }}` | |

> ⚠️ `max.count` 为 `0`（或 `>=` 子元素数量）时**不截断**。
> ⚠️ 子头像自己的 `size` / `shape` **覆盖** Group 透传的值。

### 实例方法（ref）

两个组件都暴露 `{ nativeElement }`（`Avatar` 是 `HTMLSpanElement`、`Avatar.Group` 是 `HTMLDivElement`）。

## Theme

### Component Token（12 个）

| token | 说明 | 默认值 |
|---|---|---|
| `containerSize` / `containerSizeLG` / `containerSizeSM` | 头像尺寸（大/小） | `controlHeight` / `controlHeightLG` / `controlHeightSM` |
| `textFontSize` / `textFontSizeLG` / `textFontSizeSM` | 头像文字大小 | `fontSize` |
| `iconFontSize` / `iconFontSizeLG` / `iconFontSizeSM` | 头像图标大小 | `Math.round((fontSizeLG + fontSizeXL) / 2)` / `fontSizeHeading3` / `fontSize` |
| `groupSpace` | 头像组间距 | `marginXXS` |
| `groupOverlapping` | 头像组重叠宽度（**负**） | `-marginXS` |
| `groupBorderColor` | 头像组边框颜色 | `colorBorderBg` |

运行时调参用 CSS 变量：`--apollo-avatar-container-size` / `--apollo-avatar-group-overlapping` 等
（12 个，变量名与 antd 的 `--ant-avatar-*` 同构）。

:::
