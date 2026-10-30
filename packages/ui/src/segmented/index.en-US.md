---
title: Segmented
subtitle: Segmented control
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
| size | Set the size | `'small' \| 'middle' \| 'medium' \| 'large'` | 'middle' |
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
| change | Propose a changed value | `(value: SegmentedValue) => void` |
| keydown | Native keyboard event before navigation; supports `preventDefault()` | `(event: KeyboardEvent) => void` |

Both value notifications are Vue events. Use `@change` / `v-model:value` in templates and `onChange` / `onUpdate:value` with `h()`; listeners are no longer called manually through attrs.

A controlled parent may reject a request: the actual radio checked state is restored. Releasing control retains the last accepted value. Initialization uses `defaultValue`, or the first option when options first become available. Later reordering/removal does not silently change it; a missing accepted value leaves every option unchecked.

Native class, complete style (objects, strings or arrays), id, ARIA/data and listeners land on the real root div. Native style overrides semantic root style. The root adds no default Tab stop; the enabled selected radio, or first enabled radio, is the single entry. Arrows wrap enabled items; horizontal RTL reverses left/right. Native cancellation and composition suppress navigation. Keyboard focus moves only after the parent accepts the requested value.

Current ConfigProvider disabled, size, direction and `components.segmented` semantic configuration remain reactive, including removal; explicit `disabled=false` overrides global disabled.

### SegmentedOptions

Options accept scalar values or `{ value, label?, icon?, disabled?, title?, className?, id?, tooltip? }`. Data label/icon use complete Vue `VNodeChild`, including zero, arrays and Fragments; render callbacks are unsupported. A label is required without an icon. The options array may be readonly. Option id lands on its label; the native radio submits the string form of the value while events preserve the original scalar type. Icon-only items use title or value as their accessible name; supply meaningful titles.

### Ref

```ts
interface SegmentedRef { nativeElement: HTMLDivElement | null }
```

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

`trackPadding` accepts a number (px) or CSS length string; the other seven tokens accept CSS strings. All eight `theme.components.Segmented` overrides reach the real root and respond to replacement/removal.
