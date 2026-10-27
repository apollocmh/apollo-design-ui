---
category: Data Display
title: Tag
---

Label attributes and categories. Use CheckableTag or CheckableTagGroup for selection.

## Examples

All twelve [demos](./demo) are retained: basic links/closing, selection, colours, dynamic input, customization, disabled state, dragging, icons, status, semantic styles, close/reset and component tokens.

## API

### Tag

| Prop | Description | Type | Default |
|---|---|---|---|
| prefixCls | DOM class prefix; custom prefixes require matching static CSS | `string` | `apollo-tag` |
| color | Thirteen presets, success/processing/error/warning/default, or a valid CSS colour | `TagColor` | — |
| variant | Appearance | `'filled' \| 'solid' \| 'outlined'` | `filled` |
| bordered | Existing deprecated field; false selects filled. Use variant | `boolean` | — |
| closable | Close switch/configuration: closeIcon, disabled, aria-* and data-* | `boolean \| TagClosableConfig \| null` | `false` |
| href / target | Inner link URL / target | `string` | — |
| disabled | Disable link and close; omission uses the global disabled setting | `boolean` | `false` |
| classNames / styles | Four regions: root, icon, content and close | `TagSemanticClassNames / TagSemanticStyles` | — |

| Slot | Content |
|---|---|
| default | Complete label content |
| icon | Complete leading content |
| closeIcon | Complete close content; a present slot wins over configuration, including intentionally empty content |

`close` emits the native MouseEvent. `preventDefault()` cancels hiding; close clicks stop propagation outside the label. The root is a stable span with owned semantic hosts. href creates an anchor inside content; the native close button is its sibling. Caller glyph attributes and handlers remain intact. Close owns Enter/Space keydown propagation while preserving native activation, so ancestor selection widgets do not process the same key. Closing retains DOM with the `-hidden` class; a parent may unmount/remount to reset visibility.

### CheckableTag

| Prop | Description | Type | Default |
|---|---|---|---|
| prefixCls | Tag prefix | `string` | `apollo-tag` |
| checked | Controlled state, supports `v-model:checked`; omission is uncontrolled | `boolean` | `false` |
| disabled | Disable selection | `boolean` | `false` |

Slots: default and icon, with complete content. Events: `update:checked(boolean)`, `change(boolean)`, `click(MouseEvent)` and `keydown(KeyboardEvent)`. Click/Space updates once. Enter does not toggle; repeated Space does not repeat updates. Native `preventDefault()` cancels toggling. The component owns checkbox role, aria-checked and disabled tabindex.

### CheckableTagGroup

| Prop | Description | Type | Default |
|---|---|---|---|
| id / prefixCls | Root id / tag prefix; group appends -checkable-group | `string` | — / `apollo-tag` |
| options | Values or option objects; omitted label displays value | `(T \| CheckableTagOption<T>)[]`, T is string/number | `[]` |
| value | Controlled model, supports `v-model:value` | Single `T \| null`; multiple `T[]` | — |
| defaultValue | Initial uncontrolled value, read at mount | Same as value | Single null; multiple [] |
| multiple | Multiple selection | `boolean` | `false` |
| disabled | Disable all options | `boolean` | `false` |
| classNames / styles | root/item only; option style wins over styles.item | `GroupSemanticClassNames / GroupSemanticStyles` | — |

Options contain value, optional label (VNodeChild data), className and style. Group has no public slots. Events: `update:value(value)` and `change(value)`, typed by multiple and emitted once per interaction. Current options/multiple/value update rendering; mode changes do not rewrite the parent model, and the next interaction emits the current mode's shape. Selecting an already selected single item clears it to null. Zero and empty strings are valid values.

## Expose, attrs and Provider

All three expose `nativeElement`: the root span for Tag/CheckableTag and div for Group. Tag.CheckableTag and Tag.CheckableTagGroup retain identity with the named exports. Root class/style/id/data/listeners follow Vue merging, including string/array/object styles; native root style wins over semantic styles. Use Vue `@keydown` for keyboard events.

For linked tags, rel/download/hreflang/referrerpolicy/tabindex/accesskey, aria-label/labelledby/describedby and focus/blur listeners land on the actual anchor; other attrs land on the root. Current Provider direction, disabled and components.tag styles remain reactive. Tag also consumes variant/closable/closeIcon/classNames/styles; selection components do not consume Tag closing/variant configuration. Explicit local fields override Provider values and removal restores current configuration.

## Theme

| Component token | Default source | Purpose |
|---|---|---|
| defaultBg | colorFillTertiary composited over colorBgContainer | Default surface |
| defaultColor | colorText | Default text |
| solidTextColor | Black/white chosen from the actual solid surface | Solid text; explicit configuration retains caller control |

Configure through ConfigProvider.theme.components.Tag; replacement/removal is reactive. Filled/outlined preset/status/custom text adapts lightness to the current theme. Solid and selection states choose text against their actual surface. Pair explicit foreground overrides with a suitable background. See the [development migration](../../../../docs/migrations/tag-contracts.md) for changes and validation status.
