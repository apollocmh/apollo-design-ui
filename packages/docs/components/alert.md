---
title: Alert 警告提示
outline: [2, 3]
---

<!-- ⚠️ 本文件由 scripts/gen-component-pages.mjs 生成，请勿手改；改 packages/ui/src/<c>/index.zh-CN.md -->

::: v-pre

警告提示，展现需要关注的信息。

## 何时使用

- 当某个页面需要向用户显示警告的信息时使用。
- 非浮层的静态告诫，用户可点击关闭。

:::

## 代码演示

::: v-pre

**action**：可以在右上角自定义操作项。

:::

<DemoPreview component="alert" demo="action" />

::: v-pre

**banner**：页面顶部通告形式，默认有图标且 `type` 为 'warning'。

:::

<DemoPreview component="alert" demo="banner" />

::: v-pre

**basic**：最简单的用法，适用于简短的警告提示。

:::

<DemoPreview component="alert" demo="basic" />

::: v-pre

**closable**：显示关闭按钮，点击可关闭警告提示。

:::

<DemoPreview component="alert" demo="closable" />

::: v-pre

**custom-icon**：可口的图标让信息类型更加醒目。

:::

<DemoPreview component="alert" demo="custom-icon" />

::: v-pre

**custom-title-alignment**：未设置 `description` 时，Alert 会让图标、内容、操作区和关闭按钮作为整体垂直居中。
若标题可能换行并希望元素与标题首行对齐，可以通过语义化 `styles` 自行调整。

:::

<DemoPreview component="alert" demo="custom-title-alignment" />

::: v-pre

**description**：共有四种样式 `success`、`info`、`warning`、`error`。

:::

<DemoPreview component="alert" demo="description" />

::: v-pre

**error-boundary**：友好的错误处理包裹组件（Vue 侧由 `onErrorCaptured` 实现）。

:::

<DemoPreview component="alert" demo="error-boundary" />

::: v-pre

**filled**：通过 `variant="filled"` 隐藏边框。

:::

<DemoPreview component="alert" demo="filled" />

::: v-pre

**icon**：可口的图标让信息类型更加醒目。

:::

<DemoPreview component="alert" demo="icon" />

::: v-pre

**loop-banner**：配合跑马灯实现消息轮播通知栏（antd 用 react-fast-marquee，这里用等价 CSS 动画）。

:::

<DemoPreview component="alert" demo="loop-banner" />

::: v-pre

**smooth-closed**：平滑、自然的卸载提示。

:::

<DemoPreview component="alert" demo="smooth-closed" />

::: v-pre

**style-class**：通过 `classNames` 和 `styles` 传入对象/函数可以自定义 Alert 的语义化结构样式。

:::

<DemoPreview component="alert" demo="style-class" />

::: v-pre

## API

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| type | 提示类型 | `'success' \| 'info' \| 'warning' \| 'error'` | `banner ? 'warning' : 'info'` |
| variant | 形态（6.4.0+） | `'outlined' \| 'filled'` | `'outlined'` |
| title | 标题（prop / `#title` 插槽，prop 优先） | `string` | — |
| message | **@deprecated** 请用 `title` | `string` | — |
| description | 辅助描述（prop / `#description` 插槽，prop 优先） | `string` | — |
| showIcon | 是否显示图标（banner 且未传 ⇒ true） | `boolean` | — |
| banner | 顶部通告形态 | `boolean` | `false` |
| closable | 可关闭（对象形态恒可关，可带 closeIcon/onClose/afterClose 与任意 aria-*/data-*） | `boolean \| AlertClosable` | ConfigProvider |
| closeIcon | **@deprecated** 请用 `closable.closeIcon`（`null/false` ⇒ 不可关） | `string \| boolean \| null` | — |
| closeText | **@deprecated** 请用 `closable.closeIcon` | `string` | — |
| onClose | **@deprecated** 请用 `closable.onClose` | `(e: MouseEvent) => void` | — |
| afterClose | **@deprecated** 请用 `closable.afterClose` | `() => void` | — |
| id / role | 根元素属性（role 默认 `'alert'`，可覆盖） | `string` | — |
| classNames / styles | 语义槽位（root / icon / section / title / description / actions / close），对象或函数 | — | — |
| onMouseenter / onMouseleave / onClick | 根元素事件 | `(e: MouseEvent) => void` | — |

### 插槽（Slots）

| 插槽 | 说明 |
|---|---|
| `#title` | 标题富内容（prop 优先）。 |
| `#description` | 辅助描述富内容（prop 优先）。 |
| `#icon` | 自定义图标，**覆盖**默认类型图标（原 `icon` prop，已移除）。 |
| `#action` | 操作区内容（原 `action` prop，已移除）。 |

### Alert.ErrorBoundary

错误边界包裹组件（Vue 由 `onErrorCaptured` 实现）：捕获后代渲染错误后渲染
`type="error"` 的 Alert（title 缺省用 `error.toString()`，描述缺省用组件栈 `<pre>`）。

## Ref

| 名称 | 类型 |
|---|---|
| nativeElement | `HTMLDivElement \| null` |

## Theme（Component Token）

| token | 说明 | 默认值 |
|---|---|---|
| borderRadius | 圆角 | `borderRadiusLG`（8） |
| withDescriptionIconSize | 带描述时图标字号 | `fontSizeHeading3`（30） |
| defaultPadding | 无描述内边距 | `8px 12px` |
| withDescriptionPadding | 带描述内边距 | `20px 24px` |

:::
