---
category: Navigation
title: Breadcrumb
subtitle: Breadcrumb
---

Displays the location of the current page in the system hierarchy, and allows navigating back up.

## When To Use

- When the system has more than two levels of hierarchy;
- When it is necessary to tell the user "where you are";
- When you need to provide upward navigation.

## Examples

See [`demo/`](./demo) (**9** demos, mirroring antd's user-visible demos).

| demo | Description |
|---|---|
| `basic` | The simplest usage (the last item has no `href` ⇒ rendered as a `<span>`) |
| `separator` | Override the default `/` with `separator` |
| `separator-component` | A **standalone** separator via `type: 'separator'` (coexists with the default one) |
| `with-icon` | Icons inside `title` (including a **third-party bare `<svg>`**) |
| `with-params` | `params` replaces `:key` with the actual value |
| `overlay` | An item's `menu` ⇒ a dropdown |
| `debug-routes` | ⚠️ The deprecated `routes` channel (`breadcrumbName` → `title`) |

⚠️ **2** antd demos are **not ported** (see `README.md` §5):
`style-class` (requires `antd-style`) · `component-token` (tokens are build-time artifacts in this zero-runtime architecture).

## API

### Props

| Property | Description | Type | Default | Global config |
|---|---|---|---|---|
| items | Route data; native child composition is also supported | `BreadcrumbItemInput[]` | — | × |
| routes | ⚠️ **Deprecated**, use `items` | `BreadcrumbItemInput[]` | — | × |
| params | Route params, used to replace `:key` in `title` / `path` | `Record<string, unknown>` | `{}` | × |
| separator | Customize the separator | `VNodeChild` | `/` | ✅ (`breadcrumb.separator`) |
| dropdownIcon | Customize the dropdown icon | `VNodeChild` | `<DownOutlined />` | ✅ (`breadcrumb.dropdownIcon`) |

| classNames | Semantic class names (`root` / `item` / `separator`), function form supported | `BreadcrumbSemanticClassNames \| ((info) => …)` | — | ✅ (`breadcrumb.classNames`) |
| styles | Semantic styles (three slots), function form supported | `BreadcrumbSemanticStyles \| ((info) => …)` | — | ✅ (`breadcrumb.styles`) |
| prefixCls | Class name prefix | `string` | from ConfigProvider, fallback `apollo-breadcrumb` | × |
| class / style | Native root attrs (not Props) | `string` / `CSSProperties` | — | × |
| style | Inline style of the root element | `CSSProperties` | — | × |

#### BreadcrumbItemInput

```ts
type BreadcrumbItemInput = Partial<BreadcrumbItemType & BreadcrumbSeparatorType>;
```

`BreadcrumbItemType`:

| Property | Description | Type | Default |
|---|---|---|---|
| title | The name (strings go through `:param` substitution; vnodes are rendered as-is) | `VNodeChild` | — |
| href | Link destination. **Cannot be used together with `path`** | `string` | — |
| path | Concatenated path; **each level prepends the previous `path`**. Cannot be used with `href` | `string` | — |
| menu | Menu configuration (wraps this item with a `Dropdown`) | `BreadcrumbItemMenu` | — |
| dropdownProps | Custom configuration for the dropdown popup | `DropdownProps` | — |
| onClick | Click handler | `(e: MouseEvent) => void` | — |
| className | ⚠️ Lands on the **link element** (`<a>` / `<span>`), **not** the `<li>` | `string` | — |
| style | ⚠️ **Never reaches the DOM** (upstream quirk, confirmed by the L4 mechanical oracle — see `docs/analysis/breadcrumb.md` §6.2) | `CSSProperties` | — |
| key | List key (falls back to the index) | `string \| number` | — |
| breadcrumbName | ⚠️ **Deprecated**, use `title` (only used by the `routes` channel) | `string` | — |
| children | ⚠️ **Deprecated**, use `menu` (children become `menu.items`, **one level only**) | `Omit<BreadcrumbItemType, 'children'>[]` | — |
| `aria-*` / `data-*` | Passed through to the link element (the `pickAttrs` allowlist) | — | — |

`BreadcrumbSeparatorType` (an item with `type: 'separator'`):

| Property | Description | Type | Default |
|---|---|---|---|
| type | Marks the item as a separator (**required**) | `'separator'` | — |
| separator | The separator to display | `VNodeChild` | `/` |

### Three details you must know

1. **There is no separator after the last item**: upstream sets the last item's `separator`
   to `''`, and `isRenderable('')` is falsy ⇒ that `<li>` is **not rendered**.
   (`type: 'separator'` + `separator: ''` renders an **empty** `<li>` instead — a different thing.)
2. **`href` accumulates**: with the `path` channel, the n-th item's `href` is `#/` plus the
   first n `path` segments — not "its own path".
3. **The separator's prefix is the "root prefix"**: `BreadcrumbSeparator` uses
   `getPrefixCls('breadcrumb')` (ConfigProvider's root prefix), **unrelated** to the
   `prefixCls` prop ⇒ with `prefixCls="apollo"` the items are `apollo-item` while the
   separator is `apollo-breadcrumb-separator`.

### Semantic DOM

| Slot | Lands on |
|---|---|
| `root` | The root `<nav>` |
| `item` | Each item's `<li>` (**excluding** separators) |
| `separator` | The separator's `<li>` |

### #itemRender

Use `#itemRender="{ route, params, routes, paths, href }"`. Paths and href belong to the current route and include parameter substitution. An empty slot suppresses default content; removing the slot restores the default link renderer. The function prop is removed directly, without a compatibility layer or deprecation period.

```vue
<Breadcrumb :items="items" :params="params">
  <template #itemRender="{ route, href }">
    <a :href="href">{{ route.title }}</a>
  </template>
</Breadcrumb>
```

`BreadcrumbSlots` / `BreadcrumbItemSlotProps` expose the slot contract. BreadcrumbItem/BreadcrumbSeparator and the default slot are supported native Vue composition, with no component deprecation warning. Default children are read once per render and retain caller keys during reorder. Data items take precedence over the default slot.

## Design Token

**7 Component Tokens** (all alias-derived ⇒ emitted as `var(--apollo-breadcrumb-*)`):

| token | Default source | Consumer |
|---|---|---|
| `itemColor` | `colorTextDescription` | `color` of `.{p}` |
| `lastItemColor` | `colorText` | `.{p}-item:last-child` |
| `iconFontSize` | `fontSize` | `.{p} .apollo-icon` |
| `linkColor` | `colorTextDescription` | `.{p}-item a` |
| `linkHoverColor` | `colorText` | `.{p}-item a:hover` / `.{p}-overlay-link:hover` |
| `separatorColor` | `colorTextDescription` | `.{p}-separator` |
| `separatorMargin` | `marginXS` | `margin-inline` of `.{p}-separator` |

⚠️ Like antd, there are **no** `mergeToken` derived values (upstream is `mergeToken(token, {})`, empty).
