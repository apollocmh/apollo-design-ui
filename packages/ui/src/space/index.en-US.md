---
category: Layout
title: Space
subtitle: Spacing
---

Set the spacing between components.

## When To Use

- Avoid components sticking together; keep the spacing consistent.
- Suitable for horizontal spacing between inline elements.
- Supports various horizontal alignments.
- Use `Space.Compact` when form components need to be joined tightly with merged borders.

## Examples

See [`demo/`](./demo) (15 demos, one-to-one with antd's **user-facing** demos).

| demo | What it shows |
|---|---|
| `base` | Basic usage: default spacing between three buttons |
| `vertical` | Vertical spacing: `orientation="vertical"` + three cards |
| `size` | Gap sizes `small` / `medium` / `large` and the number `24` |
| `align` | Alignment `center` / `start` / `end` / `baseline` |
| `wrap` | Auto wrapping + the row gap of `size={[8, 16]}` |
| `separator` | Separator: a plain string and a (vertical) `Divider` |
| `compact` | Compact layout: `block`, two inputs, input + button |
| `compact-buttons` | Compact button group |
| `compact-button-vertical` | Vertical compact button group |
| `compact-nested` | Nested compact layout (first/last item needs a cross-level conjunction) |
| `compact-debug` | Compact layout debugging (falsy children and where `compactSize` lands) |
| `debug` | Index semantics of falsy children (`null` / `false` / `0`) |
| `gap-in-line` | The row gap when wrapping |
| `style-class` | Semantic `classNames` / `styles` |
| `component-token` | Component Token (⚠️ upstream has no token at all, see "Design notes") |

## API

### Space

#### Props

| Property | Description | Type | Default |
|---|---|---|---|
| prefixCls | Class name prefix | `string` | From ConfigProvider, falling back to `apollo-space` |
| size | Gap size. A preset string becomes a class name, a number becomes an inline `gap`; an array is read as `[horizontal, vertical]` | `SpaceSize \| [SpaceSize, SpaceSize]` | From ConfigProvider `space.size`, falling back to `'small'` |
| orientation | Direction. Highest priority | `'horizontal' \| 'vertical'` | `'horizontal'` |
| vertical | Whether it is vertical. `orientation` takes precedence when both are set | `boolean` | — |
| align | Alignment. ⚠️ When vertical, omitting it does **not** fall back to `center` | `'start' \| 'end' \| 'center' \| 'baseline'` | `'center'` when horizontal, — when vertical |
| separator | Sets the separator | `VNodeChild` | — |
| wrap | Whether to wrap automatically. Only effective when horizontal | `boolean` | `false` |
| className | Class name of the root element | `string` | — |
| rootClassName | Also applied to the root element (after `className`) | `string` | — |
| style | Inline style of the root element. **Overrides `styles.root`** | `CSSProperties` | — |
| classNames | Semantic class names | `SpaceSemanticValue<SpaceSemanticClassNames>` | — |
| styles | Semantic inline styles | `SpaceSemanticValue<SpaceSemanticStyles>` | — |
| ~~direction~~ | ⚠️ Deprecated, use `orientation` | `'horizontal' \| 'vertical'` | — |
| ~~split~~ | ⚠️ Deprecated, use `separator` | `VNodeChild` | — |

`SpaceSize` = `SizeType | number`, `SizeType` = `'small' | 'middle' | 'medium' | 'large'`.

⚠️ The two rules for `size` are **different**:

| Input | Result |
|---|---|
| Preset string | Class names `-gap-row-{size}` / `-gap-col-{size}`; the value comes from CSS variables |
| Non-zero number | Inline `row-gap` / `column-gap` (**`px` is appended automatically**) |
| `0` / `NaN` / numeric string | **Nothing is added** (`isValidGapNumber`'s truthiness short-circuit excludes `0`) |

#### Slots

| Name | Description |
|---|---|
| default | The content to space out. Every child is wrapped in an `-item` |

⚠️ Non-renderable children (`null` / `undefined` / empty string / comment node) get **no `-item`
wrapper at all**; but a **component that itself renders `null`** (e.g. `<Null/>`) *is* renderable
⇒ it gets an empty `-item`, hidden by CSS `:empty{display:none}`.

#### Semantic slots

`classNames` / `styles` each have three slots: `root` / `item` / `separator`.

Merge priority (low → high):

```
ConfigProvider.space.classNames/styles
  → component classNames / styles
  → native root class / style attrs
```

**`style` overrides `styles.root`** (this is antd's merge order, mirrored verbatim).

#### ref

| Name | Description |
|---|---|
| nativeElement | The root `div`. `null` before the first render; the root element is **not rendered** when there are no children, so it is `null` then too |

### Space.Compact

Joins form components tightly and merges their borders.

#### Props

| Property | Description | Type | Default |
|---|---|---|---|
| prefixCls | Class name prefix. ⚠️ The suffix is `space-compact` | `string` | From ConfigProvider, falling back to `apollo-space-compact` |
| size | Size of the child components. Takes precedence over ConfigProvider's `componentSize` | `SizeType` | From ConfigProvider `componentSize` |
| orientation | Direction. Highest priority | `'horizontal' \| 'vertical'` | `'horizontal'` |
| vertical | Whether it is vertical. `orientation` takes precedence when both are set | `boolean` | — |
| block | Stretch to the width of the parent | `boolean` | `false` |
| className | Class name of the root element | `string` | — |
| rootClassName | Also applied to the root element (after `className`) | `string` | — |
| style | Inline style of the root element | `CSSProperties` | — |
| ~~direction~~ | ⚠️ Deprecated, use `orientation` | `'horizontal' \| 'vertical'` | — |

#### Slots

| Name | Description |
|---|---|
| default | The form components to join. ⚠️ Compact does **not** wrap its children, it only broadcasts the context |

⚠️ Unlike `Space`, Compact **discards** falsy children (they do not take up an index).

#### ref

| Name | Description |
|---|---|
| nativeElement | The root `div`. `null` before the first render; the root element is not rendered when there are no children |

#### Cross-component protocol

Compact does not build class names itself — it broadcasts four values to its children, and each
**child** builds the class names with **its own prefix**:

```ts
import { useCompactItemContext } from '@apollo-design/ui';

const { compactSize, compactDirection, compactItemClassnames } = useCompactItemContext(
  prefixCls,   // your own prefix, e.g. 'apollo-btn'
  direction,   // text direction; under 'rtl' one extra -item-rtl
);
// compactItemClassnames: ComputedRef<string>
// → 'apollo-btn-compact-item apollo-btn-compact-first-item'
```

| Return value | Type | Description |
|---|---|---|
| compactSize | `ComputedRef<SizeType \| undefined>` | The size the child should adopt |
| compactDirection | `ComputedRef<'horizontal' \| 'vertical' \| undefined>` | The compact direction. Under `vertical` the class names gain an extra hyphen pair |
| compactItemClassnames | `ComputedRef<string>` | The assembled class name string (empty means "not inside a Compact") |

Class name order: `-compact-item` → `-compact-first-item`? → `-compact-last-item`? →
`-compact-item-rtl`?. ⚠️ Under `vertical` they become `-compact-vertical-item` /
`-compact-vertical-first-item`.

Content inside overlays (Modal / Drawer / Tooltip / Dropdown) is part of the Compact tree of the
downstream component, but visually it is not part of the compact group — use `NoCompactStyle` to
reset the context to `null`.

### Space.Addon

A custom cell inside a compact layout (available since antd@5.29.0).

#### Props

| Property | Description | Type | Default |
|---|---|---|---|
| prefixCls | Class name prefix. ⚠️ The suffix is `space-addon` | `string` | From ConfigProvider, falling back to `apollo-space-addon` |
| variant | Visual variant | `'outlined' \| 'filled' \| 'borderless' \| 'underlined'` | `'outlined'` |
| status | Validation status | `'error' \| 'warning' \| 'success' \| 'validating' \| ''` | — |
| disabled | Disabled state. ⚠️ Only changes the color, it does **not** set the `disabled` attribute | `boolean` | `false` |
| className | Class name of the root element | `string` | — |
| style | Inline style of the root element | `CSSProperties` | — |

#### Slots

| Name | Description |
|---|---|
| default | The content of the cell |

#### ref

| Name | Description |
|---|---|
| nativeElement | The root `div` |

### Type exports

`SpaceProps`, `SpaceRef`, `SpaceSize`, `SpaceAlign`, `SpaceSlot`, `SpaceConfig`,
`SpaceSemanticType`, `SpaceSemanticAllType`, `SpaceSemanticClassNames`,
`SpaceSemanticStyles`, `SpaceSemanticValue`, `SpaceCompactProps`, `SpaceCompactRef`,
`SpaceCompactItemContextType`, `SpaceAddonProps`, `SpaceAddonRef`,
`SpaceComponentToken`, `InputStatus`.

### Utility exports

| Name | Description |
|---|---|
| `genSpaceStyle(prefixCls)` | Generates the CSS text for that prefix (for custom `prefixCls`) |
| `prepareSpaceComponentToken(token)` | Computes the component token defaults (identical to antd's `prepareComponentToken`: it returns `{}`) |
| `useCompactItemContext(prefixCls, direction)` | The compact item context (see above) |
| `NoCompactStyle` | Isolates a subtree from the compact context |
| `useOrientation(orientation, vertical, legacyDirection)` | Merges the direction, returning `ComputedRef<[Orientation, boolean]>` |
| `isValidOrientation(value)` | Whether the value is a valid direction |
| `isPresetSize(size)` / `isValidGapNumber(size)` | The two rules for `size` |
| `getStatusClassNames(prefixCls, status, hasFeedback?)` | Status → class names |

## Design notes

### Orientation priority

`orientation` > `vertical` > `direction`, falling back to `horizontal` when none is given.

⚠️ The check for `vertical` is `typeof vertical === 'boolean'`, **not a truthiness check** — so
"not passed" and "explicitly `false`" are two different branches: an explicit `false` overrides
`direction`.

### The default of `align`

When horizontal, an omitted `align` folds into `center`; **when vertical, an omitted `align` stays
`undefined`** (no `-align-*` class name is produced). The check is `align === undefined`, not a
truthiness check.

### `separator` and `split`

`separator` wins; `split` is only used when it is not passed (the check is `??`, so passing `''`
does **not** fall back). Whether the separator is **rendered** is a truthiness check, though ⇒ both
`separator=""` and `separator={0}` are **not rendered**.

⚠️ That last point is a **behavioral difference** from antd (we render one extra empty
`-item-separator` span). It is registered as a defect difference in `COMPATIBILITY.md` §9.2; see
[`README.md`](./README.md) §6.

### Child indices

`latestIndex` only counts children that "have content", and the `reduce` seed is `0` ⇒ no separator
is produced when everything is empty. `Space` uses `keepEmpty` to preserve the **index** of falsy
children (aligning with React's `traverseAllChildren`), while `Compact` discards them outright.

### Component tokens

| Token | Default | Description |
|---|---|---|
| — | — | ⚠️ **Space / Compact / Addon have no Component Token at all** |

All three `ComponentToken`s in antd 6.6.4 are **empty interfaces** and `prepareComponentToken`
returns `{}`:

```ts
// biome-ignore lint/suspicious/noEmptyInterface: ComponentToken need to be empty by default
export interface ComponentToken {}
export const prepareComponentToken: GetDefaultToken<'Space'> = () => ({});
```

So `theme.components.Space` **cannot override anything upstream either** — this is not a gap of
this repository.

`spaceGapSmallSize` / `spaceGapMiddleSize` / `spaceGapLargeSize` are **internal** tokens (derived
by `mergeToken` from `paddingXS` / `padding` / `paddingLG`); users cannot override them. They only
determine the values of the six `-gap-*` rules. To change how the presets look, change the
corresponding Alias token (`--apollo-padding-xs` / `--apollo-padding` / `--apollo-padding-lg`).

### Importing styles

```ts
import '@apollo-design/theme/tokens.css';     // theme variables first
import '@apollo-design/ui/style.css';         // all component styles
```

⚠️ Importing `@apollo-design/ui/space/style.css` on demand is **not available yet** —
`dist/space/style.css` is indeed produced by the build, but `packages/ui/package.json`'s `exports`
does not expose that subpath yet (verified: `ERR_PACKAGE_PATH_NOT_EXPORTED`). Until it is added,
import the aggregated `style.css`.

For a custom `prefixCls` (e.g. `my-app`), generate the CSS yourself with `genSpaceStyle('my-app')` —
the static output only covers the `apollo` and `ant` prefixes.
