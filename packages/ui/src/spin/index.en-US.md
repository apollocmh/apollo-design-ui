---
category: Components
group: Feedback
title: Spin
subtitle: Loading
description: Used for the loading status of a page or a block.
cover: https://mdn.alipayobjects.com/huamei_7uahnr/afts/img/A*5mC5TomY4B0AAAAAAAAAAAAADrJ8AQ/original
coverDark: https://mdn.alipayobjects.com/huamei_7uahnr/afts/img/A*i43_ToFrL8YAAAAAAAAAAAAADrJ8AQ/original
demo:
  cols: 2
---

## When To Use {#when-to-use}

Show the state of an asynchronous operation. Callers provide spinning; a positive delay prevents brief loading flashes and closing is immediate.

## Examples {#examples}

<code src="./demo/basic.vue">Basic</code>
<code src="./demo/size.vue">Sizes</code>
<code src="./demo/nested.vue">Nested content</code>
<code src="./demo/description.vue">Description</code>
<code src="./demo/delay-and-debounce.vue">Delay</code>
<code src="./demo/custom-indicator.vue">Native indicator slots</code>
<code src="./demo/percent.vue">Determinate and estimated progress</code>
<code src="./demo/style-class.vue">Semantic styles</code>
<code src="./demo/fullscreen.vue">Fullscreen and native input</code>
<code src="./demo/component-token.vue">Live component tokens</code>

## API

Native class, style, DOM events and ARIA attributes target the content root and update normally. Spin declares no business emits or v-model.

| Property | Description | Type | Default |
|---|---|---|---|
| spinning | Target loading state | boolean | true |
| delay | Positive finite milliseconds before showing; other values do not delay | number | 0 |
| size | Indicator size; middle/default use medium, with the existing default warning | 'small' \| 'medium' \| 'middle' \| 'large' \| 'default' | 'medium' |
| description | Content; an existing #description slot takes precedence, including zero | VNodeChild | - |
| fullscreen | Fixed fullscreen cover, preserving the content host and nodes | boolean | false |
| percent | Omitted means indeterminate; explicit numbers including zero render a ring clamped to 0–100; auto estimates every 200ms; nonfinite values are indeterminate | number \| 'auto' | - |
| prefixCls | Current class prefix; load matching prebuilt CSS | string | 'apollo-spin' |
| classNames | Per-slot classes concatenate Provider and local values | `SpinSemanticValue<SpinSemanticClassNames>` | - |
| styles | Per-slot shallow merges, local values win; factories receive current merged props | `SpinSemanticValue<SpinSemanticStyles>` | - |
| tip | Existing deprecated description alias | VNodeChild | - |
| wrapperClassName | Existing deprecated wrapper class, used with a default slot or fullscreen | string | - |

### Slots

| Slot | Scope | Behavior |
|---|---|---|
| default | - | Native body content, including conditional registration/removal |
| indicator | { percent: number \| undefined } | Complete Vue content including fragments, multiple nodes and native controls; bind percent explicitly to child components |
| description | - | Content that overrides the prop; empty content creates no wrapper |

An existing named slot wins even when intentionally empty. Inactive loading does not consume indicator/description slots. Indicator scope contains the current number, an estimate for auto, or undefined for indeterminate progress. User VNodes are neither cloned nor given hidden attributes.

### Expose and programmatic configuration

nativeElement is HTMLDivElement or null and identifies the stable content host. ConfigProvider spin settings supply current className/style/classNames/styles/indicator; the programmatic indicator VNode retains its own attributes.

Spin.setDefaultIndicator(indicator: VNodeChild), also exported by name, sets module default content. null/undefined restore the built-in indicator. The command does not schedule updates; mounted instances read it on their next actual render. getDefaultIndicator returns that value. Instance slots take precedence over Provider and module defaults.

## Semantic DOM

| Slot | Actual target |
|---|---|
| root | Stable content div carrying native attrs |
| section | Separate stable loading layer in normal, nested and fullscreen modes |
| indicator | Complete indicator host, including the visible progress ring |
| description | Nonempty description div |
| container | Native default-slot body |
| tip | Existing deprecated description semantic alias |
| mask | Actual fullscreen cover, sharing the section element; hidden and inert while inactive |

Root and section styles target separate elements. Use styles.mask for the fullscreen cover. Descriptions use readable defaults. Built-in animations respect theme.token.motion=false and prefers-reduced-motion; callers own animations in custom content.

## Design Token

All four tokens consume current theme.components.Spin, including updates, removal and restoration. Native root CSS variables take precedence. contentHeight caps the nested loading layer at 400 by default, without forcing body height or limiting fullscreen.

<ComponentTokenTable component="Spin"></ComponentTokenTable>
