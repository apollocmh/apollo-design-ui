---
category: Data Display
title: Descriptions
subtitle: Description list
---

Display grouped read-only fields. Each item uses a native `dt` label and `dd` value inside a `dl`. Plain, bordered and vertical layouts share the same content tree.

## Examples

See the 13 paired examples in [`demo/`](./demo). Use DescriptionsItem slots for templates and `items` for programmatic data.

## API

| Prop | Description | Type | Default |
| --- | --- | --- | --- |
| prefixCls | Instance DOM prefix; custom prefixes require matching static CSS | `string` | `apollo-descriptions` |
| id | Native root div id | `string` | — |
| bordered | Bordered presentation | `boolean` | `false` |
| size | `default` is deprecated in favor of `large`; `middle` remains supported | `'large' \| 'medium' \| 'small' \| 'default' \| 'middle'` | Provider componentSize, otherwise `large` |
| column | Logical columns; use the largest active breakpoint with a configured value, then the default map | `DescriptionsColumn` | `{ xs: 1, sm: 2, md: 3, lg: 3, xl: 3, xxl: 3, xxxl: 4 }` |
| layout | Label/value arrangement | `'horizontal' \| 'vertical'` | `'horizontal'` |
| colon | Label colon in plain layouts; bordered layouts always hide it | `boolean` | `true` |
| title | Text title; a present #title slot takes priority, including an empty slot | `string` | — |
| items | Data items; even [] takes priority over the default slot without evaluating it | `DescriptionsItemType[]` | — |
| labelStyle / contentStyle | Deprecated; use styles.label / styles.content | `CSSProperties` | — |
| classNames | Classes for the six semantic regions | `DescriptionsSemanticClassNames \| ((info: { props: DescriptionsProps }) => DescriptionsSemanticClassNames)` | — |
| styles | Styles for the six semantic regions | `DescriptionsSemanticStyles \| ((info: { props: DescriptionsProps }) => DescriptionsSemanticStyles)` | — |

Numeric column/span values are floored. A nonfinite value or one below 1 falls back to 3 columns or span 1. Excess spans are clamped to the remaining columns with a development warning. Before media observation (including SSR), column maps fall back to 3 and span maps to 1. Mounted instances then use the current viewport.

### Slots

| Slot | Description | Arguments |
| --- | --- | --- |
| default | DescriptionsItem / Descriptions.Item entries; supports Fragment, v-for and v-if | None |
| title | Complete title content; an intentionally empty slot hides text fallback; 0 remains visible | None |
| extra | Header actions/content, including native buttons and Vue components | None |

Only actual Items become entries; other default-slot nodes are ignored. Both template Items and data items are supported public APIs. There are no business emits or v-models. Native root listeners receive the DOM event once. Empty header content produces no empty shell.

### DescriptionsItemType

| Field | Description | Type | Default |
| --- | --- | --- | --- |
| key | Business identity; provide stable keys for dynamic order | `PropertyKey` | Index |
| label / children | Complete content, including multiple nodes, text, 0, VNodes and Fragments | `VNodeChild` | — |
| span | Logical columns; filled consumes the remainder of the current row and ends it | `number \| 'filled' \| Partial<Record<Breakpoint, number>>` | `1` |
| prefixCls | Item DOM prefix; requires matching CSS | `string` | Parent prefix |
| className / style | Classes/native styles on the owning item div | `string` / `StyleValue` | — |
| classNames / styles | Item label/content regions | `{ label?, content? }` | — |
| labelStyle / contentStyle | Retained deprecated style aliases | `CSSProperties` | — |

Each row's last entry fills its remaining columns. Four items in three columns produce `[1,1,1]` then `[3]`. A(1), B(filled), C(1) produce `[1,2]` then `[3]`; B does not start a separate row.

### DescriptionsItem

The named DescriptionsItem export is the same component as Descriptions.Item. Place it in Descriptions' default slot.

| Prop | Description | Type |
| --- | --- | --- |
| label | Text label; a present #label slot wins, including an empty slot | `string` |
| span / prefixCls | Same as data items | See above |
| classNames / styles | Item label/content classes/styles | `{ label?, content? }` |
| labelStyle / contentStyle | Retained deprecated aliases | `CSSProperties` |
| className | Deprecated; use native class in templates | `string` |

The label and default slots have no arguments and retain complete Vue content. Native class, string/object/array style, id, data, ARIA, tabindex and listeners belong to the item's own div. Parent root attrs stay on the parent. Native controls in content keep their events and keyboard behavior. Item adds no business emits, v-model or expose surface.

### Styling, configuration and lifecycle

Semantic regions are root, header, title, extra, label and content. Root is a div; label/content always target dt/dd. Classes concatenate Provider → component → Item. Region styles resolve Provider → deprecated component styles → component styles → deprecated Item styles → Item styles. Root styles resolve Provider styles.root → Provider style → component styles.root → native Vue style.

ConfigProvider.components.descriptions accepts DescriptionsConfig's className/style/classNames/styles. Global componentSize, direction, prefixCls and theme remain reactive. Semantic callbacks receive `{ props }` with the current effective column and size. Nested instances consume their own configuration; outer region styles do not rewrite inner labels.

Items are normalized in the current render without reactive writes during rendering. Stable business keys preserve Vue instances, native nodes, uncontrolled drafts and owned focus through column/span/order/layout/bordered changes. Removed entries unmount normally; adding them again creates new instances. SSR does not read viewport size; media observation starts after hydration.

### Ref

Only nativeElement: HTMLDivElement | null is exposed. It points to the actual root and clears on unmount. Internal component instances are not exposed.

## Theme (Component Token)

All ten tokens use --apollo-descriptions-* CSS variables. ConfigProvider.theme.components.Descriptions overrides update dynamically and return to current defaults when removed.

| Token | Default | Purpose |
| --- | --- | --- |
| labelBg | colorFillAlter | Bordered label background |
| labelColor | colorTextSecondary | Readable labels in every layout |
| titleColor | colorText | Title text |
| titleMarginBottom | fontSizeSM × lineHeightSM | Header spacing using current font aliases |
| itemPaddingBottom | padding; medium/middle use paddingSM, small uses paddingXS | Item spacing/bordered block padding |
| itemPaddingEnd | padding | Item trailing spacing/bordered inline padding |
| colonMarginRight / colonMarginLeft | marginXS / marginXXS ÷ 2 | Colon inline end/start spacing |
| contentColor | colorText | Value text |
| extraColor | colorText | Header extra text |

Length tokens accept numeric pixels or CSS length strings; color tokens accept strings. Explicit overrides take priority over size defaults, in both plain and bordered layouts. Layout requires modern CSS Grid/Subgrid. Existing semantic classes remain styling hooks; the old table/tr/th/td tree was replaced to preserve Vue content identity. See the [migration notes](../../../../docs/migrations/descriptions-contracts.md).
