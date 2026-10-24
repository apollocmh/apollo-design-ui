---
category: Data Entry
title: Switch
subtitle: Switch
---

A switch selector.

## When To Use

- To represent an **on / off** state that takes effect immediately (no confirm step).
- Compared with Checkbox: a switch means "a state applied right away"; a checkbox means
  "a choice to be submitted".

## Examples

See [`demo/`](./demo) (7 demos, covering the main antd scenarios.

## API

| Property | Description | Type | Default |
|---|---|---|---|
| checked | Whether the switch is on (controlled) | `boolean` | — |
| defaultChecked | Initial on/off state (uncontrolled) | `boolean` | `false` |
| value | ⚠️ **Alias** for `checked` (antd `@since 5.12.0`) | `boolean` | — |
| defaultValue | ⚠️ **Alias** for `defaultChecked` | `boolean` | — |
| onChange | Listener for the `change` event (**two arguments**; not fired when `disabled`) | `(checked: boolean, event: MouseEvent \| KeyboardEvent) => void` | — |
| onClick | Native click event listener; read state from change / v-model | `(event: MouseEvent) => void` | — |
| checkedChildren | Content shown when on | `VNodeChild` | — |
| unCheckedChildren | Content shown when off | `VNodeChild` | — |
| disabled | Disabled state | `boolean` | — |
| loading | Loading state; ⚠️ **forces** disabled (`\|\|` semantics) | `boolean` | `false` |
| size | Size; ⚠️ `'default'` is deprecated (use `'medium'`) | `'small' \| 'medium' \| 'middle' \| 'default'` | — |
| autoFocus | Focus automatically | `boolean` | — |
| title / id / tabIndex | Native attributes (rendered on `<button>`) | — | — |
| class / style | **Native root attrs** (not Props) | — | — |
| classNames / styles | Semantic slots `{ root, content, indicator }` (object or function) | — | — |

### Events

| Event | Description | Payload |
|---|---|---|
| update:checked | `v-model:checked` channel (emitted together with `onChange`) | `boolean` |
| update:value | `v-model:value` channel (the alias channel, same as above) | `boolean` |
| change | Declared Vue event; emitted once per click or arrow-key update, suppressed when disabled | `(checked: boolean, event: MouseEvent \| KeyboardEvent)` |
| click | Native button click, including keyboard activation; arrows do not synthesize click | `MouseEvent` |

`@change` and `onChange` register the same event. They do not attach an additional native DOM `change` listener. `@click` receives only the native `MouseEvent`, supporting `.stop`, `.prevent` and `.once`. The old `(checked, event)` callback is removed directly, without a compatibility layer or deprecation period. Read state from `@change` or `v-model:checked`.

Native root `style` accepts strings, objects and arrays, merged with semantic root styles using Vue rules; caller styles take precedence.

### Keyboard

| Key | Behaviour |
|---|---|
| `ArrowLeft` | Turn off (no effect when `disabled`) |
| `ArrowRight` | Turn on (no effect when `disabled`) |
| `Space` / `Enter` | Native `<button>` activation (same as click) |

Arrow keys use standard `KeyboardEvent.key` and prevent scrolling. Space/Enter use native button activation, producing one click and state change.

## Ref

| Name | Type |
|---|---|
| nativeElement | `HTMLButtonElement \| null` |
| focus / blur | `(options?: FocusOptions) => void` / `() => void` |

> ⚠️ antd's `ref` is the `HTMLButtonElement` itself; we expose an object following the
> library convention (`ref.current.focus()` → `ref.value.focus()`).

## Theme (Component Token)

13 tokens, covering the main antd scenarios.

| Token | Description | Default |
|---|---|---|
| trackHeight | Height of Switch | `22px` |
| trackHeightSM | Height of small Switch | `16px` |
| trackMinWidth | Minimum width of Switch | `44px` |
| trackMinWidthSM | Minimum width of small Switch | `28px` |
| trackPadding | Padding of Switch | `2px` |
| handleBg | Background colour of the handle | `#fff` |
| handleShadow | Shadow of the handle | `0 2px 4px 0 rgba(0,35,11,0.2)` |
| handleSize | Size of the handle | `18px` |
| handleSizeSM | Size of the small handle | `12px` |
| innerMinMargin | Minimum margin of the content area | `9px` |
| innerMaxMargin | Maximum margin of the content area | `24px` |
| innerMinMarginSM | Minimum margin of the small content area | `6px` |
| innerMaxMarginSM | Maximum margin of the small content area | `18px` |

> ⚠️ These 13 values are **resolved at build time** and do not scale with the theme
> (`handleBg` / `handleShadow` diverge from antd in dark mode — registered). With the
> zero-runtime architecture, override the CSS variables to customize:

```css
.my-scope .apollo-switch {
  --apollo-switch-track-height: 14px;
  --apollo-switch-handle-size: 20px;
}
```

## FAQ

**Can disabled switches emit click?**
Browsers suppress real user activation and native button `.click()`, so neither click nor change/update fires. Explicit `dispatchEvent` remains a normal DOM dispatch: listeners receive the native event, while disabled state and change/update remain unchanged.

**What is the difference between `value` and `checked`?**
None — `value` / `defaultValue` are aliases for `checked` / `defaultChecked` (added by
antd 5.12.0 for form usage). When both are given, `checked` wins.
