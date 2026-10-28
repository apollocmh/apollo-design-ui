---
category: Navigation
title: Breadcrumb
subtitle: Breadcrumb
---

Shows the current page in a hierarchy and provides upward navigation. Use data items or compose `BreadcrumbItem` / `BreadcrumbSeparator` in the default slot.

## Examples

`demo/` contains 11 paired examples covering navigation, icons, parameters, menus, separators, native children, scoped content, semantic styles and theme variables. `debug-routes` demonstrates migration of legacy route data.

## API

### Breadcrumb

| Property | Description | Type | Default |
| --- | --- | --- | --- |
| items | Data source; a provided `[]` stays empty and does not evaluate the default slot | `BreadcrumbItemInput[]` | — |
| routes | Deprecated legacy data channel; use items | `BreadcrumbItemInput[]` | — |
| params | Replaces complete `:key` names in string titles/paths; supports repeated names, zero and empty strings; missing/null values preserve placeholders | `Record<string, unknown>` | `{}` |
| separator | Automatic separator; slot first, then prop → current Provider → default | `VNodeChild` | `/` |
| dropdownIcon | Decorative menu button icon; slot first, then prop → current Provider → default | `VNodeChild` | `DownOutlined` |
| prefixCls | Current prefix of this navigation and its owned Item/Separator nodes; custom prefixes require matching static CSS | `string` | `apollo-breadcrumb` |
| classNames | root/item/separator classes; functions receive current resolved props | `BreadcrumbSemanticClassNames \| ((info: { props: BreadcrumbProps }) => BreadcrumbSemanticClassNames)` | — |
| styles | Styles for the same semantic regions; functions receive current resolved props | `BreadcrumbSemanticStyles \| ((info: { props: BreadcrumbProps }) => BreadcrumbSemanticStyles)` | — |

Native class/style, id, ARIA/data attrs and listeners belong to the root nav. Native style overrides semantic styles and theme variables. Provider `components.breadcrumb` supports className, style, classNames, styles, separator and dropdownIcon, using current values. Breadcrumb has no component event or model; it exposes `nativeElement: HTMLElement | null`.

| Slot | Scope | Behavior |
| --- | --- | --- |
| default | — | Native children, only when neither items nor routes is provided; retains caller keys |
| itemRender | `{ route, params, routes, paths, href }` | Replaces a data item's default content; paths/href belong to that item |
| separator | — | Replaces automatic separators |
| dropdownIcon | — | Replaces the decorative menu button icon |

A present slot wins, including intentionally empty content. Conditional slots update and restore prop/default content when removed. The last item has no automatic separator. Custom itemRender content goes into a stable host; callers own its links, ARIA, listeners and styles.

### Data items

`BreadcrumbItemInput = Partial<BreadcrumbItemType & BreadcrumbSeparatorType>`.

| Field | Description | Type |
| --- | --- | --- |
| key | Business identity; defaults to index; provide stable keys when reordering | `string \| number` |
| title | Complete Vue content; only strings substitute parameters | `VNodeChild` |
| href | Direct destination | `string` |
| path | Accumulates this and previous path segments as `#/a/b`; takes precedence over href | `string` |
| className / style | Classes and effective inline styles of the default link/text/action button | `string` / `CSSProperties` |
| onClick | Native click on default content; an item without href uses a native button | `(event: MouseEvent) => void` |
| `aria-*` / `data-*` | Attributes of default content | — |
| menu | Menu items and Menu configuration | `BreadcrumbItemMenu` |
| dropdownProps | Dropdown configuration; controlled state uses open/onOpenChange | `DropdownProps` |
| breadcrumbName / children | Deprecated legacy routes title/one-level menu conversion | `string` / `Omit<BreadcrumbItemType, 'children'>[]` |
| type / separator | `type: 'separator'` creates an independent decorative separator and does not accumulate a path | `'separator'` / `VNodeChild` |

Menu items support key, label/title, href, path, and Menu's disabled, icon, extra and business event fields. Explicit href wins; otherwise path appends to the current breadcrumb href, or is used directly without a base. A provided label, including empty content, takes precedence over title.

### BreadcrumbItem / BreadcrumbSeparator

BreadcrumbItem supports href, menu, dropdownProps, dropdownIcon, separator and prefixCls. The default slot supplies complete content; #separator and #dropdownIcon override local props and then fall back to the owning Breadcrumb's current values. Native class/style, id, ARIA/data attrs and listeners belong to the owning li. @click receives one native MouseEvent. The final item's automatic separator is suppressed.

BreadcrumbSeparator has a default content slot and native attrs on its decorative `<li aria-hidden="true">`. No slot renders `/`; a present empty slot stays empty. Prefix and semantic styles come from its owning Breadcrumb. Attributes cannot expose decorative content to assistive technology. Both children are supported without component deprecation warnings and have no extra expose or model.

### Menu keyboard and focus

The navigation link and menu button are siblings. The named native menu button supports pointer, Enter, Space and ArrowDown opening. Keyboard opening moves focus into the menu, which owns its arrow-key behavior. Escape requests closing. Accepted closing returns focus only when it still belongs to that menu; controlled refusal and external focus retain their owner. Default trigger actions are hover/click on the arrow button. dropdownProps.trigger can customize pointer behavior while native keyboard access remains available.

## Design Token

Current themes, dark/compact algorithms, nested Providers and runtime replacements apply root CSS variables. Native style may override them.

| Token | Default source | Consumer |
| --- | --- | --- |
| itemColor | colorTextSecondary | Ordinary text |
| lastItemColor | colorText | Final item text |
| linkColor | colorTextSecondary | Default link/action button |
| linkHoverColor | colorText | Link/menu area hover |
| iconFontSize | fontSize | Apollo icons in content; dropdown arrow uses fontSizeIcon |
| separatorColor | colorTextDescription | Decorative separator |
| separatorMargin | marginXS | Separator inline margins |

See [Breadcrumb contract migration](../../../../docs/migrations/breadcrumb-contracts.md).
