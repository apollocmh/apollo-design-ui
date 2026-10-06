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

See [`demo/`](./demo) (7 demos, one-to-one with antd's non-debug demos).

## API

| Property | Description | Type | Default |
|---|---|---|---|
| checked | Whether the switch is on (controlled) | `boolean` | — |
| defaultChecked | Initial on/off state (uncontrolled) | `boolean` | `false` |
| value | ⚠️ **Alias** for `checked` (antd `@since 5.12.0`) | `boolean` | — |
| defaultValue | ⚠️ **Alias** for `defaultChecked` | `boolean` | — |
| onChange | Callback when the state changes (**two arguments**; not fired when `disabled`) | `(checked: boolean, event: MouseEvent \| KeyboardEvent) => void` | — |
| onClick | Callback on click; ⚠️ receives the **resulting value** (not the native event) and **still fires when `disabled`** | `(checked: boolean, event) => void` | — |
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

### Keyboard

| Key | Behaviour |
|---|---|
| `ArrowLeft` | Turn off (no effect when `disabled`) |
| `ArrowRight` | Turn on (no effect when `disabled`) |
| `Space` / `Enter` | Native `<button>` activation (same as click) |

## Ref

| Name | Type |
|---|---|
| nativeElement | `HTMLButtonElement \| null` |
| focus / blur | `(options?: FocusOptions) => void` / `() => void` |

> ⚠️ antd's `ref` is the `HTMLButtonElement` itself; we expose an object following the
> library convention (`ref.current.focus()` → `ref.value.focus()`).

## Theme (Component Token)

13 tokens, one-to-one with antd's `ComponentToken` interface (exposed as `--apollo-switch-*`).

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

**Why does `onClick` still fire when `disabled`?**
That is rc-switch's legacy semantics (`onClick` receives the resulting value instead of
the event) and we mirror it verbatim. Note that browsers suppress click dispatch on
disabled buttons, so real user interaction never observes it.

**What is the difference between `value` and `checked`?**
None — `value` / `defaultValue` are aliases for `checked` / `defaultChecked` (added by
antd 5.12.0 for form usage). When both are given, `checked` wins.
