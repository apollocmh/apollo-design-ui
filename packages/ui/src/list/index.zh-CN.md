---
category: 数据展示
title: List
subtitle: 列表
---

通用列表。

List 按 Apollo 的独立契约维护；逐项内容使用带类型的 Vue `#item` 插槽。

## 何时使用

- 需要展示一组同构数据（新闻列表、用户列表、搜索结果）时；
- 需要分页、栅格排布、竖向图文混排时。

## 代码演示

见 [`demo/`](./demo)（**12 个**，覆盖 antd 的主要用户场景）。

| demo | 内容 |
|---|---|
| `basic` | 基础列表（`Item.Meta` 的头像 / 标题 / 描述三段） |
| `simple` | 三档尺寸 + 页头 / 页脚 / 边框 |
| `vertical` | `itemLayout="vertical"` 的两段式 + `actions` + 分页 |
| `grid` | `grid.column` 的栅格排布 |
| `responsive` | `grid` 的断点列数 |
| `loadmore` | `loadMore` 取代底部分页 |
| `pagination` | `position: 'both'` 的上下双分页 |
| `spin-debug` | `loading` 的两种形态 |

其他示例还包括 `component-token`、`pagination-simple`、`empty`、`item-extra`。
虚拟列表能力见 `Listy`；拖拽排序示例仍在能力清单中待审查。

## API

### List

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| bordered | 是否展示边框 | `boolean` | `false` |
| dataSource | 数据源 | `T[]` | — |
| extra | 列表右侧内容；窄屏移到下方，支持同名插槽 | `VNodeChild` | — |
| grid | 栅格配置（`gutter` / `column` / `xs`…`xxxl`） | `ListGridType` | — |
| id | 根元素 id | `string` | — |
| itemLayout | 列表项布局 | `'horizontal' \| 'vertical'` | `'horizontal'` |
| loading | 加载中。⚠️ **有 `dataSource` 时渲染的是列表本身**（占位块只在数据为空时可见） | `boolean \| SpinProps` | `false` |
| loadMore | 加载更多的内容（**取代**底部分页的位置） | `VNodeChild` | — |
| pagination | 分页配置；`false` 不渲染 | `PaginationConfig \| false` | `false` |
| rowKey | 行 key（函数或字段名） | `((item: T) => string \| number) \| keyof T` | — |
| size | 尺寸。`'large'` / `'small'` 落 `-lg` / `-sm`；`'default'` 不落类 | `'small' \| 'default' \| 'large'` | — |
| split | 列表项之间是否显示分割线 | `boolean` | `true` |
| header | 列表头部 | `VNodeChild` | — |
| footer | 列表底部 | `VNodeChild` | — |
| locale | 空态文案覆盖（**纯 prop**） | `{ emptyText: VNodeChild }` | — |
| prefixCls | 类名前缀 | | — |
| class / style | **根元素原生 attrs**（不是 Props） | | — |

### List 插槽

| 插槽 | 参数 | 说明 |
|---|---|---|
| default | — | 手动编排内容；存在时不显示默认空态 |
| item | `{ item: T, index: number }` | 渲染当前页的每项；`T` 从 `dataSource` 推断，`index` 从当前页的 0 开始；不传则不渲染数据项 |
| extra | — | 列表右侧内容；窄屏移到下方 |
| header | — | 列表头部 |
| footer | — | 列表底部 |
| loadMore | — | 替换底部分页，顶部的分页仍保留 |

`header` / `footer` / `loadMore` / `extra` 按插槽是否存在决定优先级；空插槽也压住同名 prop，且不生成空头尾容器。`loadMore` 大小写需保持一致。简单内容仍可通过同名 prop 传入。
`renderItem` 已直接移除，迁移见 [List 插槽迁移](../../../../docs/migrations/list-slots.md)。

```vue
<List :data-source="users" row-key="id">
  <template #item="{ item, index }">
    <ListItem>{{ index + 1 }}. {{ item.name }}</ListItem>
  </template>
  <template #footer>共 {{ users.length }} 人</template>
</List>
```


分页配置中的 `current` / `pageSize` 分别决定是否受控；不传时使用首次启用分页时的默认值。外部更新不触发业务回调；移除控制沿用最后一次接收的值，未接受的切页请求不会污染内部状态。数据缩短时非受控页码向可用页收敛，恢复数据不跳回旧页。显式 `total` 支持服务端分页，本地数据不足一个偏移量时保留服务端返回的当前页。`align` 原样传给 Pagination，默认 `end`；`position` 仅决定 List 布局。

栅格选择当前已匹配且配置过的最大断点，未匹配时使用 `column`。根 `prefixCls` 通过最近的 List/Item 上下文传递给子组件，子组件可显式覆盖；自定义前缀的静态 CSS 生成遵循全库前缀策略。嵌套 List 的尺寸、分隔、布局和边框各自独立。原生 `dir` 优先于 Provider 方向。

### List.Item

| 参数 | 说明 | 类型 |
|---|---|---|
| actions | 操作区。每项一个 `<li>`，项间有分隔线。⚠️ **空数组不渲染** | `VNodeChild[]` |
| extra | 额外内容；横向和竖向均有稳定的 `-item-extra` 语义容器 | `VNodeChild` |
| classNames | 语义化类名（`actions` / `extra`） | `{ actions?: string; extra?: string }` |
| styles | 语义化样式（同上） | `{ actions?: CSSProperties; extra?: CSSProperties }` |
| colStyle | 用户配置的 grid `Col` 根样式，不改变 List 的列数 | `CSSProperties` |

### List.Item 插槽

| 插槽 | 说明 |
|---|---|
| default | 列表项主体 |
| extra | 额外内容；两种布局都位于稳定的 extra 容器 |
| actions | 操作项模板；数组和 Fragment 展开，每个非空顶层节点一个操作项，项间自动分隔 |

具名插槽存在即优先于同名 prop，空插槽不回退。actions 忽略注释和纯空白，`v-for` 请提供稳定 key；同一包装元素内的多个按钮视作一个操作项。`actions` prop 的既有数组数据形态保留，同样过滤空内容并保留 VNode key；数字 `0` 可显示。

### List.Item.Meta

| 参数 | 说明 | 类型 |
|---|---|---|
| avatar | 头像 | `VNodeChild` |
| title | 标题（渲染成 `<h4>`） | `VNodeChild` |
| description | 描述 | `VNodeChild` |

### List.Item.Meta 插槽

`#avatar`、`#title`、`#description` 均无作用域参数，存在时优先于同名内容 prop（含空内容）。空头像不生成头像容器，空标题不生成 `h4`；标题和描述都为空时不生成 content 容器。`0` 是可显示内容。动态内容随渲染更新。

### 实例方法（ref）

三个组件都暴露 `{ nativeElement }`（可空）：List / Meta 为 `HTMLDivElement`；Item 非 grid 时为 `HTMLLIElement`，grid 时为 `HTMLDivElement`。

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

运行时通过 `ConfigProvider` 的 `theme.components.List` 配置上述 11 项，支持更新、移除和恢复；也可在 List 根元素使用 CSS 变量覆盖：`--apollo-list-item-padding` / `--apollo-list-content-width` 等
（11 个）。数据容器继承根变量；根原生 style 优先于 Provider 配置。

分页内容使用 `#paginationItemRender="{ page, type, element }"`、`#paginationTotal="{ total, range }"` 和 `#paginationSizeChanger="info"`。每个分页器接收当前作用域，支持顶部/底部及动态插槽；配置对象只放数据和业务事件，旧 itemRender/showTotal/sizeChangerRender 函数入口已移除。
