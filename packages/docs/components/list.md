---
title: List 列表
outline: [2, 3]
---

<!-- ⚠️ 本文件由 scripts/gen-component-pages.mjs 生成，请勿手改；改 packages/ui/src/<c>/index.zh-CN.md -->

::: v-pre

通用列表。

> 🚨 **`List` 已被 antd 废弃**：`antd` 6.6.4 起建议改用 [`Listy`](./listy)（`List` 会在下一个大版本移除）。
> 本仓**照实现并保留同款 `console.error` 告警**（先例：`Dropdown.Button`），以便存量代码平滑迁移。

## 何时使用

- 需要展示一组同构数据（新闻列表、用户列表、搜索结果）时；
- 需要分页、栅格排布、竖向图文混排时。

:::

## 代码演示

::: v-pre

**basic**：基础列表。`List.Item.Meta` 承载头像 / 标题 / 描述三段。

:::

<DemoPreview component="list" demo="basic" />

::: v-pre

**grid**：`grid` 把列表排成栅格；`column` 控制列数，`gutter` 控制间距。

:::

<DemoPreview component="list" demo="grid" />

::: v-pre

**loadmore**：用 `loadMore` 放「加载更多」按钮 —— 它会取代底部分页的位置。

:::

<DemoPreview component="list" demo="loadmore" />

::: v-pre

**pagination**：`pagination` 的 `position` 可以是 `top` / `bottom` / `both`。

:::

<DemoPreview component="list" demo="pagination" />

::: v-pre

**responsive**：`grid` 的每个断点键（`xs` / `sm` / `md` / `lg` / `xl` / `xxl`）可以给不同的列数。

:::

<DemoPreview component="list" demo="responsive" />

::: v-pre

**simple**：三档尺寸（默认 / small / large），带页头、页脚与边框。

:::

<DemoPreview component="list" demo="simple" />

::: v-pre

**spin-debug**：`loading` 为 `true` 或 `{ spinning }`。⚠️ **有 `dataSource` 时渲染的是列表本身**，53px 占位块只在数据为空时可见。

:::

<DemoPreview component="list" demo="spin-debug" />

::: v-pre

**vertical**：`itemLayout="vertical"` + `extra` 的两段式布局，配合 `actions` 与分页。

:::

<DemoPreview component="list" demo="vertical" />

::: v-pre

## API

### List

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| bordered | 是否展示边框 | `boolean` | `false` |
| dataSource | 数据源 | `T[]` | — |
| extra | 列表最外层右侧的内容 | `VNodeChild` | — |
| grid | 栅格配置（`gutter` / `column` / `xs`…`xxxl`） | `ListGridType` | — |
| id | 根元素 id | `string` | — |
| itemLayout | 列表项布局 | `'horizontal' \| 'vertical'` | `'horizontal'` |
| loading | 加载中。⚠️ **有 `dataSource` 时渲染的是列表本身**（占位块只在数据为空时可见） | `boolean \| SpinProps` | `false` |
| loadMore | 加载更多的内容（**取代**底部分页的位置） | `VNodeChild` | — |
| pagination | 分页配置；`false` 不渲染 | `PaginationConfig \| false` | `false` |
| rowKey | 行 key（函数或字段名） | `((item: T) => string \| number) \| keyof T` | — |
| renderItem | 逐项渲染。⚠️ **未传时该项渲染为 `null`** | `(item: T, index: number) => VNodeChild` | — |
| size | 尺寸。`'large'` / `'small'` 落 `-lg` / `-sm`；`'default'` 不落类 | `'small' \| 'default' \| 'large'` | — |
| split | 列表项之间是否显示分割线 | `boolean` | `true` |
| header | 列表头部 | `VNodeChild` | — |
| footer | 列表底部 | `VNodeChild` | — |
| locale | 空态文案覆盖（**纯 prop**） | `{ emptyText: VNodeChild }` | — |
| prefixCls | 类名前缀 | | — |
| class / style | **根元素原生 attrs**（不是 Props） | | — |

### List.Item

| 参数 | 说明 | 类型 |
|---|---|---|
| actions | 操作区。每项一个 `<li>`，项间有分隔线。⚠️ **空数组不渲染** | `VNodeChild[]` |
| extra | 额外内容。`itemLayout="vertical"` 时它独占 `-item-extra` 一格 | `VNodeChild` |
| classNames | 语义化类名（`actions` / `extra`） | `{ actions?: string; extra?: string }` |
| styles | 语义化样式（同上） | `{ actions?: CSSProperties; extra?: CSSProperties }` |
| colStyle | grid 模式下 `Col` 的内联样式（由 `List` 传入） | `CSSProperties` |

### List.Item.Meta

| 参数 | 说明 | 类型 |
|---|---|---|
| avatar | 头像 | `VNodeChild` |
| title | 标题（渲染成 `<h4>`） | `VNodeChild` |
| description | 描述 | `VNodeChild` |

### 实例方法（ref）

三个组件都暴露 `{ nativeElement }`（`List` / `List.Item` / `List.Item.Meta` 都是 `HTMLDivElement`，可空）。

## Theme

### Component Token（11 个）

| token | 说明 | 默认值 |
|---|---|---|
| `contentWidth` | 内容宽度 | `220` |
| `itemPadding` / `itemPaddingSM` / `itemPaddingLG` | 列表项内间距（三档） | `${paddingContentVertical} 0` / `${paddingContentVerticalSM} ${paddingContentHorizontal}` / `${paddingContentVerticalLG} ${paddingContentHorizontalLG}` |
| `headerBg` / `footerBg` | 头部 / 底部背景色 | `transparent` |
| `emptyTextPadding` | 空文本内边距 | `padding` |
| `metaMarginBottom` | `Meta` 下间距 | `padding` |
| `avatarMarginRight` | 头像右间距 | `padding` |
| `titleMarginBottom` | 标题下间距 | `paddingSM` |
| `descriptionFontSize` | 描述文字大小 | `fontSize` |

运行时调参用 CSS 变量：`--apollo-list-item-padding` / `--apollo-list-content-width` 等
（11 个，变量名与 antd 的 `--ant-list-*` 同构）。

:::
