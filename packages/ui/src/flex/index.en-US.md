---
category: Layout
title: Flex
subtitle: Flexbox Layout
---

A flexbox layout container for alignment and spacing.

## When To Use

- Good for setting spacing between elements.
- Good for setting horizontal / vertical alignment.

### Difference with Space component

- Space adds wrapper elements for inline alignment — best for equidistant inline arrangements.
- Flex works on block-level children directly, without wrappers, and offers more control.

## Examples

See [`demo/`](./demo) (6 demos, one-to-one with antd, including the `debug` demo).

## API

> Available since antd@5.10.0. Flex aligns to flex-start by default in horizontal mode, and stretch in vertical mode.

### Props

| Prop | Description | Type | Default | Global Config |
|---|---|---|---|---|
| vertical | Flex direction is vertical (`flex-direction: column`) | `boolean` | `false` | ✅ (`flex.vertical`) |
| orientation | Direction type. Takes priority over `vertical` | `'horizontal' \| 'vertical'` | `'horizontal'` | × |
| wrap | Single line or multiple lines | `flex-wrap \| boolean` | — | × |
| justify | Justify content on the main axis | `justify-content` | — | × |
| align | Align items on the cross axis | `align-items` | — | × |
| flex | Flex CSS shorthand (numbers are unitless) | `flex` | — | × |
| gap | Gap between items. Presets go to class names, others inline | `'small' \| 'medium' \| 'large' \| string \| number` | — | × |
| component | Custom root element | `Component \| string` | `'div'` | × |
| prefixCls | Class name prefix | `string` | from ConfigProvider, fallback `apollo-flex` | × |

> **Native root attributes**: the root's `class` / `style` are **Vue-native attrs** (not Props) —
> `<Flex class="..." :style="..." />`. Merge order (low → high):
> ConfigProvider `flex.style` → caller native `style` → inline style derived from `flex` / `gap`.

### Ref

| Name | Type | Description |
|---|---|---|
| nativeElement | `HTMLElement \| null` | Root element (antd's forwardRef ref) |

### Slots

| Name | Description |
|---|---|
| default | Children. antd's `children` |

## Theme

### Component Token

Flex has **no Component Tokens** (identical to antd: `prepareComponentToken = () => ({})`).

The three gap tiers come from alias token derivation (antd's `flexToken`):

| Derived token | Source | CSS |
|---|---|---|
| flexGapSM | `paddingXS` | `var(--apollo-padding-xs)` |
| flexGap | `padding` | `var(--apollo-padding)` |
| flexGapLG | `paddingLG` | `var(--apollo-padding-lg)` |

## Design Notes

- `justify` / `wrap` / `align` only produce class names and are **never passed to the DOM** (same as antd's `omit`).
- `gap: 0` still writes inline `style.gap` (`isNonNullable` predicate) — aligned verbatim with upstream.
- `flex` is unitless: the number `1` serializes as `'1'`, not `'1px'`.
- antd's `resetStyle: false`: Flex does not consume the resetComponent font styles (upstream issue 46403); neither do we.
