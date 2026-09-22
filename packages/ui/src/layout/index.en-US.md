---
category: Layout
title: Layout
subtitle: Layout
---

Handle the overall layout of a page.

## When To Use

- To build the page skeleton (top nav / side nav / content / footer).
- When the sider needs collapsing, responsive breakpoints or a custom trigger
  (use `Layout.Sider`).

## Examples

See [`demo/`](./demo) (11, one-to-one with antd non-debug demos).

> `Menu` / `Breadcrumb` are not landed yet — the demos use equivalent native structures.

## API

### Layout

| Prop | Description | Type | Default |
|---|---|---|---|
| hasSider | Whether it has a sider (omitted ⇒ auto-detect: registered siders or a `Sider` in children) | `boolean` | — |
| className / rootClassName / style | Root attributes (**style overrides** ConfigProvider `layout.style`) | — | — |
| prefixCls | Custom prefix | `string` | — |

### Layout.Header / Layout.Footer / Layout.Content

| Prop | Description | Type |
|---|---|---|
| prefixCls | Used **as-is** (no `-header` suffix appended) | `string` |
| className / style | Root attributes | — |

Tags: Header=`header`, Footer=`footer`, Content=`main`.

### Layout.Sider

| Prop | Description | Type | Default |
|---|---|---|---|
| collapsible | Whether it can be collapsed | `boolean` | `false` |
| collapsed | Current state (controlled) | `boolean` | — |
| defaultCollapsed | Uncontrolled initial value | `boolean` | `false` |
| width | Expanded width (numbers get `px`, strings pass through) | `number \| string` | `200` |
| collapsedWidth | Collapsed width (parses to 0 ⇒ zero-width trigger) | `number \| string` | `80` |
| reverseArrow | Reverse the arrow direction | `boolean` | `false` |
| trigger | Custom trigger (`null` removes the trigger area) | `VNodeChild` | — |
| zeroWidthTriggerStyle | Zero-width trigger style | `CSSProperties` | — |
| breakpoint | Responsive breakpoint | `'xs' \| … \| 'xxxl'` | — |
| theme | Theme | `'light' \| 'dark'` | `'dark'` |
| classNames / styles | Semantic slots `{ root, body }` (object or function receiving `{ props }`) | — | — |
| onCollapse | Collapse state change | `(collapsed, type: 'clickTrigger' \| 'responsive') => void` | — |
| onBreakpoint | Breakpoint change (called once on mount with `mql.matches`) | `(broken: boolean) => void` | — |

### Slots

| Name | Description |
|---|---|
| default | Content (Layout and all four sub components) |
| trigger | Sider trigger (prop takes precedence) |

## Ref

| Name | Type |
|---|---|
| nativeElement | `HTMLElement \| null` |

## Theme (Component Token)

19 tokens: `bodyBg` / `headerBg` / `headerHeight` / `headerPadding` / `headerColor` /
`footerPadding` / `footerBg` / `siderBg` / `triggerHeight` / `triggerBg` /
`triggerColor` / `zeroTriggerWidth` / `zeroTriggerHeight` / `lightSiderBg` /
`lightTriggerBg` / `lightTriggerColor` + three deprecated aliases.
