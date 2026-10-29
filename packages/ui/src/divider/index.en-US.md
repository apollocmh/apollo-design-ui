---
category: Layout
title: Divider
subtitle: Divider
---

Separate sections or inline actions, with complete Vue title content, horizontal/vertical axes and current themes.

## Examples

Nine paired demos are in [demo](./demo): horizontal, with-text, size, plain, vertical, customize-style, component-token, variant and style-class. The title, component tokens and semantic styles include native controls.

## API

### Props

| Property | Description | Type | Default |
|---|---|---|---|
| prefixCls | Complete component class prefix | string | Current ConfigProvider; apollo-divider fallback |
| orientation | Axis; legacy title positions remain accepted with a warning | Orientation \| TitlePlacement | Effective horizontal |
| vertical | Vertical axis; explicit false overrides type | boolean | undefined when omitted |
| titlePlacement | Logical start/end, center, or physical left/right | 'start' \| 'end' \| 'center' \| 'left' \| 'right' | center |
| plain | Body typography for the title | boolean | false |
| variant | Line style; dotted takes precedence over the dashed boolean | 'solid' \| 'dashed' \| 'dotted' | solid |
| dashed | Dashed fallback, combinable with variant | boolean | false |
| size | Horizontal spacing; medium/middle are equivalent; ignored vertically | 'small' \| 'medium' \| 'middle' \| 'large' | Current componentSize |
| classNames | Semantic classes or a callback | DividerSemanticValue<DividerSemanticClassNames> | — |
| styles | Semantic styles or a callback | DividerSemanticValue<DividerSemanticStyles> | — |
| ~~type~~ | Legacy axis; use orientation | Orientation | — |
| ~~orientationMargin~~ | Length from the closest title edge at start/end; prefer styles.content.margin in new code | string \| number | — |

Orientation is horizontal / vertical; TitlePlacement contains the five title positions. Axis precedence is a valid orientation → explicit vertical → type → horizontal. Legacy orientation title values do not set the axis and emit a migration warning.

Physical left/right follow the current Provider direction or native root ltr/rtl dir; a native dir takes precedence. Small spacing uses marginXS, medium/middle use margin, and large retains standard spacing (marginLG for a plain rail, margin for a titled divider).

orientationMargin converts numbers and decimal numeric strings, including signs/fractions, to px. CSS unit strings and zero remain valid; center ignores this field. This prop is a length; the component token with the same name is a ratio from 0 to 1.

### Native attrs, events and ref

The single root is a div: separator without a title or in vertical mode, and group with a horizontal title. The empty start rail is a separator; the other rail is hidden decoration, so native title controls are not nested inside an interactive role. Vue class/style, id, ARIA and native listeners reach the current root; class accepts strings/arrays/objects and style accepts strings/objects/arrays. Native style has final priority. Vertical roots declare aria-orientation=vertical; horizontal roots use the separator default. Roles follow this actual content structure.

There are no business emits, v-model or internal keyboard commands. Slotted inputs, links and buttons retain native interaction and focus. nativeElement exposes the actual div, null before mount/after unmount.

### Content and semantics

The default slot is `() => VNodeChild`, including text, zero, arrays/Fragments and elements. Conditional slot insertion/removal updates the title immediately; an intentionally empty slot still represents a title. Vertical mode ignores title content with a warning.

Semantic areas are root, rail and content. Rail targets the root without a title and the two rails with a horizontal title. Classes concatenate. Style order is Provider styles → Provider style(root) → local styles → native root style. Callbacks receive `{ props }` with current effective orientation, titlePlacement and size.

ConfigProvider divider / components.divider provides className, style, classNames and styles defaults. Local size wins over current componentSize. Replacing or clearing configuration does not require remounting.

### Component tokens and themes

| Token | Default | Meaning |
|---|---|---|
| textPaddingInline | 1em | Horizontal title padding; numeric lengths use px |
| orientationMargin | 0.05 | Closest rail fraction; finite number from 0 to 1 |
| verticalMarginInline | Current marginXS | Horizontal margin of a vertical rail; numeric lengths use px |

```vue
<ConfigProvider :theme="{ components: { Divider: { textPaddingInline: 12, orientationMargin: 0.2, verticalMarginInline: 16 } } }">
  <Divider title-placement="start">Section</Divider>
  <Divider orientation="vertical" />
</ConfigProvider>
```

All three update and reset dynamically. Empty/nonfinite values use their own defaults; padding rejects negative numbers and margin accepts negative lengths. The nearest active ThemeProvider/ConfigProvider is consumed. ThemeProvider works without global CSS injection; an explicit empty ThemeProvider resets defaults. An empty ConfigProvider theme inherits its outer source; use inherit: false to reset it. Without a theme source, consumer CSS inheritance is retained. Default, dark, compact and nested scopes are supported.

### Exports and styles

The root exports Divider, DividerProps, DividerRef, DividerConfig, DividerSize, DividerVariant, Orientation, TitlePlacement, semantic types and DividerSlot. `@apollo-design/ui/divider` additionally provides default, DividerComponentToken, genDividerStyle and prepareDividerComponentToken. The installation name is ADivider.

```ts
import '@apollo-design/theme/tokens.css';
import '@apollo-design/ui/divider/style.css';
// Full stylesheet: @apollo-design/ui/style.css
```

Static CSS covers apollo by default. Pre-generate/load CSS for another namespace: genDividerStyle('my-app') corresponds to ConfigProvider prefixCls=my-app or Divider prefixCls=my-app-divider. The generator takes a namespace, while the component prop takes a complete prefix; selectors are not generated at runtime.
