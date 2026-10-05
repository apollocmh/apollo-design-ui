---
category: 导航
title: Breadcrumb
subtitle: 面包屑
---

显示当前页面在系统层级结构中的位置，并能向上返回。

## 何时使用

- 当系统拥有超过两级以上的层级结构时；
- 当需要告知用户「你在哪里」时；
- 当需要向上导航的功能时。

## 代码演示

见 [`demo/`](./demo)（**7 个**，与 antd 的用户可见 demo 对应）。

| demo | 内容 |
|---|---|
| `basic` | 最简单的用法（末项无 `href` ⇒ 渲染成 `<span>`） |
| `separator` | 用 `separator` 覆盖默认的 `/` |
| `separator-component` | `type: 'separator'` 的**独立**分隔符（可与默认分隔符并存） |
| `with-icon` | `title` 里放图标（含**第三方裸 `<svg>`** 的形态） |
| `with-params` | `params` 把 `:key` 替换成实际值 |
| `overlay` | 项的 `menu` ⇒ 带下拉菜单 |
| `debug-routes` | ⚠️ 废弃的 `routes` 通道（`breadcrumbName` → `title`） |

⚠️ 与 antd 的 2 个 demo **未移植**（缺口见 `README.md` §5）：
`style-class`（依赖 `antd-style`）· `component-token`（零运行时下 token 是构建期产物）。

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
