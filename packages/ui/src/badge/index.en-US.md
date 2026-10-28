---
category: Data Display
title: Badge
subtitle: Badge
---

A small status descriptor for UI elements.

## When To Use

- Displayed at the top-right of icons or avatars to indicate messages or items needing attention.
- The count can be a number, text, or a red dot.

## Examples

See [`demo/`](./demo) (13 demos, including numeric counts and rich template content).

## API

### Badge

| Prop | Description | Type | Default |
|---|---|---|---|
| prefixCls | DOM prefix; custom prefixes need author-provided CSS | `string` | `apollo-badge` |
| scrollNumberPrefixCls | Digit track prefix | `string` | `apollo-scroll-number` |
| count | Number to display (`null` hides; overflow shows `+`) | `VNodeChild` | `null` |
| overflowCount | Max count | `number` | `99` |
| dot | Show a dot, overriding count including zero | `boolean` | `false` |
| showZero | Show when value is 0 | `boolean` | `false` |
| size | Size (`default` deprecated, equals `medium`) | `'medium' \| 'small'` | `'medium'` |
| status | Status dot | `'success' \| 'processing' \| 'error' \| 'default' \| 'warning'` | — |
| color | Custom color | `string` | — |
| text | Status text | `VNodeChild` | — |
| title | Native title (`null`/`false` disables; falls back to count) | `string \| null \| false` | — |
| offset | Offset `[x, y]` | `[number \| string, number \| string]` | — |
| classNames / styles | Root and indicator semantics; object or props function | — | — |

Native Vue class/style, id, ARIA, tabindex and listeners belong to the root span. Style accepts objects, strings and arrays; use styles.indicator for the indicator. Badge declares no business emits or v-model. Changing status/count retains the root and its focus. Independent text=0 does not hide a nonzero count. Explicit title also applies to standalone status indicators; null/false disables it.

Non-scalar counts (VNode, arrays, Fragments, text nodes and multiple-root components) share a native indicator and complete rendering with #count. Business nodes retain their attributes and identity; semantic styles/classes, title and offset belong to the indicator. Vue-empty counts create no empty badge and do not hide independent captions. An empty conditional component hides its host without remounting the business instance.

### Badge Slots

| Slot | Description |
| --- | --- |
| default | Content wrapped by the badge |
| count | Static rich indicator; overrides the count prop without overflow or digit rolling |
| text | Rich status text; overrides the text prop |

Slot presence determines precedence, including empty results. Removing a conditional slot restores its prop. Text `0` in #count is static content; showZero and overflowCount apply to numeric props. Dot mode overrides both count channels. Rich indicators retain indicator styles, offset and their previous visible content while leaving. VNodes do not generate an automatic title. Use the count prop for digit animation.

### Badge.Ribbon

| Prop | Description | Type | Default |
|---|---|---|---|
| prefixCls | DOM prefix | `string` | `apollo-ribbon` |
| className | Existing independent indicator class; use native class for the wrapper | `string` | — |
| text | Ribbon text | `VNodeChild` | — |
| color | Color | `string` | — |
| placement | Placement corner | `'start' \| 'end'` | `'end'` |
| classNames / styles | Root, indicator and content semantics; object or props function | — | — |

Ribbon default wraps business content. Its #text accepts complete content, with presence taking priority even when empty; removing the slot restores the text prop. VNodeChild arrays, Fragments and zero render normally. Native attrs/class/style belong to the wrapper; styles.indicator/content target the ribbon and its text.

### Expose and current configuration

BadgeRef and RibbonRef expose readonly nativeElement: HTMLElement|null, pointing to the actual current root and clearing on unmount. ConfigProvider.components.badge/ribbon, direction and prefix remain reactive, including replacing/removing semantic objects or functions. Provider style is a separate configuration field: Badge standalone status targets root, other Badge modes target indicator; Ribbon targets indicator. Use semantic styles for an explicit region.

## Theme

### Component Token

9 tokens: `indicatorZIndex`, `indicatorHeight`, `indicatorHeightSM`, `dotSize`,
`textFontSize`, `textFontSizeSM`, `textFontWeight`, `statusSize`, `paddingInline`.

Values derive from current aliases and consume theme.components.Badge, including applicable zero values, replacement and removal. Explicit root CSS variables win. textFontSize/textFontSizeSM/textFontWeight apply to counts. Small digit tracks use the actual small height. Reduced-motion disables ripple, digit transitions and enter/leave motion.

Opaque count/ribbon backgrounds select readable foregrounds while preserving preset backgrounds. Explicit semantic text colors win; authors pair foregrounds with custom gradients, alpha backgrounds or complete style overrides. Extra animation digits are hidden from accessibility; no live region is created automatically. Negative integers keep their sign. Numeric offsets use px, while CSS lengths, percentages and expressions retain their units.

See the [development migration](../../../../docs/migrations/badge-contracts.md) for native root style, complete content and reference fixes. Original reference HTML/PNGs remain evidence, not the specification of Vue usage.
