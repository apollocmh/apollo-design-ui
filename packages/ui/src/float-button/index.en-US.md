---
category: Other
title: FloatButton
subtitle: FloatButton
---

A button that floats at the edge of the page.

## When To Use

- Global actions (back to top, customer service, feedback).
- Group actions with `FloatButtonGroup` (menu mode via trigger).

## Examples

See [`demo/`](./demo) (12 demos, one-to-one with antd's user-visible demos).

## API

### FloatButton Props

| Prop | Description | Type | Default |
|---|---|---|---|
| type | Type | `'default' \| 'primary'` | `'default'` |
| shape | Shape | `'circle' \| 'square'` | `'circle'` |
| disabled | Disabled | `boolean` | `false` |
| href / target / htmlType | Link form (href ⇒ `<a>`) | — | — |
| tooltip | Tooltip (string or TooltipProps object) | — | — |
| badge | Badge (BadgeProps minus status/text/title/children) | `object` | — |
| description | ⚠️ Deprecated (use the `#content` slot) | `string` | — |

### FloatButton Slots

| Slot | Description |
|---|---|
| #icon | Custom icon (defaults to FileTextOutlined when icon-only) |
| #content | Text content (successor of the deprecated `description`) |

### FloatButtonGroup Props

| Prop | Description | Type | Default |
|---|---|---|---|
| trigger | Menu mode (click / hover); omit = plain list | `'click' \| 'hover'` | — |
| open / onOpenChange | Controlled open (`v-model:open`) | `boolean` / `fn` | — |
| placement | Menu placement | `'top' \| 'left' \| 'right' \| 'bottom'` | `'top'` |
| shape / type / disabled etc. | Injected into children via context | — | `'circle'` |

### FloatButton.BackTop Props

| Prop | Description | Type | Default |
|---|---|---|---|
| visibilityHeight | Visible after scrolling past this height | `number` | `400` |
| duration | Scroll duration | `number` | `450` |
| showProgress | Progress ring (v6.6.0) | `boolean` | `false` |
| target | Scroll container | `() => HTMLElement \| Window \| Document` | ownerDocument |

### Expose

`nativeElement` (FloatButton / Group / BackTop).

## Design notes

- **A thin shell over Button** (`prefixCls='float-btn'`) + Group list (circle ⇒ Flex,
  square ⇒ Space.Compact) + BackTop (scroll infra reused from back-top).
- **showProgress** feeds the conic-gradient progress ring via the CSS variable
  `--{prefix}-float-btn-progress`.
- **Difference**: antd does not emit the icon-only class on the Button root (React
  empty-children counting quirk, D113 UPSTREAM); Group trigger-level semantics fall
  back to listContext (Vue provide timing).
