---
title: Tabs
subtitle: Tabs
titleTemplate: '%s - @apollo-design/ui'
description: Tabs make it easy to switch between different views.
---

# Tabs

Tabs make it easy to switch between different views.

## When To Use

- When there is a group of content on the same level.
- When there is a need to switch between views within a region.

## Import

```ts
import { Tabs } from '@apollo-design/ui';
```

## Examples

### Basic

<code src="./demo/basic.vue"></code>

### Disabled

<code src="./demo/disabled.vue"></code>

### With Icon

<code src="./demo/icon.vue"></code>

### Size

<code src="./demo/size.vue"></code>

### Placement

<code src="./demo/placement.vue"></code>

### Card

<code src="./demo/card.vue"></code>

### Centered

<code src="./demo/centered.vue"></code>

### Editable card

<code src="./demo/editable-card.vue"></code>

### Custom add trigger

<code src="./demo/custom-add-trigger.vue"></code>

### Extra content

<code src="./demo/extra.vue"></code>

### Custom indicator

<code src="./demo/custom-indicator.vue"></code>

### Custom tab bar

<code src="./demo/custom-tab-bar.vue"></code>

### Animated

<code src="./demo/animated.vue"></code>

### Custom overflow list

<code src="./demo/popup-render.vue"></code>

### Component Token

<code src="./demo/component-token.vue"></code>

## API

### Tabs

| Property | Description | Type | Default |
| --- | --- | --- | --- |
| activeKey | Controlled selection; supports `v-model:activeKey` | `string` | — |
| defaultActiveKey | Initial uncontrolled selection | `string` | First enabled item |
| items | Tab and panel data | `TabsItem[]` | `[]` |
| type | Tab appearance | `'line' \| 'card' \| 'editable-card'` | `'line'` |
| size | Local size, then components.tabs.size, then global size | `'small' \| 'medium' \| 'middle' \| 'large'` | — |
| tabPlacement | Navigation position; start/end follow text direction | `'top' \| 'end' \| 'bottom' \| 'start'` | `'top'` |
| direction | Text direction; otherwise reads the current Provider | `'ltr' \| 'rtl'` | — |
| centered | Center navigation | `boolean` | `false` |
| tabBarGutter | Space between tabs in px | `number` | — |
| tabBarStyle | Navigation styles | `CSSProperties` | — |
| tabBarExtraContent | Additional content; a single node appears on the right | `VNodeChild \| { left?: VNodeChild; right?: VNodeChild }` | — |
| addIcon / removeIcon | Add and close button icons | `VNodeChild` | — |
| hideAdd | Hide the editable-card add button | `boolean` | `false` |
| more | Overflow button icon and popup motion name | `{ icon?: VNodeChild; transitionName?: string }` | — |
| indicator | Alignment and size; the function receives the original length | `{ align?: 'start' \| 'center' \| 'end'; size?: number \| ((origin: number) => number) }` | `{ align: 'center' }` |
| animated | Indicator and panel motion | `boolean \| { inkBar?: boolean; tabPane?: boolean }` | `{ inkBar: true, tabPane: false }` |
| destroyOnHidden | Panel destruction default when the item does not specify one | `boolean` | `false` |
| locale | Accessible names for buttons and the overflow list | `{ dropdownAriaLabel?: string; removeAriaLabel?: string; addAriaLabel?: string }` | English names |
| getPopupContainer | Overflow popup container | `(trigger: HTMLElement) => HTMLElement` | Current Provider / body |
| classNames / styles | Semantic objects, or `({ props: TabsProps }) => object` | `TabsProps['classNames'] / TabsProps['styles']` | — |
| id | Root id and internal ARIA id prefix | `string` | Vue useId() |
| prefixCls | DOM class prefix | `string` | `'apollo-tabs'` |

Existing deprecated aliases remain: tabPosition (top/right/bottom/left), indicatorSize, moreIcon, popupClassName and destroyInactiveTabPane. Prefer tabPlacement, indicator.size, more.icon, classNames.popup.root and destroyOnHidden.

### TabsItem

| Field | Description | Type |
| --- | --- | --- |
| key | Unique data key; events return its original value | `string` |
| label / children | Tab label / panel content; full Vue content including numeric zero | `VNodeChild` |
| icon | Label icon | `VNodeChild` |
| disabled | Block user activation and removal | `boolean` |
| closable | Allow removal in editable-card | `boolean` |
| closeIcon | With closable omitted, null/false disables removal for this item | `VNodeChild` |
| forceRender | Render before the first activation | `boolean` |
| destroyOnHidden | Override the component default, including explicit false | `boolean` |
| destroyInactiveTabPane | Deprecated destroyOnHidden alias | `boolean` |
| className / style | Panel class and style | `string / CSSProperties` |

### Events

| Event | Trigger and arguments |
| --- | --- |
| update:activeKey | A selection request differs from the current public value: `(key: string)` |
| change | Sent with update:activeKey: `(key: string)` |
| tabClick | Every valid click or keyboard activation, including the current tab: `(key: string, event: MouseEvent \| KeyboardEvent)` |
| tabScroll | Navigation movement: `({ direction: 'left' \| 'right' \| 'top' \| 'bottom' })` |
| edit | Add: `(event, 'add')`; remove: `(key, 'remove')`. The caller updates items. |

Vue emits owns event delivery. Controlled requests change the public value only after the parent accepts them. Removing control with undefined retains the last accepted value. Defaults initialize once. Removing the uncontrolled active item chooses a nearby enabled item using its former index; data normalization does not emit user activation events.

### Slots and instance

| Slot | Scope |
| --- | --- |
| tabBar | TabsRenderTabBarProps: current id, prefixCls, tabs, activeKey, direction, placement, motion, semantic styles and navigation callbacks; replaces navigation |
| popupRender | `{ originNode, restTabs, onClose }`: default overflow list, current hidden items and close action |
| extra | `{ position: 'left' \| 'right' }`: additional content |

Slots are read during rendering. An extra slot takes priority over tabBarExtraContent, including an intentionally empty slot. popupRender also supports conditional addition, empty content and removal. A custom tabBar owns its keyboard and ARIA behavior. editable.onEdit requires `{ key, event }` for remove and `{ event }` for add.

A template ref exposes the actual root as the readonly `nativeElement: HTMLElement | null` property: `tabsRef.value?.nativeElement`. Do not call nativeElement().

### Native attrs, ownership and focus

class, style, data-*, ARIA and undeclared native events land on the root div. Native style accepts objects, arrays and strings and overrides semantic root styles. Semantic regions are root, header, item, remove, indicator, body, content and nested popup.root. Provider styles merge first, followed by local semantic styles and native root style. Semantic functions receive current resolved props.

Tabs and close buttons have separate interaction ownership. tablist uses aria-owns to own only tabs; the overflow listbox owns only options, with independent remove buttons. Data-key segments in ids are encoded to preserve ARIA references. Vue generates deterministic SSR/hydration ids when id is omitted. Reordering an existing key retains its panel input and component state.

| Key | Behavior |
| --- | --- |
| Left / Right | Cycle through enabled horizontal tabs; reverse for RTL; prevent handled page scrolling |
| Up / Down | Navigate vertical tabs; preserve normal page behavior for horizontal tabs |
| Home / End | First / last enabled tab |
| Enter / Space | Activate the focused tab |
| Backspace / Delete | Request removal when allowed; move focus only after the item is actually removed |
| Up / Down / Enter / Space on overflow | Open and focus the list; Up starts from the last option |
| Up / Down, Home / End in overflow | Move among enabled options |
| Enter / Space, Escape in overflow | Select and close / close; restore focus to the overflow button |

Overflow supports hover and click, with outside clicks closing it. Remove buttons and custom slot form controls retain their own keyboard activation. A disabled controlled selection keeps an enabled Tab entry available. Touch motion, inertia, observers and popup listeners are released on cancellation, target replacement and unmount.

## Design Token

The 24 consumed component tokens read current ConfigProvider.theme.components.Tabs, including nesting, replacement, removal and global derivation. Numeric lengths use px; zIndexPopup is unitless. The popup uses the same current tokens.

| Token | Default / derivation |
| --- | --- |
| zIndexPopup | 1050 |
| cardBg / cardGutter | colorFillAlter / 2 |
| cardHeight / cardHeightSM / cardHeightLG | 40 / 32 / 48; add-button minimum size and default padding derivation |
| cardPadding / cardPaddingSM / cardPaddingLG | 8px 16px / 4px 8px / 11px 16px; recalculated after height overrides; explicit padding wins |
| titleFontSize / titleFontSizeLG / titleFontSizeSM | 14 / 16 / 14 |
| inkBarColor | colorPrimary |
| horizontalMargin | 0 0 16px 0 |
| horizontalItemGutter | 32; configurable |
| horizontalItemPadding / horizontalItemPaddingSM / horizontalItemPaddingLG | 12px 0 / 8px 0 / 16px 0 |
| verticalItemPadding / verticalItemMargin | 8px 24px / 16px 0 0 0 |
| itemColor | colorText |
| itemSelectedColor / itemHoverColor / itemActiveColor | colorPrimaryTextActive on light backgrounds; colorPrimaryTextHover on dark backgrounds |

The default text states reuse existing readable theme colors. Background classification follows Button and generates no new color values. Explicit item*Color, native styles, transparent or custom backgrounds require the caller to ensure the actual contrast pair. Static CSS consumes the variables; custom prefixCls requires matching static selectors.

### Development migration

Remove inert top-level children and use items[].children. Removed horizontalItemMargin / horizontalItemMarginRTL never affected CSS; use horizontalItemGutter. The previously declared nativeElement property now returns the actual root; replace old runtime function calls with property reads. IDs now exist during SSR and encode data-key segments. item.destroyOnHidden now overrides the component default as already documented. These corrections have no compatibility layer or deprecation period.

The existing single-object popupRender and conditional slot delivery remains valid; see the [2026-10-24 migration](../../../../docs/migrations/tabs-popup-slots.md). Original DOM and visual references remain intact. Focused stage-one checks are separate from frozen-version final library acceptance.
