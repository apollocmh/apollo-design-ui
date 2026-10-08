---
title: Descriptions 描述列表
outline: [2, 3]
---

<!-- ⚠️ 本文件由 scripts/gen-component-pages.mjs 生成，请勿手改；改 packages/ui/src/<c>/index.zh-CN.md -->

::: v-pre

成组展示多个只读字段。

## 何时使用

- 常见于详情页的信息展示：一组 label/content 成对出现。
- 需要 bordered / vertical / 响应式列数等排版形态。

:::

## 代码演示

::: v-pre

**basic**：简单的展示：`items` 数据驱动，默认 3 列（行尾自动补齐 colSpan）。

:::

<DemoPreview component="descriptions" demo="basic" />

::: v-pre

**bordered**：`bordered` 展示边框与 label 背景；label/content 分格渲染（th/td），content 的 colSpan = `span*2-1`。

:::

<DemoPreview component="descriptions" demo="bordered" />

::: v-pre

**custom-item**：`Descriptions.Item`（children 形态，⚠️ antd 已 deprecated 但仍支持）：条目级 `styles` / `span`（数字 / `'filled'` 填满整行）。

:::

<DemoPreview component="descriptions" demo="custom-item" />

::: v-pre

**extra**：`title` / `extra` 渲染在 `-header` 块（仅二者之一存在时才渲染）；`:colon="false"` 去掉冒号（label 加 `-no-colon` 类）。

:::

<DemoPreview component="descriptions" demo="extra" />

::: v-pre

**size**：`size="small"` / `"medium"` / `"large"`（默认）。⚠️ `'default'` 已废弃并提示改用 `'large'`。

:::

<DemoPreview component="descriptions" demo="size" />

::: v-pre

**vertical**：`layout="vertical"`：label 行与 content 行分开渲染。

:::

<DemoPreview component="descriptions" demo="vertical" />

::: v-pre

## API

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| bordered | 边框形态（label/content 分格 th/td） | `boolean` | `false` |
| size | 尺寸；⚠️ `'default'` 已废弃（提示改 `'large'`） | `'large' \| 'medium' \| 'small' \| 'default' \| 'middle'` | `'large'` |
| column | 列数（数字或响应式映射；未激活断点落 DEFAULT_COLUMN_MAP） | `number \| Partial<Record<Breakpoint, number>>` | `{xs:1, sm:2, md~xxxl:3(4)}` |
| layout | 布局方向 | `'horizontal' \| 'vertical'` | `'horizontal'` |
| colon | label 冒号（CSS ::after） | `boolean` | `true` |
| title | 标题（文本；富标题走 `#title` slot，slot 优先） | `string` | — |
| extra | 额外内容（⚠️ 已改为 `#extra` slot，空 slot 等价隐藏） | `slot` | — |
| items | 条目数组（首选） | `DescriptionsItemType[]` | — |
| labelStyle / contentStyle | ⚠️ 已废弃：用 `styles.label` / `styles.content` | `CSSProperties` | — |
| classNames / styles | 语义槽 `{ root, header, title, extra, label, content }`（对象或函数式） | — | — |

### DescriptionsItemType

`{ key?, label?, children?, span?, className?, style?, labelStyle?, contentStyle?, styles?, classNames? }`。
`span`：数字（默认 1）/ `'filled'`（独占一行）/ 响应式映射。`label` 富内容走 `items` 程序化 API（其 `label` 仍接受 `VNodeChild`）。

### Slots（C8-R2）

| Slot | 说明 | 参数 |
|---|---|---|
| title | 富标题（文本 `title` prop 等价，slot 优先） | — |
| extra | 额外内容（空 slot 等价隐藏） | — |

### Ref

| 名称 | 类型 |
|---|---|
| nativeElement | `HTMLDivElement \| null` |

### 复合组件

`Descriptions.Item` / 具名 `DescriptionsItem`（children 形态，⚠️ antd 已 deprecated）。

## Theme（Component Token）

10 个，与 antd 的 `ComponentToken` 逐字段对齐（CSS 变量形态 `--apollo-descriptions-*`）：

`labelBg`(colorFillAlter) / `labelColor`(colorTextTertiary) / `titleColor`(colorText) /
`titleMarginBottom`(fontSizeSM×lineHeightSM) / `itemPaddingBottom`(padding) /
`itemPaddingEnd`(padding) / `colonMarginRight`(marginXS) / `colonMarginLeft`(marginXXS/2) /
`contentColor`(colorText) / `extraColor`(colorText)。

> 别名派生走 `var(--apollo-*)` 随主题自适应；`titleMarginBottom` 是构建期解析值。

## FAQ

**bordered 下 label 的 colSpan 是多少？**
label 恒为 1，content 为 `span*2-1`（每条占两列位：label 一列 + content 若干列）。
非 bordered / vertical 时 label 与 content 的 colSpan 相同（= span，行尾补齐会扩）。

**行尾补齐规则？**
行内 span 总和 < column 时，最后一个条目的 span 扩到 `column - (sum - lastSpan)`
（4 条 / 3 列 ⇒ 末条 colSpan=3）。`span:'filled'` 独占逻辑行并参与补齐。

:::
