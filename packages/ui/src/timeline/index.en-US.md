---
category: Data Display
title: Timeline
subtitle: Timeline
---

Display ordered events, their status and rich descriptions in a vertical or horizontal timeline. The root is a native `<ol>` and each item is an `<li>`. Timeline composes the internal Steps renderer; it has no selection state or business events.

## Examples

The fifteen paired examples in `demo/` cover basic content, variants, end placement, title columns, horizontal and alternating layouts, loading, legacy pending data, custom icons, long text, titles, semantic styles, native slots and live component tokens.

## API

### Timeline

| Property | Description | Type | Default |
| --- | --- | --- | --- |
| items | Ordered item data; use native item slots for template content | `TimelineItemType[]` | — |
| mode | Item placement; legacy left/right normalize to start/end | `'start' \| 'end' \| 'alternate' \| 'left' \| 'right'` | `'start'` |
| orientation | Explicit direction at every viewport width | `'horizontal' \| 'vertical'` | `'vertical'` |
| titleSpan | Title column: numbers use 24-grid units; strings use CSS lengths/percentages | `number \| string` | — |
| variant | Node variant | `'filled' \| 'outlined'` | `'outlined'` |
| reverse | Reverse display order; rail status follows the current item | `boolean` | `false` |
| pending | Deprecated: append a loading item in items instead. false/null/undefined disable it; 0 and an empty string still create a pending item; true shows only its indicator | `VNodeChild` | — |
| pendingDot | Deprecated: custom icon for the synthetic pending item; use items[].icon instead | `VNodeChild` | — |
| classNames | Semantic class names, or a function of current `{ props }` | `TimelineSemanticValue<TimelineSemanticClassNames>` | — |
| styles | Semantic styles, or a function of current `{ props }` | `TimelineSemanticValue<TimelineSemanticStyles>` | — |
| prefixCls | DOM class prefix; arbitrary prefixes require matching static CSS | `string` | `apollo-timeline` |

Vertical timelines use the two-column layout when any current title is nonempty. Explicit mode="alternate" also enables this layout and assigns sides by source-item parity. Reversing changes display order and slot indices while preserving each source item's side. titleSpan is ignored in explicit alternate mode.

### Item data

| Field | Description | Type |
| --- | --- | --- |
| key | Stable item identity across replacement/reordering | `string \| number` |
| title / content / icon | Complete Vue content, including 0, fragments and components; explicit false/empty icon suppresses the loading fallback | `VNodeChild` |
| color | blue/red/green/gray use preset classes; other colors use the item's dot-color CSS variable | `string` |
| loading | Process status; absent/null icon and dot use the loading indicator | `boolean` |
| placement | Side; omitted values follow mode | `'start' \| 'end'` |
| className / style | Item root class and inline styles | `string` / `CSSProperties` |
| classNames / styles | Item targets: root, wrapper, header, title, section, content, icon and rail | Semantic objects |
| label / children / dot | Deprecated data aliases for title/content/icon, used only when the matching current field is nullish | `VNodeChild` |
| position | Deprecated placement alias; left/right normalize to start/end; explicit placement wins | `'left' \| 'right' \| 'start' \| 'end'` |

Item root styles merge in this order: component styles.item → item styles.root → item.style. Other regions merge the component target first, then the corresponding item target. There is no subtitle region. Native slots share these same hosts and styling targets.

### Content slots

| Name | Scope | Description |
| --- | --- | --- |
| itemTitle | `{ item, index }: TimelineItemSlotProps` | Item title |
| itemContent | `{ item, index }: TimelineItemSlotProps` | Item body |
| itemIcon | `{ item, index }: TimelineItemSlotProps` | Item icon |

item is the current original source item. index is its display index after reverse, including any legacy pending position. A present slot overrides its matching data and aliases, including when intentionally empty; removal restores the data. Slots render during SSR and hydration. The synthetic pending item has no source-item scope. The default slot does not register items; Timeline.Item and TimelineItemComponent were removed in the development version. See the [slot migration](../../../../docs/migrations/timeline-item-slots.md).

### Native attrs, events and ref

Native class/style, id, tabindex, ARIA attributes and DOM listeners target the ordered-list root. Native root styles override matching semantic root styles. class supports Vue strings/arrays/objects; style supports strings/arrays/objects. Native @change receives the bubbling DOM Event; it does not enable selectable items. @click and event modifiers use normal Vue DOM semantics. Timeline has no emits or v-model.

A ref exposes `{ nativeElement: HTMLElement | null }`, the current `<ol>` after mounting. The element remains stable through data, layout and Provider updates; unmounting clears the parent ref. Give items explicit keys to retain their input nodes and values when replacing/reordering data.

## Theme

ConfigProvider components.timeline supplies current className/style/classNames/styles defaults. Current direction, theme algorithms and nested component-token overrides are reactive and isolated between instances. Root style priority is current theme → Provider/component semantic root styles → native style.

| Component Token | Description | Default |
| --- | --- | --- |
| tailColor | Rail color | colorSplit |
| tailWidth | Rail width | lineWidthBold |
| dotBorderWidth | Node border width | lineWidthBold |
| itemPaddingBottom | Item bottom spacing | padding * 1.25 |
| dotSize | Custom node size | undefined; keep the internal Steps size fallback |
| dotBg | Custom node background | undefined; keep the internal Steps background fallback |

Set tokens with `:theme="{ components: { Timeline: { dotSize: 14, tailWidth: 3 } } }"` on ConfigProvider, or with root CSS variables such as `--apollo-timeline-dot-size: 14px`. Sizes accept finite nonnegative numbers (converted to px); the width/size tokens also accept CSS length strings. Clearing an optional dot token restores its fallback. Theme updates do not generate runtime stylesheets.

The native event, item-side, zero-content, ref and token corrections are described in the [current contract migration](../../../../docs/migrations/timeline-contracts.md).
