---
category: Navigation
title: Dropdown
subtitle: Dropdown
---

Place actions in a menu attached to a trigger. Menu owns item data, selection and keyboard navigation; use the named slot for custom popup content.

## Dropdown props

| Prop | Behavior | Default |
| --- | --- | --- |
| menu | Current MenuProps, including items, selection and Menu events | — |
| open / defaultOpen | Controlled v-model:open / initial uncontrolled value | false |
| trigger | An array of click, hover and contextMenu; overrides Provider defaults | hover |
| disabled | Uses global disabled when omitted; explicit false overrides it | — |
| placement | DropdownPlacement; legacy Center values normalize to top/bottom | bottomLeft, bottomRight in RTL |
| arrow | Boolean or `{ pointAtCenter }` | false |
| mouseEnterDelay / mouseLeaveDelay | Current delays in seconds | 0.15 / 0.1 |
| autoAdjustOverflow | Adjust overflow | true |
| getPopupContainer | Current HTMLElement / ShadowRoot popup container; falls back to Provider | body |
| destroyOnHidden / forceRender | Destroy after leave / prerender | false |
| transitionName | Override the existing directional motion name | Based on placement |
| zIndex | Explicit numeric layer, including 0 | Current Token or parent plus offset |
| classNames / styles | root, item, itemTitle, itemIcon, itemContent; object or `({ props }) => object` | — |
| rootClassName / overlayClassName / overlayStyle / destroyPopupOnHide | Existing aliases; prefer semantic fields and destroyOnHidden | — |

Semantic functions read current resolved configuration and open state. root belongs to the actual popup root. The four item regions reach Menu and merge with menu.classNames/styles; Dropdown styles take precedence for matching fields. Styles use Vue CSSProperties, including undefined and CSS custom properties.

Native class/style, id, ARIA and native listeners belong to the trigger. A single element/component retains its node; text, multiple nodes and Fragments use a stable span. Popup appearance belongs to styles.root/classNames.root. Provider class/style, semantics, arrow, trigger, delays and the global container remain current.

## Events

| Event | Payload |
| --- | --- |
| update:open | `(open: boolean)` |
| openChange | `(open: boolean, info: { source: 'trigger' or 'menu' })` |
| afterOpenChange | `(open: boolean)`, after actual motion completion |

Vue listener arrays, replacement and .once are supported. Menu selection emits each notification once; selectable multiple menus stay open. Controlled close requests do not change a rejected value, and withdrawal keeps the last accepted state. Replace the old afterOpenChange function prop with @after-open-change, or onAfterOpenChange in h/JSX. There is no compatibility callback channel.

## Slots and refs

| Slot | Scope / behavior |
| --- | --- |
| default | Complete trigger content |
| popupRender | `{ originNode: VNodeChild }`; a present slot overrides the menu, including empty content |

DropdownRef keeps forceAlign(), nativeElement() and popupElement(). DOM getters return the current HTMLElement or null. Closed DOM retention follows destroyOnHidden.

## DropdownButton

Apollo supports this composition. It retains split, type, size, loading, danger, disabled, href, target, menu, placement, trigger, arrow, open, container and layer configuration. The main button triggers the menu when split is false. In split mode, the main button emits click and the right button independently opens the menu. target applies to the main link; native attrs and class/style belong to the group root.

Events are click(MouseEvent), openChange(open, info) and update:open, including v-model:open. The default slot keeps all main-button content. The current icon slot keeps all nodes; an intentionally empty slot hides the fallback icon. buttonsRender receives `{ buttons: [main VNode, trigger VNode] }` and returns the two corresponding Vue children. popupRender uses the Dropdown scope. DropdownButtonRef keeps nativeElement(), returning the actual Dropdown trigger.

The icon prop/function channel already migrated to #icon and its unused interface field is removed. Dropdown.Button and Dropdown._InternalPanelDoNotUseOrYouWillBeFired remain typed component aliases.

## PurePanel and theme

DropdownPurePanel displays the same Menu in document flow. It accepts menu, classNames/styles, popupRender and native class/style. Native strings, objects and arrays override semantic root styles; current Provider and theme values also apply.

The seven existing CSS fields are zIndexPopup (1050), paddingBlock (5), arrowOffsetHorizontal, arrowOffsetVertical, arrowShadowWidth, arrowPath and arrowPolygon. Current marginXXS, sizePopupArrow and borderRadius feed CSS and positioning together. Nested and explicit layers follow the existing numeric protocol. Non-numeric CSS expressions retain their style value but do not participate in automatic descendant numeric stacking.
