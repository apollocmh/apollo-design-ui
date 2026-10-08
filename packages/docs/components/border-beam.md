---
title: BorderBeam 边框流光
outline: [2, 3]
---

<!-- ⚠️ 本文件由 scripts/gen-component-pages.mjs 生成，请勿手改；改 packages/ui/src/<c>/index.zh-CN.md -->

::: v-pre

沿容器边框流动的流光描边。

## 何时使用

- 需要强调某个容器/卡片处于「进行中」或「活跃」状态时。

:::

## 代码演示

::: v-pre

**basic**：包裹任意内容，展示沿边框流动的流光。

:::

<DemoPreview component="border-beam" demo="basic" />

::: v-pre

**count**：`count` 大于 1 时展示多条错相流动的流光。

:::

<DemoPreview component="border-beam" demo="count" />

::: v-pre

**custom-container**：流光跟随宿主的圆角与边框（`border-radius: inherit`）。

:::

<DemoPreview component="border-beam" demo="custom-container" />

::: v-pre

**customized-color**：`color` 传色标数组（0–100 会线性映射到 0–70% 保留尾部淡出）。

:::

<DemoPreview component="border-beam" demo="customized-color" />

::: v-pre

**duration**：`duration` 控制单圈时长（秒）。

:::

<DemoPreview component="border-beam" demo="duration" />

::: v-pre

**hover**：通过状态控制流光的显示与隐藏。

:::

<DemoPreview component="border-beam" demo="hover" />

::: v-pre

**line-width**：`lineWidth` 控制流光描边厚度（默认随宿主 border 宽度）。

:::

<DemoPreview component="border-beam" demo="line-width" />

::: v-pre

**size**：`size` 控制流光头部长度。

:::

<DemoPreview component="border-beam" demo="size" />

::: v-pre

## API

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| color | 渐变：纯色或色标数组（0–100 映射到 0–70% 保留尾部淡出） | `string \| {color, percent}[]` | 主题色 |
| count | 流光条数（≥1 取整） | `number` | `1` |
| duration | 单圈时长（秒） | `number` | `6` |
| lineWidth | 描边厚度（默认随宿主 border） | `number \| string` | — |
| outset | 覆盖四边统一 inset 偏移 | `number \| string` | — |
| size | 流光头部长度 | `number \| string` | `100px` |
| classNames.effect | 落在 **Effect 层**（每个流光一个 div）。**本仓自有 API** —— `BorderBeam` 是 renderless（没有自己的 DOM 根），「根类名」在 Vue 里无处可放，槽位给这个落点一个 Vue-native 的名字 | `{ effect?: string }` | — |
| styles.effect | 同槽位的内联样式（在 CSS 变量之后合并） | `{ effect?: CSSProperties }` | — |
| ~~className~~ / ~~style~~ | ⚠️ 透传到 **Effect 层**。**@deprecated**：用 `classNames.effect` / `styles.effect`（同一落点） | — | — |

## 设计说明

- 子元素即宿主：Effect 注入宿主 DOM 内部（`aria-hidden`，纯装饰）。
- 宿主的 `border-radius` 会被继承；`border` 宽度决定流光贴合的偏移。
- `prefers-reduced-motion: reduce` 下自动隐藏。

:::
