---
category: Other
title: FloatButton
subtitle: FloatButton
---

A floating action at the edge of a page, optionally grouped or used to return to the top.

## When To Use

- Global actions such as back to top, support and feedback.
- Related actions collected in `FloatButtonGroup`.

## Examples

See [`demo/`](./demo) for all 14 examples.

## API

### FloatButton

| Prop | Description | Type | Default |
|---|---|---|---|
| type | Button type | `'default' \| 'primary'` | `'default'` |
| shape | Shape; inherits the Group shape | `'circle' \| 'square'` | `'circle'` |
| disabled | Disabled; inherits ConfigProvider when omitted | `boolean` | `false` |
| href / target | Link URL and browsing target; href renders an anchor | `string` | — |
| htmlType | Native button type | `'button' \| 'submit' \| 'reset'` | `'button'` |
| aria-label | Accessible button name | `string` | — |
| tooltip | Tooltip content or configuration | `string \| TooltipProps` | — |
| badge | Badge configuration without status, text, title or children | `FloatButtonBadgeProps` | — |
| description | Deprecated; use `#content` | `string` | — |
| prefixCls | Complete class prefix | `string` | `'apollo-float-btn'` |
| classNames / styles | root, icon and content semantics; accepts `({ props }) => ...` | `FloatButtonProps['classNames' / 'styles']` | — |

`#icon` supplies complete icon content. Without an icon slot, empty content uses the default icon. `#content` supplies complete content; use `shape="square"` for text. Slot presence takes precedence, including intentionally empty results. Dynamic slots, text, arrays and Fragments update during rendering. FloatButton has no default slot or model.

`@click` emits the original `MouseEvent` once. Disabled controls follow Button's native activation rules.

Native class, style, id, ARIA and listeners reach the actual button/anchor. Style accepts Vue strings, objects and arrays. Precedence is current theme, Provider root style, semantic root style, then native style. An explicit zIndex, including zero, is preserved.

### FloatButtonGroup

| Prop | Description | Type | Default |
|---|---|---|---|
| trigger | Menu trigger; omit to display the list directly | `'click' \| 'hover'` | — |
| open | Controlled state; supports `v-model:open` | `boolean` | Uncontrolled starts closed |
| placement | List placement | `'top' \| 'left' \| 'right' \| 'bottom'` | `'top'` |
| shape | List and trigger shape; circle uses Flex, square uses Space.Compact | `'circle' \| 'square'` | `'circle'` |
| type / disabled / href / target / htmlType / tooltip / badge / aria-label | Trigger configuration; child buttons declare their own properties | As FloatButton | — |
| prefixCls | Complete class prefix | `string` | `'apollo-float-btn'` |
| classNames / styles | root, list, item, itemIcon, itemContent, trigger, triggerIcon, triggerContent | Object or `({ props }) => object` | — |

| Event | Payload | Description |
|---|---|---|
| update:open | `boolean` | Proposed state for `v-model:open` |
| openChange | `boolean` | Emitted once alongside update:open |
| click | `MouseEvent` | Original trigger activation |

`#default` supplies the list. `#icon`, `#closeIcon` and `#content` supply the trigger's closed icon, open icon and content. Trigger and list buttons consume their respective semantic regions.

Native Group attrs reach its outer div once. Configure the trigger with the listed props and trigger semantics. Controlled proposals change the state only when accepted by the parent; removing control retains the last accepted value. Click menus close on outside clicks. Hover menus also support focus entry and native button activation. Escape requests closing. An accepted close returns focus from the list to the trigger; rejected closes and external focus keep their current focus.

### FloatButtonBackTop

Inherits FloatButton props, `#icon` / `#content` and `@click`, with target replaced by a scroll-container getter.

| Prop | Description | Type | Default |
|---|---|---|---|
| visibilityHeight | Visible at or beyond this scroll offset | `number` | `400` |
| duration | Scroll animation duration in milliseconds; zero or less is immediate | `number` | `450` |
| showProgress | Show scroll progress | `boolean` | `false` |
| target | Current scroll container; a pending ref may return null | `() => HTMLElement \| Window \| Document \| null` | Button's owner document |

Target, threshold and progress options update reactively. Repeated clicks, target changes and unmounting cancel the current scroll animation. Reduced motion and theme `motion: false` scroll immediately. Scroll/resize listeners are released with their target and owner window.

### Provider and theme

`ConfigProvider.components.floatButton` and `floatButtonGroup` provide className, style, classNames and styles. Replacement, removal, nested scopes, prefixCls and direction follow their current values. FloatButton has no component tokens; size, spacing, color, shadow and motion consume current global Alias Tokens.

### Expose

FloatButton and FloatButtonBackTop expose readonly `nativeElement: HTMLButtonElement | HTMLAnchorElement | null`; Group exposes `HTMLDivElement | null`. A hidden or unmounted BackTop may expose null. No additional imperative methods are provided.
