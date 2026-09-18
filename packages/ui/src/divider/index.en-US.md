---
category: Layout
title: Divider
subtitle: Divider
---

A divider line separates different content.

## When To Use

- Divide sections of an article.
- Divide inline text and links such as the operation column of a table.

## Examples

See [`demo/`](./demo) (9 demos, one-to-one with antd's **user-facing** demos).

| demo | What it shows |
|---|---|
| `horizontal` | Horizontal divider (including `dashed`) |
| `with-text` | Divider with title: `titlePlacement` + `styles.content.margin` |
| `size` | Spacing size: `small` / `medium` / `large` |
| `plain` | Title in plain (body) style |
| `vertical` | Vertical divider (both `orientation` and `vertical` paths) |
| `customize-style` | Overriding the border via `style` |
| `component-token` | Component Token (⚠️ contains a known gap, see "Design notes") |
| `variant` | Line variant: `solid` / `dashed` / `dotted` |
| `style-class` | Semantic `classNames` / `styles` |

## API

### Props

| Property | Description | Type | Default |
|---|---|---|---|
| prefixCls | Class name prefix | `string` | From ConfigProvider, falling back to `apollo-divider` |
| orientation | Divider direction | `'horizontal' \| 'vertical'` | `'horizontal'` |
| vertical | Whether it is vertical. `orientation` takes precedence when both are set | `boolean` | `false` |
| titlePlacement | Position of the title | `'start' \| 'end' \| 'center'` | `'center'` |
| plain | Whether the title uses body text style | `boolean` | `false` |
| variant | Line variant | `'dashed' \| 'dotted' \| 'solid'` | `'solid'` |
| dashed | Whether the line is dashed. Equivalent to `variant="dashed"`, but the two **can be combined** | `boolean` | `false` |
| size | Spacing size, **only valid for horizontal layout** | `'small' \| 'medium' \| 'middle' \| 'large'` | — |
| className | Class name of the root element | `string` | — |
| rootClassName | Also applied to the root element (after `className`) | `string` | — |
| style | Inline style of the root element. **Overrides `styles.root`** | `CSSProperties` | — |
| classNames | Semantic class names | `DividerSemanticClassNames \| ((info: { props }) => DividerSemanticClassNames)` | — |
| styles | Semantic inline styles | `DividerSemanticStyles \| ((info: { props }) => DividerSemanticStyles)` | — |
| ~~type~~ | ⚠️ Deprecated, use `orientation` | `'horizontal' \| 'vertical'` | — |
| ~~orientationMargin~~ | ⚠️ Deprecated, use `styles.content.margin`. Distance between the title and its closest border; a unitless numeric string is treated as px | `string \| number` | — |

### Slots

| Name | Description |
|---|---|
| default | The title in the middle of the divider. ⚠️ **Not rendered** in vertical mode (a dev-time warning is emitted, matching antd) |

### Semantic slots

`classNames` / `styles` each have three slots: `root` / `rail` / `content`.

Merge priority (low → high):

```
ConfigProvider.divider.classNames/styles
  → component classNames / styles
  → className / rootClassName / style (applied to the root element)
```

**`style` overrides `styles.root`** (this is antd's merge order, mirrored verbatim).

⚠️ The `rail` slot lands on the **root element** when there is no default slot, and on the two
rail child elements when there is — this is upstream behavior, not a typo.

### Type exports

`DividerProps`, `DividerRef`, `DividerConfig`, `DividerSize`, `DividerVariant`,
`Orientation`, `TitlePlacement`, `DividerSemanticType`, `DividerSemanticAllType`,
`DividerSemanticClassNames`, `DividerSemanticStyles`, `DividerSemanticValue`,
`DividerSlot`, `DividerComponentToken`.

### ref

| Name | Description |
|---|---|
| nativeElement | The root `div`. `null` before the first render |

### Utility exports

| Name | Description |
|---|---|
| `genDividerStyle(prefixCls)` | Generates the CSS text for that prefix (for custom `prefixCls`) |
| `prepareDividerComponentToken(token)` | Computes the component token defaults (identical to antd's `prepareComponentToken`) |

## Design notes

### Orientation priority

`orientation` > `vertical` > `type`, falling back to `horizontal` when none is given.

⚠️ The check for `vertical` is `typeof vertical === 'boolean'`, **not a truthiness check** —
so "not passed" and "explicitly `false`" are two different branches: an explicit `false`
overrides `type`.

Also note that in v6 `orientation` **serves two purposes**: `horizontal` / `vertical` mean the
direction, while `left` / `right` / `center` / `start` / `end` are treated as the **legacy title
placement** and emit a warning.

### Title placement

`titlePlacement` wins; when it is not passed, `orientation` is used if it holds a valid placement
value, otherwise `center`. `left` / `right` are then folded into `start` / `end` according to the
text direction (swapped under RTL).

### `orientationMargin` and units

`orientationMargin` accepts a number or a string:

| Input | Result |
|---|---|
| `20` | `20px` |
| `'10'` | `10px` (a purely numeric string is treated as a number) |
| `'2em'` | `2em` (kept as-is) |
| `0` | `0` (the numeric `0` does **not** get a unit, matching React) |

It only takes effect when `titlePlacement` is `start` / `end`.

### Component tokens

| Token | Default | Description |
|---|---|---|
| `verticalMarginInline` | `token.marginXS` | Horizontal margin of the vertical divider |
| `textPaddingInline` | `'1em'` | Horizontal padding of the text |
| `orientationMargin` | `0.05` | Distance between the text and the edge, 0 ～ 1 |

⚠️ **Known gap**: antd lets you override these three tokens via `theme.components.Divider`.
In this repository only `verticalMarginInline` is currently overridable (it derives from an alias
token and is emitted as `var(--apollo-margin-xs)`). The other two are **literal** tokens that get
inlined as constants with no corresponding CSS variable, because `packages/theme`'s `tokens.css`
only declares alias-layer variables. This is a library-wide pipeline gap — see
[`README.md`](./README.md) §5.3 and §9.

Equivalent workarounds in the meantime: use `styles.content.padding` for the effect of
`textPaddingInline`, and `styles.content.margin` for the effect of `orientationMargin`.

### Importing styles

```ts
import '@apollo-design/theme/tokens.css';     // theme variables first
import '@apollo-design/ui/divider/style.css'; // per component
// or
import '@apollo-design/ui/style.css';         // all components
```

For a custom `prefixCls` (e.g. `my-app`), generate the CSS yourself with
`genDividerStyle('my-app')` — the static output only covers the `apollo` and `ant` prefixes.
