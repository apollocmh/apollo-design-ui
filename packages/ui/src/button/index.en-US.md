---
category: General
title: Button
subtitle: Button
---

A button triggers an immediate action.

## When To Use

- To start an action: submit, confirm, delete, navigate.
- Put **only one** primary button (`type="primary"`) in an action area; use secondary
  buttons for the rest.

## Examples

See [`demo/`](./demo) — 12 demos covering type / size / loading / disabled / danger /
ghost / block / icon / shape / color-variant / href / semantic.

| demo | content |
|---|---|
| `basic` | the five `type` values; the last one demos auto spacing for two Chinese chars |
| `size` | `large` / default (`middle`) / `small` |
| `loading` | boolean form and `{ delay }` form |
| `disabled` | including the `<a>` branch (with `href`) |
| `danger` | `danger` × the five `type` values |
| `ghost` | ghost button (for colored backgrounds) |
| `block` | full width of the parent |
| `icon` | `icon` prop / `icon` slot / `iconPlacement` / icon only |
| `shape` | `circle` / `round` / `square` |
| `color-variant` | the v6 `color` + `variant` API |
| `href` | renders an `<a>` |
| `semantic` | semantic `classNames` / `styles` |

## API

### Props

| Property | Description | Type | Default |
|---|---|---|---|
| type | legacy sugar; resolved into `color` + `variant` | `'default' \| 'primary' \| 'dashed' \| 'link' \| 'text'` | `'default'` |
| color | semantic or preset color (16 values) | `ButtonColorType` | — |
| variant | visual variant | `'outlined' \| 'dashed' \| 'solid' \| 'filled' \| 'text' \| 'link'` | — |
| icon | icon (since v6 it is a **node**, not a string name). A **component** is also accepted (see below) | `ButtonIcon` = `VNodeChild \| Component` | — |
| iconPlacement | icon position | `'start' \| 'end'` | `'start'` |
| ~~iconPosition~~ | ⚠️ deprecated, use `iconPlacement` | `'start' \| 'end'` | — |
| shape | shape | `'default' \| 'circle' \| 'round' \| 'square'` | `'default'` |
| size | size. `middle` emits **no** class | `'small' \| 'middle' \| 'large'` | ConfigProvider `componentSize` |
| disabled | disabled. Merged with `??` ⇒ explicit `false` can turn off a parent `true` | `boolean` | — |
| loading | loading state | `boolean \| { delay?: number; icon?: ButtonIcon }` | `false` |
| ghost | ghost button. Degrades a `solid` variant to `outlined` | `boolean` | `false` |
| danger | danger button | `boolean` | `false` |
| block | fill the parent width | `boolean` | `false` |
| href | when set, renders an `<a>` | `string` | — |
| htmlType | native `type` of `<button>` | `'submit' \| 'button' \| 'reset'` | `'button'` |
| autoInsertSpace | insert a space between two Chinese characters | `boolean` | `true` |
| prefixCls | class name prefix | `string` | from ConfigProvider, falls back to `apollo-btn` |
| className | root class name | `string` | — |
| rootClassName | also on the root (after `className`) | `string` | — |
| style | root inline style. **Overrides `styles.root`** | `CSSProperties` | — |
| classNames | semantic class names (**object form only**) | `ButtonSemanticClassNames` | — |
| styles | semantic styles (**object form only**) | `ButtonSemanticStyles` | — |

### Events

| Name | Description | Arguments |
|---|---|---|
| click | click. **Not emitted while loading / disabled** (and `preventDefault` is called) | `(event: MouseEvent)` |

### Slots

| Name | Description |
|---|---|
| default | button content |
| icon | icon. The `icon` prop takes precedence over this slot |

> **Passing a component to `icon`** (platform difference, same ruling as `Empty`'s `image`)
>
> antd's `icon` is `React.ReactNode`, and its examples write `icon={<SearchOutlined />}` —
> in React that is an **already-evaluated element**. Vue has no such thing; its counterpart
> is the **component itself**, so `Component` is accepted here as well:
>
> ```vue
> <!-- ✅ equivalent to the antd example -->
> <Button type="primary" :icon="SearchOutlined">Search</Button>
> <!-- ✅ the VNode form works too (identical output) -->
> <Button type="primary" :icon="h(SearchOutlined)">Search</Button>
> ```
>
> ⚠️ The slot still only accepts `() => VNodeChild`; pass components through the prop:
> `<template #icon><SearchOutlined /></template>`.

### Semantic slots

`classNames` / `styles` each have three slots: `root` / `icon` / `content`.

Merge order (low → high):

```
ConfigProvider.button.classNames/styles
  → component classNames / styles
  → className / rootClassName / style (on the root)
```

**`style` overrides `styles.root`** (same as antd's merge order).

⚠️ The **function form is not supported** (`classNames` / `styles` accept objects only) —
per open decision `empty-semantic-fn` = B, consistent with divider / empty / space / spin.

### Type exports

`ButtonProps`, `ButtonRef`, `ButtonConfig`, `ButtonType`, `ButtonShape`, `ButtonSize`,
`ButtonColorType`, `ButtonVariantType`, `ButtonHTMLType`, `ButtonIcon`,
`ButtonIconPlacement`, `ButtonLoading`, `ButtonSemanticType`, `ButtonSemanticClassNames`,
`ButtonSemanticStyles`, `ButtonSlot`.

### ref

| Name | Description |
|---|---|
| nativeElement | the root element (`<button>` or `<a>`). `null` before first render |

### Utility exports

| Name | Description |
|---|---|
| `genButtonStyle(prefixCls)` | builds the CSS text for that prefix (for custom `prefixCls`) |
| `prepareComponentToken(token)` | default Component Token computation (key-by-key identical to antd's, minus `solidTextColor`). ⚠️ deep import from `button/style/token`; not re-exported from `button/index.ts` |

## Design Notes

### `type` vs `color` + `variant`

`type` is the v5 API; in v6 it is resolved into `color` + `variant`:

| type | color | variant |
|---|---|---|
| `primary` | `primary` | `solid` |
| `default` | `default` | `outlined` |
| `dashed` | `default` | `dashed` |
| `text` | `default` | `text` |
| `link` | `link` | `link` |

⚠️ `color` **and** `variant` together win over `type` / `danger`.
Passing only one of them has no effect (it falls back to `default` / `outlined`).
⚠️ `filled` has no mapping in `ButtonTypeMap` ⇒ it can only be set via `variant`.

### Two inconsistencies in class names (upstream behavior, not typos)

- `-dangerous` uses the **raw `danger` prop**
- `-color-{x}` rewrites `danger` into `dangerous`

So `color="danger"` without the `danger` prop yields `-color-dangerous` but **no** `-dangerous`.

### The two `loading` forms

| Form | Behavior |
|---|---|
| `true` | enters loading immediately |
| `{ delay: 1000 }` | enters loading **after 1000ms** (anti double-click) and **never resets automatically** |
| `{ delay: 0 }` / `{}` | immediate (`delay <= 0` means immediate) |

Leaving the loading state requires the `loading` prop itself to change back.

### Two Chinese characters

With `autoInsertSpace` (default `true`), content that is **exactly** two Chinese characters
gets a gap between them (plus the `-two-chinese-chars` class). The test is
`textContent` matching `/^[\u4E00-\u9FA5]{2}$/`.

⚠️ Not applied to `text` / `link` variants, when an icon is present, or while loading.
⚠️ The implementation differs from antd (antd joins `确定` into `确 定`; we use
`letter-spacing` on `::first-letter`) — visually equivalent, different DOM text.
Registered as deviation D7.

### `<a>` and `<button>` express `disabled` **asymmetrically**

| Branch | Expression |
|---|---|
| `<button>` | native `disabled` |
| `<a>` (with `href`) | `href` removed + `tabindex="-1"` + `aria-disabled="true"` + `-disabled` class |

`<a>` has no native `disabled`, so the combination is the only way.

### Accessibility

- Icon-only buttons **must** be given an `aria-label` by the caller — the component never
  invents one.
- `loading` emits no `aria-busy` / `aria-live` (antd does not either); registered as a gap.

### Component Token

57 tokens (antd 6.6.4 returns 58; the only missing one is `solidTextColor`, see README §7.1).
⚠️ They **cannot** be overridden at runtime yet (`tokens.css` only declares Alias-level
variables) — a repo-wide gap; use `styles.root.*` for now.

### Importing styles

```ts
import '@apollo-design/theme/tokens.css';    // design tokens, must come first
import '@apollo-design/ui/button/style.css'; // on demand
// or
import '@apollo-design/ui/style.css';        // everything
```

With a custom `prefixCls` (e.g. `my-app`), build the CSS yourself via
`genButtonStyle('my-app')` — the static output only covers the `apollo` and `ant` prefixes.
