---
title: Empty 空状态
outline: [2, 3]
---

<!-- ⚠️ 本文件由 scripts/gen-component-pages.mjs 生成，请勿手改；改 packages/ui/src/<c>/index.zh-CN.md -->

::: v-pre

空状态时的占位提示。

## 何时使用

- 数据为空时展示，替代一片空白。
- 也可以作为「还没有内容」的引导位，通过默认插槽放一个「新建」按钮。

:::

## 代码演示

::: v-pre

**basic**：最简单的用法：默认插画 + 默认描述（来自 locale，`en_US` 是 `No data`）。

:::

<DemoPreview component="empty" demo="basic" />

::: v-pre

**config-provider**：`ConfigProvider` 的 `empty` 配置可以统一提供 `image` / `className` / `style` / `classNames` / `styles`，
组件自身的 prop 优先级更高。
⚠️ 本仓库的 `ConfigProvider` **组件**尚未实现（走它自己的 G0→G14），当前只能直接
`provide(configContextKey, ...)` —— 这正是 ConfigProvider 未来会做的事。

:::

<DemoPreview component="empty" demo="config-provider" />

::: v-pre

**customize**：`image` 接受**字符串**（渲染成 `<img draggable="false">`）、**VNode** 或**组件**。
⚠️ 与 antd 的一处平台差异：antd 传的是「React 元素」（`<MyImage />` 的求值结果），
Vue 没有等价的元素概念，对应物是**组件本身**。

:::

<DemoPreview component="empty" demo="customize" />

::: v-pre

**description**：`description` 有**两条不同的判据**，这是本组件最容易写错的地方：
| 判据 | 作用 |
|---|---|
| `description !== undefined` | 决定**取值**：传了就用传入值（包括 `0` 与 `''`），没传才回退到 locale |
| `isRenderable(description)` | 决定**是否渲染**：`false` / `''` / `null` 不渲染描述块 |
所以 `description={''}` 会取到 `''`（不走 locale），但不渲染任何东西。

:::

<DemoPreview component="empty" demo="description" />

::: v-pre

**simple**：`PRESENTED_IMAGE_SIMPLE` 是模块级常量，传给 `image` 后根元素会多出 `-normal` 类名
（高度与间距随之变化）。判据是**引用相等**，不是「长得像不像」。

:::

<DemoPreview component="empty" demo="simple" />

::: v-pre

**style-class**：`classNames` / `styles` 各有四个槽位：`root` / `image` / `description` / `footer`。
两者都接受**对象**或**函数**（`(info: { props }) => 对象`），与 antd 完全对齐。
合并优先级（低 → 高）：ConfigProvider → 组件 prop。其中 `style` 会**覆盖** `styles.root`。

:::

<DemoPreview component="empty" demo="style-class" />

::: v-pre

## API

### Props

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| prefixCls | 类名前缀 | `string` | 从 ConfigProvider 取，兜底 `apollo` |
| class / style | **根元素原生 attrs**（不是 Props）；`style` 覆盖 `styles.root` | `string \| array \| object` / `CSSProperties` | — |
| style | 根元素内联样式。**会覆盖 `styles.root`** | `CSSProperties` | — |
| image | 自定义插画。字符串时渲染成 `<img draggable="false">` | `VNodeChild \| Component` | `PRESENTED_IMAGE_DEFAULT` |
| imageStyle | ⚠️ 已废弃，请用 `styles.image`。与 `styles.image` 合并，后者覆盖前者 | `CSSProperties` | — |
| description | 描述文案。`false` 表示不渲染描述块 | `VNodeChild` | locale 的 `Empty.description`（`en_US` 是 `No data`） |
| classNames | 语义化类名 | `EmptySemanticClassNames \| ((info: { props }) => EmptySemanticClassNames)` | — |
| styles | 语义化样式 | `EmptySemanticStyles \| ((info: { props }) => EmptySemanticStyles)` | — |

### 插槽

| 名称 | 说明 |
|---|---|
| default | 页脚内容。有内容时渲染 `<prefix>-footer` |

### 静态属性 / 具名导出

| 名称 | 说明 |
|---|---|
| `Empty.PRESENTED_IMAGE_DEFAULT` | 默认插画（184×152） |
| `Empty.PRESENTED_IMAGE_SIMPLE` | 简洁插画（64×41）。传入后根元素会多出 `<prefix>-normal` 类名 |

两者同时提供具名导出：`import { PRESENTED_IMAGE_SIMPLE } from '@apollo-design/ui'`。

> ⚠️ `-normal` 的判据是**引用相等**（`image === PRESENTED_IMAGE_SIMPLE`），
> 不是「宽高是不是 64×41」。传一个长得一样的自建组件不会触发。

### 语义化槽位

`classNames` / `styles` 各有四个槽位：`root` / `image` / `description` / `footer`。

合并优先级（低 → 高）：

```
ConfigProvider.empty.classNames/styles
  → 组件的 classNames / styles
  → 根节点原生 class / style attrs
```

其中 **`style` 会覆盖 `styles.root`**（antd 的合并顺序如此，我们逐条对齐）。

### 类型导出

`EmptyProps`、`EmptyRef`、`EmptyConfig`、`EmptySemanticType`、`EmptySemanticAllType`、
`EmptySemanticClassNames`、`EmptySemanticStyles`、`EmptySemanticValue`、`EmptyImage`。

### ref

| 名称 | 说明 |
|---|---|
| nativeElement | 根 `div`。首次渲染前为 `null` |

## 设计说明

### `description` 的两条判据

| 判据 | 作用 |
|---|---|
| `description !== undefined` | 决定**取值**：传了就用传入值（包括 `0` 与 `''`），没传才回退到 locale |
| `isRenderable(description)` | 决定**是否渲染**：`false` / `''` / `null` 不渲染描述块 |

所以 `:description="''"` 会取到 `''`（不走 locale），但不渲染任何东西。

### 插画与主题

插画里的颜色输出的是 `var(--apollo-*)`，所以深色/紧凑主题下会自动跟随，
不需要为插画做任何额外处理。

### 样式引入

```ts
import '@apollo-design/theme/dist/tokens.css'; // 主题变量，必须先引
import '@apollo-design/ui/empty/style.css';    // 按需
// 或
import '@apollo-design/ui/style.css';          // 汇总
```

自定义 `prefixCls`（如 `my-app`）时用 `genComponentCss('empty', 'my-app')` 自行产出 CSS ——
静态产物只覆盖 `apollo` 与 `ant` 两套前缀。

:::
