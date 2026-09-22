---
category: Data Display
title: Statistic
subtitle: 统计数值
---

Display statistic values.

## When To Use

- When a number (statistic, balance, countdown, etc.) needs to be highlighted.

## Examples

See [`demo/`](./demo) (6, one-to-one with antd non-debug demos).

## API

| Prop | Description | Type | Default |
|---|---|---|---|
| value | The value | `number \| string` | `0` |
| title | Title (prop or `#title` slot) | `VNodeChild` | — |
| prefix | Prefix (prop or `#prefix` slot) | `VNodeChild` | — |
| suffix | Suffix (prop or `#suffix` slot) | `VNodeChild` | — |
| precision | Decimal digits (negative means no decimals) | `number` | — |
| decimalSeparator | Decimal separator | `string` | `'.'` |
| groupSeparator | Group separator | `string` | `','` |
| formatter | Custom formatter (only function form is consumed) | `(value, config?) => VNodeChild` | — |
| loading | Show skeleton | `boolean` | `false` |
| valueStyle | **@deprecated** Use `styles.content` | `CSSProperties` | — |
| valueRender | Wrap the value node | `(node: VNode) => VNodeChild` | — |
| classNames / styles | Semantic slots (root / header / title / content / value / prefix / suffix), object or function | — | — |
| onMouseenter / onMouseleave | Root element mouse events | `(e: MouseEvent) => void` | — |

### Statistic.Timer

| Prop | Description | Type | Default |
|---|---|---|---|
| type | Timer direction | `'countdown' \| 'countup'` | — |
| format | Display format (`[...]` escape, `X+` zero-padding) | `string` | `'HH:mm:ss'` |
| value | Target time (future for countdown, past for countup) | `number \| string` | `0` |
| onFinish | Countdown finished callback (countdown only, fires once) | `() => void` | — |
| onChange | Per-tick callback (arg is the time diff) | `(value?) => void` | — |

### Statistic.Countdown

> @deprecated Use `<Statistic.Timer type="countdown" />`.

## Ref

| Name | Type |
|---|---|
| nativeElement | `HTMLDivElement \| null` |

## Theme (Component Token)

| Token | Description | Default |
|---|---|---|
| titleFontSize | Title font size | `fontSize` (14) |
| contentFontSize | Value font size | `fontSizeHeading3` (30) |
