---
category: Navigation
title: Menu
---

Horizontal, vertical and inline navigation driven by `items`. See [`demo/`](./demo).

## API

### Props

| Property | Description | Type | Default |
|---|---|---|---|
| items | The content source, including VNode data and per-item icon functions | `ItemType[]` | — |
| mode / theme | Layout and light/dark theme | `'horizontal' \| 'vertical' \| 'inline'` / `'light' \| 'dark'` | `'vertical'` / `'light'` |
| selectedKeys / defaultSelectedKeys | Controlled selection / initial selection; `v-model:selectedKeys` | `string[]` | `[]` |
| openKeys / defaultOpenKeys | Controlled opening / initial opening; `v-model:openKeys` | `string[]` | `[]` |
| activeKey | Controlled active item; withdrawal keeps the last accepted value | `string` | — |
| selectable / multiple | Selection / multiple selection | `boolean` | `true` / `false` |
| disabled | Inherits ConfigProvider when omitted | `boolean` | — |
| inlineCollapsed | Collapsed icons; falls back to Sider | `boolean` | — |
| tooltip | Collapsed-item Tooltip options; false disables it | `false \| TooltipProps` | — |
| inlineIndent | Inline indentation in px | `number` | `24` |
| triggerSubMenuAction | Popup activation; inline menus use click and keyboard | `'hover' \| 'click'` | `'hover'` |
| subMenuOpenDelay / subMenuCloseDelay | Hover delays in seconds | `number` | `0.1` / `0.1` |
| forceSubMenuRender / disabledOverflow | Preserve submenu rendering / disable horizontal overflow | `boolean` | `false` |
| getPopupContainer | Popup container; inherits the current ConfigProvider | `(node: HTMLElement) => HTMLElement \| ShadowRoot` | — |
| prefixCls / id / role / tabIndex | Current prefix and root-list attributes | `string` / `string` / `string` / `number` | — / — / `'menu'` / `0` |
| classNames / styles | `root/list/item/itemTitle/itemIcon/itemContent`, nested `popup.root` and `subMenu` | `MenuClassNames` / `MenuStyles` | — |

Native class, style (including strings and arrays), data/ARIA attributes and native listeners reach the actual root ul in every mode. `click` carries a Menu business payload. Native keyboard listeners use `@keydown`, or `onKeydown` with h(). Native root styles override Provider and semantic styles. The hidden path-registration tree receives none of these root attributes.

### Emits

| Event | Payload |
|---|---|
| update:selectedKeys / update:openKeys | `string[]` |
| click | `MenuInfo`: key, keyPath, itemData and native domEvent |
| select / deselect | `SelectInfo`, including selectedKeys; deselect only removes a multiple selection |
| openChange | Proposed `string[]` |

Vue owns these notifications, including listener arrays and `.once`. keyPath runs from the item to the root. domEvent can cancel a link's default navigation. Rejected controlled proposals do not contaminate state after control is withdrawn.

### Data and slots

Item label, extra, icon and itemIcon remain data fields. Icon functions receive RenderIconInfo. Submenu expandIcon functions and per-item click/title/hover handlers retain their data responsibility. A submenu theme also reaches descendant popups. An explicit `type: 'submenu'` supports an empty children array.

| Component | Slot | Scope / content |
|---|---|---|
| Menu | expandIcon | `{ isOpen, isSelected, isSubMenu, disabled }`; per-item expandIcon takes precedence |
| MenuItem | default / title / extra | Main content and extra content; a text title prop remains available |
| MenuItem | icon | RenderIconInfo |
| MenuSubMenu | title / icon / expandIcon | Icon slots receive RenderIconInfo |
| MenuItemGroup | title / default | Group title / children |

Slots are read during rendering. A present slot wins, including intentionally empty, text and multiple-node results. Menu does not interpret its default slot as a second menu declaration tree: items and path registration retain one data source. Existing static components use the same internal Menu context.

### Expose

`list: HTMLUListElement | null` is the current root, including horizontal Overflow. `focus(options?)` focuses the first enabled item. `findItem({ key })` finds this instance's actual item, including teleported submenus and keys containing quotes. Element references clear on unmount.

## Provider and styles

The current components.menu className/style/classNames/styles, global disabled state, direction and popup container respond to replacement and removal. theme.components.Menu supports the existing ten numeric tokens: dropdownWidth, zIndexPopup, radiusItem, itemBorderRadius, radiusSubMenuItem, subMenuItemBorderRadius, activeBarWidth, activeBarHeight, activeBarBorderWidth and itemMarginInline. The legacy radius aliases affect the corresponding radius unless its modern field is explicit. Other static CSS variables remain available for direct styling; they are not additional implemented component tokens. Current aliases and these ten tokens reach root, inline and actual popup lists. Numeric popup layers also provide descendant context. Nonnumeric CSS layer expressions retain their styles; automatic numeric descendant layering for expressions remains deferred.

## Keyboard and lifecycle

Enter or Space on an item activates its single owned native link or button, or emits one ordinary item action. A focused native control owns its browser activation. Disabled items block native navigation. Inputs and editable content keep their own keys. With multiple native actions, focus the intended control directly.

Inline lists hide after closing motion. Leaving inline mode removes them after motion; initial mounting does not animate. Pending hover timers and focus frames are released on unmount.

## Development migration

Use #expandIcon instead of the top-level expandIcon rendering prop, and #icon for static item icons. Per-item rendering functions remain. Replace onKeyDown with native onKeydown / @keydown. The unused children type field is removed; content continues to use items. Business listeners keep @click/@select/@deselect/@openChange and their programmatic onClick/onSelect/onDeselect/onOpenChange names.
