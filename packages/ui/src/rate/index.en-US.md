---
category: Data Entry
title: Rate
subtitle: Rate
---

Rate component.

## When To Use

- Quick rating operation on content.
- Show rating result (with the read-only `disabled` state).

## Examples

See [`demo/`](./demo) for 9 examples.

## API

### Props

| Prop | Description | Type | Default |
|---|---|---|---|
| value | Current value (controlled, `v-model:value`) | `number` | — |
| defaultValue | Default value | `number` | `0` |
| count | Star count | `number` | `5` |
| allowHalf | Allow half star | `boolean` | `false` |
| allowClear | Clear on clicking the same value again | `boolean` | `true` |
| keyboard | Keyboard arrow control | `boolean` | `true` |
| disabled | Read only (merged with DisabledContext) | `boolean` | `false` |
| size | Size | `'large' \| 'middle' \| 'small'` | `'middle'` |
| tooltips | Hint per star (string or TooltipProps object) | `(TooltipProps \| string)[]` | — |
| direction | Text direction (rtl flips half-star/arrow logic) | `'ltr' \| 'rtl'` | `'ltr'` |
| autoFocus | Auto focus after mount | `boolean` | `false` |
| tabIndex | tabIndex of the current star; the root and other stars use `-1` | `number` | `0` |
| id | id of the root `ul` | `string` | — |
| prefixCls | Component class prefix | `string` | `apollo-rate` |

### Events

| Event | Description | Payload |
|---|---|---|
| update:value | Rating update request used by `v-model:value` | `number` |
| change | Rating update request, emitted before `update:value` | `number` |
| hoverChange | Hovered value; `undefined` when leaving | `number \| undefined` |
| focus | Focus enters the rating group | `FocusEvent` |
| blur | Focus leaves the group; moving between stars does not repeat this event | `FocusEvent` |

Component events support Vue's `.once` modifier. Native listeners such as `@keydown` / `@mouseleave`, `class` / `style`, `aria-label`, `aria-labelledby` and `data-*` target the root `ul`. Keyboard handling processes the rating before notifying native listeners; disabled ratings suppress both. Existing `onKeyDown` / `onMouseLeave` spellings use the same native event channel.

With controlled `value`, the displayed rating remains unchanged until the parent accepts an update. Removing `value` retains the last accepted value. `defaultValue` only initializes uncontrolled state. Hover changes the preview and `#character.value`, leaving the selected radio and model unchanged.

The root is a `radiogroup`; provide `aria-label` or `aria-labelledby`. Only the current star is in the Tab order, or the first star when the rating is `0`. A half rating selects the next whole-star item and announces its actual value. Left/right arrow keys update the rating and move focus, with reversed direction in RTL. Enter/Space selects the focused star; `allowClear` clears a repeated selection. Disabled stars leave the Tab order.

### Slots

| Slot | Description | Props |
|---|---|---|
| #character | Custom star character (default StarFilled) | `{ index, value, allowHalf, disabled, count, focused }` |
| #characterRender | Wrap the whole star node (tooltips wrapping composes inside) | `{ node, index }` |

> ⚠️ C8-R2: antd's `character` (ReactNode) and `characterRender` (fn) are **slots only**
> in this library. `tooltips` is a data prop (string / TooltipProps object) and stays.

### Expose

| Method | Description |
|---|---|
| focus() | Focus the current star (no-op when disabled) |
| blur() | Blur the actual focused element in the group (no-op when disabled) |

### Development migration

`change`, `hoverChange`, `focus` and `blur` are declared Vue emits. Existing listeners such as `@change` / `onChange` continue to work. `focus` / `blur` now carry a native `FocusEvent`; focus methods and `tabIndex` target the current radio instead of the root container. `#character.value` follows the visual preview. Adding or removing tooltips preserves star DOM and focus.

### Component Token

Override the six tokens with ConfigProvider's `theme.components.Rate`. Nested providers inherit individual fields. Replacing or removing overrides restores values derived from the current global theme. A custom `prefixCls` uses the matching component variable names.

| Token | Description | Default |
|---|---|---|
| starColor | Selected star color | `yellow6` |
| starBg | Unselected star color | `colorFillContent` |
| starSize | Standard star size | `controlHeight × 0.625` |
| starSizeSM | Small star size | `controlHeightSM × 0.625` |
| starSizeLG | Large star size | `controlHeightLG × 0.625` |
| starHoverScale | Hover and keyboard focus scale | `scale(1.1)` |

Numeric sizes use pixels; theme overrides also accept CSS length strings. Styles apply in this order: theme tokens, `components.rate.style`, then native component `style`. Without an active source theme, static CSS variables retain ownership.

## Design notes

- **Vue-native rebuild of the rc-rate 1.0.1 core** (Rate + Star + util.getOffsetLeft).
- **cleanedValue**: after an allowClear reset the cleared value is remembered; the hover
  guard `nextHoverValue !== cleanedValue` prevents flicker when hovering the same value.
- **tooltips × characterRender composition**: in antd a user characterRender **overrides**
  the tooltip wrapping (JSX spread order); here slots compose (Tooltip inside, user slot
  outside).
