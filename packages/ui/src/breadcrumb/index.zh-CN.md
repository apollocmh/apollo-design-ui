---
category: 导航
title: Breadcrumb
subtitle: 面包屑
---

显示当前页面在层级结构中的位置，提供向上导航。可以使用数据项，也可以在默认插槽中组合 `BreadcrumbItem` / `BreadcrumbSeparator`。

## 代码演示

`demo/` 包含基础导航、图标、参数、菜单、分隔符、原生子组件、作用域插槽、语义样式和主题变量等 11 个成对示例。`debug-routes` 仅演示旧 `routes` 数据的迁移。

## API

### Breadcrumb

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| items | 数据源；提供 `[]` 时保持空列表，不消费默认槽 | `BreadcrumbItemInput[]` | — |
| routes | 已废弃的旧数据通道，使用 `items` | `BreadcrumbItemInput[]` | — |
| params | 替换字符串 title/path 中完整的 `:key`；支持重复参数、0、空字符串，缺失或空值保留占位符 | `Record<string, unknown>` | `{}` |
| separator | 自动分隔符；插槽优先，否则 prop → 当前 Provider → 默认值 | `VNodeChild` | `/` |
| dropdownIcon | 菜单按钮的装饰图标；插槽优先，否则 prop → 当前 Provider → 默认值 | `VNodeChild` | `DownOutlined` |
| prefixCls | 根及所属 Item/Separator 的当前前缀；自定义前缀须自行提供对应静态 CSS | `string` | `apollo-breadcrumb` |
| classNames | `root` / `item` / `separator` 类名；函数读取当前解析 props | `BreadcrumbSemanticClassNames \| ((info: { props: BreadcrumbProps }) => BreadcrumbSemanticClassNames)` | — |
| styles | 相同语义区域的样式；函数读取当前解析 props | `BreadcrumbSemanticStyles \| ((info: { props: BreadcrumbProps }) => BreadcrumbSemanticStyles)` | — |

原生 `class`、`style`、`id`、ARIA/data attrs 和监听器落根 `<nav>`。原生 style 最后覆盖语义样式及主题变量。Provider 支持 `components.breadcrumb` 的 `className`、`style`、`classNames`、`styles`、`separator`、`dropdownIcon`，均读取当前值。根没有组件事件或 v-model；暴露 `nativeElement: HTMLElement | null`。

| 插槽 | 作用域 | 行为 |
| --- | --- | --- |
| default | — | 只在未提供 items/routes 时组合原生子组件；保留调用方 key |
| itemRender | `{ route, params, routes, paths, href }` | 替换该数据项的默认内容；paths/href 对应该项 |
| separator | — | 替换自动分隔符 |
| dropdownIcon | — | 替换菜单按钮中的装饰图标 |

插槽存在则优先，包括有意为空的槽；条件槽出现/移除会更新，移除后恢复内容 prop/默认值。最后一项不自动追加分隔符。自定义 itemRender 内容直接进入稳定内容宿主，调用者负责其链接、ARIA、事件和样式。

### 数据项

`BreadcrumbItemInput = Partial<BreadcrumbItemType & BreadcrumbSeparatorType>`。

| 字段 | 说明 | 类型 |
| --- | --- | --- |
| key | 业务身份；省略则使用索引，重排建议显式指定 | `string \| number` |
| title | 完整 Vue 内容；仅字符串做参数替换 | `VNodeChild` |
| href | 直接链接 | `string` |
| path | 当前片段与此前 path 累加为 `#/a/b`；提供时优先于 href | `string` |
| className / style | 默认链接/文本/操作按钮的类名与有效内联样式 | `string` / `CSSProperties` |
| onClick | 默认内容元素的原生点击；无 href 时使用原生 button | `(event: MouseEvent) => void` |
| `aria-*` / `data-*` | 默认内容元素的属性 | — |
| menu | 菜单项及 Menu 配置 | `BreadcrumbItemMenu` |
| dropdownProps | Dropdown 配置；受控开合使用 open/onOpenChange | `DropdownProps` |
| breadcrumbName / children | 旧 routes 通道转换的标题/一层菜单，已废弃 | `string` / `Omit<BreadcrumbItemType, 'children'>[]` |
| type / separator | `type: 'separator'` 表示独立装饰分隔符，不参与 path 累加 | `'separator'` / `VNodeChild` |

菜单项支持 `key`、`label` / `title`、`href`、`path` 和 Menu 的 `disabled`、图标、额外内容及业务事件字段。显式 `href` 优先；否则 `path` 连接当前项 href，无 base 时直接使用 path。label 显式存在（包括空值）时优先于 title。

### BreadcrumbItem / BreadcrumbSeparator

`BreadcrumbItem` 支持 `href`、`menu`、`dropdownProps`、`dropdownIcon`、`separator`、`prefixCls`，默认槽是完整内容，另有 `#separator`、`#dropdownIcon`。本地槽优先于本地 prop，再回落所属 Breadcrumb 当前值。原生 class/style、id、ARIA/data attrs 和监听器落所属 `<li>`；`@click` 接收一次原生 MouseEvent。最后一项的自动分隔符被抑制。

`BreadcrumbSeparator` 只有默认内容槽与原生 attrs，落装饰 `<li aria-hidden="true">`。未提供槽显示 `/`，存在的空槽保留空内容。其前缀与语义样式来自所属 Breadcrumb；组件不允许 attrs 取消装饰隐藏语义。两种子组件均受支持，无整组件弃用告警，无额外 expose 或模型。

### 菜单与键盘

导航链接和菜单按钮是兄弟节点。菜单按钮有独立可访问名称，支持鼠标、Enter、Space 及 ArrowDown 打开；键盘打开后焦点进入菜单，菜单使用自身方向键行为。Escape 请求关闭，实际接受关闭且焦点仍属菜单时返回按钮；受控拒绝或焦点已移到外部时保持当前焦点。默认触发为箭头按钮的 hover/click，可由 dropdownProps.trigger 调整，原生按钮仍保留键盘入口。

## Design Token

当前主题、暗色/紧凑算法、嵌套 Provider 和运行时替换均应用到根 CSS 变量；原生 style 可覆盖。

| Token | 默认来源 | 消费点 |
| --- | --- | --- |
| itemColor | `colorTextSecondary` | 普通文字 |
| lastItemColor | `colorText` | 末项文字 |
| linkColor | `colorTextSecondary` | 默认链接/操作按钮 |
| linkHoverColor | `colorText` | 链接与菜单区域 hover |
| iconFontSize | `fontSize` | 内容中的 Apollo 图标；下拉箭头使用 fontSizeIcon |
| separatorColor | `colorTextDescription` | 装饰分隔符 |
| separatorMargin | `marginXS` | 分隔符两侧间距 |

详见 [Breadcrumb 契约迁移](../../../../docs/migrations/breadcrumb-contracts.md)。
