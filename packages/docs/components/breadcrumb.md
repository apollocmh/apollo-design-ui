---
title: Breadcrumb 面包屑
outline: [2, 3]
---

<!-- ⚠️ 本文件由 scripts/gen-component-pages.mjs 生成，请勿手改；改 packages/ui/src/<c>/index.zh-CN.md -->

::: v-pre

显示当前页面在系统层级结构中的位置，并能向上返回。

## 何时使用

- 当系统拥有超过两级以上的层级结构时；
- 当需要告知用户「你在哪里」时；
- 当需要向上导航的功能时。

:::

## 代码演示

::: v-pre

**basic**：最简单的用法。`title` 可以是字符串，也可以是一个 vnode（链接、图标…）；
最后一项目标没有 `href` ⇒ 渲染成 `<span>`（不可点）。

:::

<DemoPreview component="breadcrumb" demo="basic" />

::: v-pre

**debug-routes**：⚠️ `routes` **已废弃**（用 `items`）。`breadcrumbName` 会被映射成 `title`，
`children` 会被折成 `menu.items`；每一层 `path` 会**累加**成 `href`。

:::

<DemoPreview component="breadcrumb" demo="debug-routes" />

::: v-pre

**overlay**：项的 `menu` 会让它带一个下拉菜单（外层是 `.{p}-overlay-link`，并渲染 `dropdownIcon`）。

:::

<DemoPreview component="breadcrumb" demo="overlay" />

::: v-pre

**separator-component**：用 `type: 'separator'` 的项插入**独立**分隔符（可以与默认分隔符并存）。
把 `separator` 设为 `''` 可以去掉自动分隔符。

:::

<DemoPreview component="breadcrumb" demo="separator-component" />

::: v-pre

**separator**：用 `separator` 覆盖默认的 `/`。

:::

<DemoPreview component="breadcrumb" demo="separator" />

::: v-pre

**with-icon**：`title` 里可以放图标。第三种是**第三方图标**（裸 `<svg>`，没有 `.apollo-icon` 包裹）
—— 它靠 `.{p}-link > svg` 那条规则居中、并与文字保持间距。

:::

<DemoPreview component="breadcrumb" demo="with-icon" />

::: v-pre

**with-params**：`params` 会把 `title`（以及 `path`）里的 `:key` 替换成实际值。

:::

<DemoPreview component="breadcrumb" demo="with-params" />

::: v-pre

## API

### Props

| 参数 | 说明 | 类型 | 默认值 | 全局配置 |
|---|---|---|---|---|
| items | 路由栈信息（**推荐**）。旧代码用 `routes` 或 `Breadcrumb.Item` 子组件 | `BreadcrumbItemInput[]` | — | × |
| routes | ⚠️ **已废弃**，用 `items` | `BreadcrumbItemInput[]` | — | × |
| params | 路由参数，用于替换 `title` / `path` 里的 `:key` | `Record<string, unknown>` | `{}` | × |
| separator | 分隔符自定义 | `VNodeChild` | `/` | ✅（`breadcrumb.separator`） |
| dropdownIcon | 自定义下拉图标 | `VNodeChild` | `<DownOutlined />` | ✅（`breadcrumb.dropdownIcon`） |
| itemRender | 自定义每一项的渲染（与 react-router 配合用）。⚠️ **只收 4 个实参，没有 `href`** | `(route, params, routes, paths) => VNodeChild` | — | × |
| classNames | 语义化类名（`root` / `item` / `separator`），支持函数形态 | `BreadcrumbSemanticClassNames \| ((info) => …)` | — | ✅（`breadcrumb.classNames`） |
| styles | 语义化样式（三个槽），支持函数形态 | `BreadcrumbSemanticStyles \| ((info) => …)` | — | ✅（`breadcrumb.styles`） |
| prefixCls | 类名前缀 | `string` | 从 ConfigProvider 取，兜底 `apollo-breadcrumb` | × |
| class / style | 根元素原生 attrs（不是 Props） | `string` / `CSSProperties` | — | × |
| style | 根元素内联样式 | `CSSProperties` | — | × |

#### BreadcrumbItemInput

```ts
type BreadcrumbItemInput = Partial<BreadcrumbItemType & BreadcrumbSeparatorType>;
```

`BreadcrumbItemType`：

| 字段 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| title | 名称（字符串会做 `:param` 替换；vnode 原样渲染） | `VNodeChild` | — |
| href | 链接目的地。**不能与 `path` 共用** | `string` | — |
| path | 拼接路径，**每一层都会拼上前一个 `path`**。不能与 `href` 共用 | `string` | — |
| menu | 菜单配置项（会让这一项被 `Dropdown` 包一层） | `BreadcrumbItemMenu` | — |
| dropdownProps | 弹出下拉菜单的自定义配置 | `DropdownProps` | — |
| onClick | 单击事件 | `(e: MouseEvent) => void` | — |
| className | ⚠️ 落在**链接元素**（`<a>` / `<span>`）上，**不是** `<li>` | `string` | — |
| style | ⚠️ **落不到 DOM**（上游 quirk，已由 L4 机械 oracle 实测确认，见 `docs/analysis/breadcrumb.md` §6.2） | `CSSProperties` | — |
| key | 列表 key（不传则用索引） | `string \| number` | — |
| breadcrumbName | ⚠️ **已废弃**，用 `title`（仅 `routes` 通道会用到） | `string` | — |
| children | ⚠️ **已废弃**，用 `menu`（子项会折成 `menu.items`，**只有一层**） | `Omit<BreadcrumbItemType, 'children'>[]` | — |
| `aria-*` / `data-*` | 透传到链接元素上（`pickAttrs` 的白名单） | — | — |

`BreadcrumbSeparatorType`（`type: 'separator'` 的项）：

| 字段 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| type | 标记为分隔符（**必填**） | `'separator'` | — |
| separator | 要显示的分隔符 | `VNodeChild` | `/` |

### 三个必须知道的细节

1. **最后一项后面没有分隔符**：上游把最后一项的 `separator` 置为 `''`，
   而 `isRenderable('')` 为假 ⇒ **不渲染**那个 `<li>`。
   （`type: 'separator'` + `separator: ''` 则会渲染一个**空** `<li>` —— 两者不同。）
2. **`href` 是累加的**：`path` 通道下第 n 项的 `href` 是 `#/` + 前 n 个 `path` 拼起来，
   不是「自己的 path」。
3. **分隔符的类名前缀是「根前缀」**：`BreadcrumbSeparator` 取 `getPrefixCls('breadcrumb')`
   （ConfigProvider 的根前缀），与 `prefixCls` prop **无关** ⇒ 传 `prefixCls="apollo"` 时
   item 是 `apollo-item`，而分隔符是 `apollo-breadcrumb-separator`。

### 语义化 DOM

| 槽 | 落在哪 |
|---|---|
| `root` | 根 `<nav>` |
| `item` | 每一项的 `<li>`（**不含**分隔符） |
| `separator` | 分隔符的 `<li>` |

### 和 `itemRender` 配合

`itemRender` 的入参是 `(route, params, routes, paths)` —— ⚠️ **没有 `href`**（上游如此）。
路径可以用 `paths.join('/')` 自己拼：

```vue
<script setup lang="ts">
import { Breadcrumb, type BreadcrumbItemInput } from '@apollo-design/ui';
import { h } from 'vue';

const items: BreadcrumbItemInput[] = [
  { path: '/index', title: 'home' },
  { path: '/first', title: 'first' },
];

const itemRender = (
  route: BreadcrumbItemInput,
  _params: unknown,
  _routes: BreadcrumbItemInput[],
  paths: string[],
) => h('a', { href: `/${paths.join('/')}` }, route.title);
</script>

<template>
  <Breadcrumb :items="items" :item-render="itemRender" />
</template>
```

## 主题变量（Design Token）

**7 个 Component Token**（全部是别名派生 ⇒ 落 `var(--apollo-breadcrumb-*)`）：

| token | 默认值来源 | 消费点 |
|---|---|---|
| `itemColor` | `colorTextDescription` | `.{p}` 的 `color` |
| `lastItemColor` | `colorText` | `.{p}-item:last-child` |
| `iconFontSize` | `fontSize` | `.{p} .apollo-icon` |
| `linkColor` | `colorTextDescription` | `.{p}-item a` |
| `linkHoverColor` | `colorText` | `.{p}-item a:hover` / `.{p}-overlay-link:hover` |
| `separatorColor` | `colorTextDescription` | `.{p}-separator` |
| `separatorMargin` | `marginXS` | `.{p}-separator` 的 `margin-inline` |

⚠️ 与 antd 一样，本仓**没有** `mergeToken` 派生值（上游是 `mergeToken(token, {})`，空的）。

:::
