---
category: Data Display
title: Empty
---

A placeholder for an empty data region. Use the footer slot for actions such as creating the first item.

## When To Use

- Explain an empty list, table, or business region.
- Supply complete image, description, and footer content through native Vue slots.

## Examples

Six demos cover default/simple illustrations, complete custom content, current Provider settings, conditional descriptions, and all four semantic regions.

## API

### Props

| Property | Description | Type | Default |
|---|---|---|---|
| prefixCls | Full component prefix | `string` | `apollo-empty`, follows ConfigProvider |
| image | A top-level string is an image URL; accepts components, VNodes, arrays and numbers. Only undefined falls back; null, booleans and empty content hide the image host | `EmptyImage` | Provider image or `PRESENTED_IMAGE_DEFAULT` |
| imageStyle | Existing deprecated field: use styles.image. Both merge, with styles.image taking priority | `CSSProperties` | — |
| description | Complete Vue content; only undefined uses the current locale. Empty content hides its host, while numeric 0 remains | `VNodeChild` | Current locale Empty.description |
| classNames | Classes for four semantic regions; factories receive current local props | `EmptySemanticValue<EmptySemanticClassNames>` | — |
| styles | Styles for four semantic regions; factories receive current local props | `EmptySemanticValue<EmptySemanticStyles>` | — |

The native root accepts Vue class/style/dir, data/ARIA attributes and native event listeners. Native style supports strings, objects and arrays, and overrides styles.root. There are no business emits or v-model bindings.

### Slots

| Name | Description |
|---|---|
| image | Complete image content, overriding image and Provider defaults; custom content uses its natural height |
| description | Complete description, overriding the prop and locale fallback |
| default | Complete footer content, including multiple business controls |

Each slot is evaluated once during the current render. A present slot takes priority even when intentionally empty. Empty arrays, comments, booleans and empty Fragments create no spacing host. Business descendants retain their own attributes, editing state and focus.

### Provider and semantic regions

`ConfigProvider :components="{ empty }"` accepts a named `EmptyConfig` with image, className, style, classNames and styles. Configuration updates and removal remain reactive. Provider semantic settings use objects.

The four regions are root, image, description and footer. Classes merge from Provider to local semantic classes and native root class. Root style priority is:

```
Provider styles.root → Provider style → local styles.root → native root style
```

Local semantic styles override Provider styles for other regions. The legacy imageStyle has lower priority than styles.image. Fixed media height and opacity apply to built-in illustrations and URL images; complete custom content retains its layout and colors. Current Provider direction applies unless overridden by native dir.

### Static values, types and ref

`Empty.PRESENTED_IMAGE_DEFAULT` and `Empty.PRESENTED_IMAGE_SIMPLE` are also named exports. Root and `@apollo-design/ui/empty` imports share their identity. These reusable component definitions render normally through Vue. The actual simple component or its VNode enables normal mode; lookalike custom artwork does not.

Exported types: EmptyProps, EmptySlots, EmptyImage, EmptyRef, EmptyConfig, EmptySemanticClassNames, EmptySemanticStyles, EmptySemanticValue, EmptySemanticType, EmptySemanticAllType.

| Expose | Type | Description |
|---|---|---|
| nativeElement | `HTMLDivElement \| null` | Actual root div; null before mount and after unmount |

URL image alt uses a string description, otherwise the current localized empty-state description. Built-in illustration titles update with the locale and retain accessible names in image-only states.

### Theme and CSS

Empty has no Component Token. Layout uses existing Alias Tokens. Illustration palettes derive from the current theme at runtime; generated geometry and source attribution are preserved. Default description text uses colorTextSecondary.

```ts
import '@apollo-design/theme/tokens.css';
import '@apollo-design/ui/empty/style.css';
// Or import '@apollo-design/ui/style.css';
```

Static CSS includes the apollo root prefix. For a custom root prefix my-app, set ConfigProvider prefix-cls to my-app and load CSS from `genComponentCss('empty', 'my-app')`. A direct component prefixCls receives the full value, such as my-app-empty.
