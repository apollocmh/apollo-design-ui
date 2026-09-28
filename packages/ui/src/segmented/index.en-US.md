---
title: Segmented
titleTemplate: '%s - @apollo-design/ui'
description: Display multiple options and allow users to select a single one.
---

# Segmented

Display multiple options and allow users to select a single one.

## When To Use

- Display multiple options and user selects a single option;
- When toggling a switch to show different contents.

## Examples

### Basic

<code src="./demo/basic.vue"></code>

### Controlled

<code src="./demo/controlled.vue"></code>

### Block

<code src="./demo/block.vue"></code>

### Disabled

<code src="./demo/disabled.vue"></code>

### Dynamic

<code src="./demo/dynamic.vue"></code>

### Icon only

<code src="./demo/icon-only.vue"></code>

### With icon

<code src="./demo/with-icon.vue"></code>

### Custom render & tooltip

<code src="./demo/custom.vue"></code>

### Round shape

<code src="./demo/shape.vue"></code>

### Sizes

<code src="./demo/size.vue"></code>

### Vertical

<code src="./demo/vertical.vue"></code>

### Name

<code src="./demo/with-name.vue"></code>

### Semantic styles

<code src="./demo/style-class.vue"></code>

### Component Token

<code src="./demo/component-token.vue"></code>

## API

### SegmentedProps

| Property | Description | Type | Default |
| --- | --- | --- | --- |
| block | Fit width to parent's width | boolean | false |
| disabled | Disable all items | boolean | false |
| options | Set the options | `SegmentedOptions` | [] |
| shape | Set the shape | `'default' \| 'round'` | 'default' |
| size | Set the size | `'small' \| 'middle' \| 'large'` | 'middle' |
| value | Controlled value | SegmentedValue | - |
| defaultValue | Initial value; falls back to the first option | SegmentedValue | - |
| name | Native `name` of the inner radio inputs | string | auto-generated |
| vertical | Vertical layout (legacy) | boolean | false |
| orientation | Orientation (new API) | `'horizontal' \| 'vertical'` | - |
| classNames | Semantic class names (function supported) | `{ root, icon, label, item }` | - |
| styles | Semantic styles (function supported) | `{ root, icon, label, item }` | - |

### Events

| Event | Description | Arguments |
| --- | --- | --- |
| update:value | Value changed (for `v-model:value`) | `(value: SegmentedValue) => void` |
| onChange | Value changed | `(value: SegmentedValue) => void` |

### SegmentedValue

```ts
type SegmentedValue = string | number;
```

## Theme Variables

| Token | Description | Default |
| --- | --- | --- |
| itemColor | Text color of item | colorTextLabel |
| itemHoverColor | Text color when hover | colorText |
| itemHoverBg | Background when hover | colorFillSecondary |
| itemActiveBg | Background when active | colorFill |
| itemSelectedBg | Background when selected | colorBgElevated |
| itemSelectedColor | Text color when selected | colorText |
| trackPadding | Padding of container | lineWidthBold |
| trackBg | Background of container | colorBgLayout |
