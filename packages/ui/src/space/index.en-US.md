---
category: Layout
title: Space
subtitle: Spacing
---

Space separates content. SpaceCompact joins adjacent controls, and SpaceAddon adds a custom cell.

## Examples

The [15 real demos](./demo) cover basic/vertical spacing, sizes, alignment, wrapping, separators, compact controls, horizontal/vertical button groups, nested groups, empty content, row gaps, semantic styles and Alias themes.

## API

### Space

| Property | Description | Type | Default |
| --- | --- | --- | --- |
| prefixCls | Complete DOM class prefix | `string` | ConfigProvider prefix + `-space` |
| size | Gap or `[horizontal, vertical]` gaps | `SpaceSize \| [SpaceSize, SpaceSize]` | Current `components.space.size`, then `'small'` |
| orientation | Layout direction; highest priority | `'horizontal' \| 'vertical'` | `'horizontal'` |
| vertical | Explicit false also overrides legacy direction | `boolean` | — |
| align | Horizontal default is center; vertical omission adds no alignment | `'start' \| 'end' \| 'center' \| 'baseline'` | Horizontal `'center'` |
| separator | Complete Vue content data, including numeric zero | `VNodeChild` | — |
| wrap | Enables flex wrapping; vertical wrapping needs a bounded height | `boolean` | `false` |
| classNames | root/item/separator classes; object or function receiving current `{ props }` | `SpaceSemanticValue<SpaceSemanticClassNames>` | — |
| styles | root/item/separator styles; object or function receiving current `{ props }` | `SpaceSemanticValue<SpaceSemanticStyles>` | — |
| ~~direction~~ | Deprecated; use orientation | `'horizontal' \| 'vertical'` | — |
| ~~split~~ | Deprecated; use separator data or #separator | `VNodeChild` | — |

`SpaceSize = 'small' | 'medium' | 'middle' | 'large' | number`. Presets use the paddingXS/padding/paddingLG Alias tokens. Numeric gaps use px. Zero is a valid zero gap and never falls back to the preset; NaN adds no gap.

| Slot | Description |
| --- | --- |
| default | Current content; each nonempty child has an item host |
| separator | Overrides separator/split data; an intentionally empty slot hides separators |

Slots are read during render and support conditional addition, replacement and removal. Priority is #separator → separator when not undefined → split. Null, booleans, empty strings and comments are empty; zero is content. Separators appear only between content items.

Arrays and Fragments flatten while preserving keyed Fragment scopes. String, number and Symbol keys, theme changes and class/prefix updates retain business child identity. Unkeyed children retain identity by position. A missing/empty child list produces no root. Empty placeholders within a nonempty list can retain the root without item hosts.

### SpaceCompact

| Property | Description | Type | Default |
| --- | --- | --- | --- |
| prefixCls | Complete DOM class prefix | `string` | Provider prefix + `-space-compact` |
| size | Size passed to child controls | `SizeType` | Current ConfigProvider.componentSize |
| orientation | Layout direction | `'horizontal' \| 'vertical'` | `'horizontal'` |
| vertical | Explicit boolean direction, below orientation | `boolean` | — |
| block | Fills the parent width | `boolean` | `false` |
| ~~direction~~ | Deprecated; use orientation | `'horizontal' \| 'vertical'` | — |

The default slot contains real compact controls; no child DOM wrapper is added. Null, booleans, comments and empty text do not occupy edge positions; zero remains content. Nested first/last boundaries are combined with the outer group. Controls consume compactSize, compactDirection, isFirstItem and isLastItem using their own prefix. Where size is supported, a local size wins over current compactSize, then the Provider size.

`useCompactItemContext(prefixCls, direction)` returns three ComputedRefs: compactSize, compactDirection and compactItemClassnames. Horizontal classes use `-compact-item/first-item/last-item`; vertical classes use `-compact-vertical-*`; RTL adds the corresponding item-rtl class. NoCompactStyle provides null to isolate its subtree; siblings remain unaffected and isolated controls use their own/Provider configuration.

### SpaceAddon

| Property | Description | Type | Default |
| --- | --- | --- | --- |
| prefixCls | Complete DOM class prefix | `string` | Provider prefix + `-space-addon` |
| variant | Cell appearance | `'outlined' \| 'filled' \| 'borderless' \| 'underlined'` | `'outlined'` |
| disabled | Decorative disabled cell state; child controls manage their own disabled state | `boolean` | `false` |
| status | Validation appearance | `'error' \| 'warning' \| 'success' \| 'validating' \| ''` | — |

The default slot accepts complete Vue content. Current compact size and boundaries control the cell. Outlined/filled horizontal/vertical/RTL groups retain outer corners; a singleton retains all four corners. Underlined has a transparent background, zero radius and only a bottom border using the current lineWidth/lineType. Borderless has no border. Error/warning text equally blends the existing colorErrorText/colorWarningText and current colorText Alias; outlined borders and underlined bottom borders retain status colors. Disabled text overrides status text while retaining the bottom border and status border color; filled + disabled restores the disabled background. Success/validating retain status classes without adding paint changes.

### Native attrs, refs and configuration

All three components route native class/style/listeners/data/ARIA attrs to their root div. Native style accepts Vue objects, strings and arrays. There are no business emits or v-models, and no implicit list/form roles. Actual buttons and inputs own interaction semantics.

Each ref exposes only `nativeElement: HTMLDivElement | null`. It is null before mounting and while Space/Compact have no content. Addon always has a root.

Configure Space with `ConfigProvider :components="{ space: { size, className, style, classNames, styles } }"`. Replacement/removal takes effect immediately. Classes concatenate. Style priority is Provider semantic → Provider root style → local semantic → native attrs. Semantic functions receive current merged size/orientation/align.

### Themes and exports

Space, Compact and Addon define no component tokens; prepareSpaceComponentToken returns `{}`. Existing Alias tokens control gaps, font, borders, radii and Addon paint. Current aliases support ConfigProvider, ThemeProvider, nested scopes and SSR. Root native style variables have the final priority.

```ts
import { Space, SpaceCompact, SpaceAddon } from '@apollo-design/ui';
import '@apollo-design/theme/tokens.css';
import '@apollo-design/ui/space/style.css';
```

Real Button/Input/Select controls also require their CSS; alternatively import `@apollo-design/ui/style.css`.

Static aliases Space.Compact/Space.Addon and separate ASpace/ASpaceCompact/ASpaceAddon install names remain. Public component/ref/size/config/semantic types and existing context/helper exports are retained.

prefixCls changes DOM names; arbitrary prefix CSS is not generated at runtime. `genSpaceStyle('brand')` creates static `.brand-space`, `.brand-space-compact` and `.brand-space-addon` rules. Provider prefixes should match pre-generated CSS. Default output uses apollo.

See the [migration record](../../../../docs/migrations/space-contracts.md) for behavior changes and prior syntax.
