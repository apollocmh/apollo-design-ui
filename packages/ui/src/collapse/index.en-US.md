---
category: Data Display
title: Collapse
subtitle: 折叠面板
---

Group content behind native disclosure buttons. Both `items` and declared `CollapsePanel` children use the same real Vue component. See all nine [demos](./demo).

## API

### Collapse

| Prop | Description | Type | Default |
|---|---|---|---|
| items | Data panels; a present array, including [], takes priority over the default slot | `CollapseItemType[]` | — |
| activeKey / defaultActiveKey | Controlled keys / initial uncontrolled keys; normalized to strings | `string \| number \| (string \| number)[]` | — |
| accordion | Only one open disclosure | `boolean` | `false` |
| bordered / ghost | Border / transparent appearance | `boolean` | `true` / `false` |
| size | Local size, otherwise current Provider componentSize | `'small' \| 'middle' \| 'large'` | `middle` |
| collapsible | Default: header whitespace and title button; header: title button; icon: icon button; disabled: no activation | `'header' \| 'icon' \| 'disabled'` | — |
| headingLevel | Heading level; nested Collapse increments up to 6 | `1 \| 2 \| 3 \| 4 \| 5 \| 6` | `3` |
| expandIconPlacement | Logical icon position; extra remains an independent region | `'start' \| 'end'` | `start` |
| destroyOnHidden | Destroy body after completed close; forceRender takes priority | `boolean` | `false` |
| prefixCls | Full component prefix; preload matching static CSS | `string` | Provider prefix + `-collapse` |
| classNames / styles | root, header, title, body and icon semantic regions | `CollapseSemanticClassNames / CollapseSemanticStyles` | — |

Legacy destroyInactivePanel / expandIconPosition still work and warn in development; current props take priority. Native class, style, ARIA, data, role and DOM listeners reach the root. Native style wins conflicting Provider and semantic root styles.

| Slot | Content / scope |
|---|---|
| default | Declared CollapsePanel children; not read when items is an array |
| expandIcon | `{ key, isActive, prefixCls, collapsible, direction }`; slot presence wins, including empty output, zero and Fragments |

The top-level expandIcon renderer prop has migrated directly to `#expandIcon`. Programmatic defaults remain available through `ConfigProvider components.collapse.expandIcon`; a local slot wins.

| Event | Payload |
|---|---|
| update:activeKey | `string[]`; supports `v-model:active-key` |
| change | `string[]`, once per allowed activation |

Controlled requests do not change presentation until accepted. Releasing control uses the last accepted value. Later defaultActiveKey changes do not reset state. A ref exposes `nativeElement: HTMLDivElement | null`.

### Items and CollapsePanel

| Field | Item data | Declared Panel |
|---|---|---|
| key | string / number; defaults to array index | Vue key; otherwise numbered by initial mount order. Use stable explicit keys for dynamic Panels |
| label / header | VNode data; label wins | header is text; label is a VNode fallback |
| children / extra | VNode data, including zero and Fragments | default / #extra slots |
| showArrow / forceRender | boolean, defaults true / false | Same |
| collapsible / destroyOnHidden | Override owning Collapse | Same |
| onItemClick / @item-click | Normalized string key, once per activation | Vue event; supports .once |
| className / style | Item root class / native StyleValue | Same; also supports native class, attrs and listeners |
| classNames / styles | Five regions; item overrides global, root targets this item | Same |
| headerClass / id | Header class / item root ID | Same |
| prefixCls | — | Full Panel prefix; inherits owning Collapse tokens; preload matching CSS |
| disabled | — | Legacy disabled input with a warning; explicit collapsible wins |

A present Panel `#header` overrides header and label, including empty output. Removing a conditional slot restores the fallback. Titles belong to a native heading/button: use phrasing content such as text and spans. Put independent buttons and inputs in `#extra`, outside that heading/button; stopping propagation is unnecessary. The default slot holds body content. Panel lifecycle hooks run normally.

## Keyboard, state and motion

Tab reaches disclosure buttons; Enter and Space activate them. Disabled buttons cannot activate. icon with showArrow=false is explicitly disabled and warns in development. Empty custom icon output still retains a named button. An empty title receives a default accessible name; applications should supply meaningful titles.

Body content mounts lazily and stays mounted after closing by default, preserving input state and selection. Closed content is hidden / inert. destroyOnHidden removes body content after closing while keeping the stable region/aria-controls relationship. forceRender always renders and retains the body, even with destroyOnHidden. Closing an editor that owns focus returns focus to its trigger; outside focus stays outside. Motion follows the current theme, reduced-motion preference and prefix.

When an external update closes an editor whose trigger is disabled, focus moves to its owning Collapse root. A temporary tabindex=-1 remains only while that root owns focus; native attrs resume on blur.

## Theme

Current `theme.components.Collapse` supports ten CSS string tokens: headerPadding, headerPaddingSM, headerPaddingLG, headerBg, contentPadding, contentPaddingSM, contentPaddingLG, contentBg, borderlessContentPadding and borderlessContentBg. They map to `--<component-prefix>-header-padding` and related variables. Ghost backgrounds remain transparent.

Default padding and derived panel radius follow current Alias values. Default body horizontal padding keeps the 16px design constant. borderlessContentBg defaults to transparent. An explicit empty ThemeProvider resets defaults; CSS-only scopes retain inherited variables. See the [development migration](../../../../docs/migrations/collapse-contracts.md).
