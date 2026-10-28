---
category: Layout
title: Flex
subtitle: Flexbox Layout
---

Flex aligns and spaces complete Vue content directly, without adding a wrapper around every child. Use Space when each inline item needs its own spacing wrapper.

## Examples

The six paired demos show direction, alignment, gaps, wrapping, a responsive project summary and layout blocks. Their native controls have labels and retain normal keyboard behavior.

## API

| Prop | Description | Type | Default |
|---|---|---|---|
| prefixCls | Complete class prefix; custom prefixes require matching consumer CSS | `string` | Current ConfigProvider, then `apollo-flex` |
| vertical | Vertical direction; omission permits current `flex.vertical` config | `boolean` | `undefined` |
| orientation | Takes precedence over `vertical` and Provider | `'horizontal' \| 'vertical'` | Resolved direction defaults to horizontal |
| wrap | Multiple lines; true means wrap | `boolean \| 'wrap' \| 'nowrap' \| 'wrap-reverse'` | Single line |
| justify | Main-axis CSS alignment | `FlexJustify` | Native flex-start behavior |
| align | Cross-axis CSS alignment | `FlexAlign` | Horizontal: flex-start; vertical: stretch |
| flex | CSS shorthand; numbers are unitless | `string \| number` | — |
| gap | Pixel number, CSS length or preset | `'small' \| 'medium' \| 'middle' \| 'large' \| string \| number` | — |
| component | Native tag or Vue component forwarding attrs/default slot to its host | `Component \| string` | `'div'` |

Direction priority is `orientation` → explicit `vertical` → current ConfigProvider `flex.vertical` → horizontal. ConfigProvider `flex.className`, `flex.style`, vertical, direction and prefix updates are read at render time. Explicit native `dir` wins over Provider direction.

### Slots, events and state

`#default` accepts complete Vue content, including zero, text, multiple VNodes and Fragments. Flex has no business emits or v-model. Native root listeners receive their original DOM events once. Caller-owned inputs, links and buttons keep their own semantics, focus and keyboard behavior.

Root `class`, `style`, id, data/ARIA attributes, tabindex and native listeners use Vue attrs. Styles accept Vue strings, objects and arrays. Priority is current theme aliases → Provider `flex.style` → native `style` → derived `flex`/non-preset `gap`. Changing appearance keeps the host and keyed children; changing `component` replaces its owned host normally. Empty roots stay mounted and retain their layout and native semantics.

### Ref

| Name | Type | Description |
|---|---|---|
| nativeElement | `HTMLElement \| null` | Actual single HTML host, including a Vue component's root; null before mount, after unmount or when no single HTML host exists |

Custom components own their slot/attrs forwarding. Flex exposes their actual HTML host rather than their component instance; Fragment, text-only and non-HTML roots have no `nativeElement`.

## Theme

Flex has no component tokens. Gap presets consume current `paddingXS` (small), `padding` (medium/middle) and `paddingLG` (large). The three alias variables are scoped on Flex when a ThemeContext is supplied, so ThemeProvider works without global CSS injection and nested default themes reset their own gaps. Native custom properties can override these aliases locally. Zero and fractional pixel gaps are supported.
