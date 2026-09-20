---
category: General
title: Typography
subtitle: Typography
---

Basic text formatting.

## When To Use

- When you need to display titles, paragraphs, or list content.
- When you need text with a semantic color (`secondary` / `success` / `warning` / `danger`),
  a disabled state, or decorations (`strong` / `underline` / `delete` / `code` / `mark` /
  `keyboard` / `italic`).
- When you need to **ellipsize** long text (single line / multiple lines / expandable),
  **copy** it, or **edit it inline**.

## Examples

See [`demo/`](./demo) (7 demos, one-to-one with antd's **user-facing** demo topics).

| demo | What it shows |
|---|---|
| `basic` | Basic: the `Title` / `Paragraph` / `Text` / `Link` quartet |
| `title` | Titles: `level` 1~5 (⚠️ an invalid value falls back to `h1` **and warns**) |
| `text` | Text and the seven decorations (⚠️ the nesting order is a contract) |
| `ellipsis` | Ellipsis: the CSS path and the JS binary-search path |
| `copyable` | Copyable: `text` / `icon` / `tooltips` / `format` |
| `editable` | Editable: `triggerType`, Enter to save / Esc to cancel / blur to save |
| `semantic` | Semantic `classNames` / `styles` (object and function forms) |

## API

### Components

```ts
import { Typography } from '@apollo-design/ui';

const { Text, Title, Paragraph, Link } = Typography;   // same shape as antd
```

`Typography.Text` and the named export `Text` point to the **same object**.

⚠️ The `Typography` root itself does **not** support `type` / `disabled` / `ellipsis` /
`copyable` / `editable` or the seven decorations — passing them only leaks unknown attributes
onto the root element and produces **no class names** (antd behaves the same way).

### Shared Props (all 5 components)

| Property | Description | Type | Default |
|---|---|---|---|
| prefixCls | Class name prefix | `string` | From ConfigProvider, falling back to `apollo` |
| className | Class name of the root element | `string` | — |
| rootClassName | Also applied to the root element (after `className`) | `string` | — |
| style | Inline style of the root element. **Overrides `styles.root`** | `CSSProperties` | — |
| classNames | Semantic class names (object or function) | `TypographySemanticValue<TypographySemanticClassNames>` | — |
| styles | Semantic styles (object or function) | `TypographySemanticValue<TypographySemanticStyles>` | — |
| direction | Text direction | `'ltr' \| 'rtl'` | From ConfigProvider |
| component | Tag to render (`@internal`) | `string` | Each component's own default |

### Component-specific Props (`Text` / `Title` / `Paragraph` / `Link`)

| Property | Description | Type | Default |
|---|---|---|---|
| type | Semantic color | `'secondary' \| 'success' \| 'warning' \| 'danger'` | — |
| disabled | Disabled state. ⚠️ Only adds a class name, **no** `aria-disabled` (same as antd) | `boolean` | `false` |
| ellipsis | Ellipsis capability. `Text` / `Link` narrow the type (see below) | `boolean \| EllipsisConfig` | — |
| copyable | Copy capability | `boolean \| CopyConfig` | — |
| editable | Edit capability | `boolean \| EditConfig` | — |
| strong / underline / delete / code / mark / keyboard / italic | The seven decoration switches | `boolean` | `false` |
| actions | Position of the action area (since 6.4.0) | `{ placement?: 'start' \| 'end' }` | `'end'` |
| title | Native `title`. Also a **candidate** for the ellipsis tooltip text | `string` | — |
| level | **`Title` only**: heading level, mapped to `h1`~`h5` | `1 \| 2 \| 3 \| 4 \| 5` | `1` |
| rel / target | **`Link` only** | `string` | — |

⚠️ `Title` omits `strong` (a heading is already bold); `Text`'s `ellipsis` does not support
`expandable` / `rows` / `onExpand` (inline text has no notion of multiple lines); `Link`'s
`ellipsis` is **boolean only**. All three are expressed in the type surface, and passing them
at runtime emits a development warning.

### `ellipsis` config

| Property | Description | Type | Default |
|---|---|---|---|
| rows | Number of rows to display | `number` | `1` |
| expandable | Whether it can be expanded. `'collapsible'` keeps it collapsible afterwards | `boolean \| 'collapsible'` | `false` |
| suffix | Text appended after the ellipsis | `string` | — |
| symbol | Content of the expand/collapse button (the function form receives `expanded`) | `VNodeChild \| ((expanded: boolean) => VNodeChild)` | — |
| defaultExpanded | Uncontrolled initial expanded state | `boolean` | `false` |
| expanded | Controlled expanded state | `boolean` | — |
| onExpand | Fired when expanding/collapsing | `(e, { expanded }) => void` | — |
| onEllipsis | Fired when the ellipsis state **changes** (a repeated identical result is not re-reported) | `(ellipsis: boolean) => void` | — |
| tooltip | Tooltip when ellipsized. `true` means `editable.text ?? children` | `VNodeChild \| { title?: VNodeChild }` | — |

### `copyable` / `editable` config

| `copyable` | Description | Type | Default |
|---|---|---|---|
| text | Text to copy. The function form may be async (returns `Promise<string>`) | `string \| (() => string \| Promise<string>)` | children |
| onCopy | Fired after a successful copy | `(event?) => void` | — |
| icon | Icon. The array form is `[notCopied, copied]` | `VNodeChild \| [VNodeChild, VNodeChild]` | — |
| tooltips | Tooltip. The array form is `[notCopied, copied]`. `false` disables it | `VNodeChild \| [VNodeChild, VNodeChild]` | — |
| format | Clipboard format | `'text/plain' \| 'text/html'` | — |
| tabIndex | `tabIndex` of the button | `number` | — |

| `editable` | Description | Type | Default |
|---|---|---|---|
| text | Initial value. Falls back to children (only when it is a string) | `string` | — |
| editing | Controlled editing state | `boolean` | — |
| icon | Edit icon | `VNodeChild` | Pencil icon |
| tooltip | Tooltip of the edit icon. `false` disables it | `VNodeChild \| false` | — |
| onStart / onChange / onCancel / onEnd | Fired on entering edit mode / save / cancel / after Enter saves | `() => void` / `(value: string) => void` / … | — |
| maxLength | Maximum length of the input | `number` | — |
| autoSize | Auto-resize the input | `boolean \| AutoSizeType` | `true` |
| triggerType | How edit mode is triggered | `('icon' \| 'text')[]` | `['icon']` |
| enterIcon | Confirm icon. `null` means do not render it | `VNodeChild` | — |
| tabIndex | `tabIndex` of the edit icon | `number` | — |

### Slots

| Name | Description |
|---|---|
| default | The text content. ⚠️ It is also the text source for `copyable` / `editable` / `ellipsis` |

### Semantic slots

`classNames` / `styles` each have four slots: `root` (root element) / `actions` (the action-area
`span`) / `action` (each action button) / `textarea` (the input, **edit mode only**).

`classNames` are **concatenated**, `styles` are **overridden**, and the `style` prop comes
**after** `styles.root` (so `style` overrides `styles.root`).

### Ref

| Name | Type | Description |
|---|---|---|
| nativeElement | `HTMLElement \| null` | The root element. `null` before the first render (antd's type does not reflect this) |

## Design notes

### The decoration nesting order is a contract

From innermost to outermost:

```
strong → u → del → code → mark → kbd → i
```

Getting the order wrong **looks identical on screen**, but it decides whether a `code` inside
a `mark` keeps its own background. The only observation point is L4's node-by-node comparison
(swapping any two lines immediately reports a tag mismatch).

### The `-link` criterion is `component === 'a'`

Not "has a `type`". So `<Link type="danger">` carries both `-danger` and `-link`, while
`<Text component="a">` still renders a `span` (`Text` explicitly overrides `component`) and
therefore gets **no** `-link`.

### The two ellipsis paths

| Condition | Which path | What the ellipsis looks like |
|---|---|---|
| `rows` and **no** `suffix` / `expandable` / `onEllipsis` / `copyable` / `editable` | CSS (`text-overflow` or `-webkit-line-clamp`) | Drawn by the browser |
| Any of the above present | **JS binary search** (hidden containers measure character by character) | A `<span aria-hidden>` inserted by the component |

⚠️ On the JS path the root element gets an `aria-label` (the **full** text) and the visible
content is wrapped in an `aria-hidden` layer — so a screen reader reads the whole text rather
than the truncated fragment. On the CSS path there is **no** `aria-label` (the accessible name
is derived by the browser from the truncated text — upstream behaviour).

### The three key-handling gates of `editable`

Missing any one of them makes Chinese users or `Ctrl+Enter` users submit by accident:

1. `confirmChange` **trims**, while `onChange` does not (upstream behaviour).
2. **No submit while an IME composition is in progress.**
3. **No submit for Enter with a modifier key** (`Ctrl+Enter` means "insert a newline").

In addition, "returning focus to the edit icon after leaving edit mode" is **mandatory** —
without it a keyboard user's focus falls back to `body`.

### Component Tokens

| Token | Default | Description |
|---|---|---|
| `titleMarginTop` | `'1.2em'` | Margin top of title |
| `titleMarginBottom` | `'0.5em'` | Margin bottom of title |

⚠️ **Known gap**: antd lets you override these two tokens through
`theme.components.Typography`; this repository currently lets you override **neither** — both are
**literal** tokens that the zero-runtime pipeline inlines as constants with no corresponding CSS
variable, because `packages/theme`'s `tokens.css` only declares Alias-layer variables.
This is a repository-wide pipeline gap (divider and spin share it); see
[`README.md`](./README.md) §5.5 and §7.3.

Equivalent stopgap: use `styles.root` to override the margin effect.

### Importing styles

```ts
import '@apollo-design/theme/tokens.css';      // theme variables, must come first
import '@apollo-design/ui/style.css';          // aggregate styles (includes typography)
```

⚠️ **Only `@apollo-design/ui/empty/style.css` is currently registered in `exports` for
per-component imports.** `@apollo-design/ui/typography/style.css` throws
`ERR_PACKAGE_PATH_NOT_EXPORTED` (measured) — the build artifact `dist/typography/style.css`
exists, but `packages/ui/package.json`'s `exports` does not register that subpath.
`divider` and `spin` are in the same situation; it is a repository-wide gap, and this
component's file domain does not include `packages/ui/package.json`, so it is left to that
file's owner.

With a custom `prefixCls` (e.g. `my-app`) there is **no** public entry point to produce the CSS:
the package root exports `genComponentStyleSheet('typography')` (looked up by **component name**,
using the fixed `apollo` / `ant` prefixes internally). `genTypographyStyle(prefixCls)` exists in
`packages/ui/src/typography/style/index.ts` but is **not** re-exported from the package root —
using a custom prefix requires importing the source path directly. This is a known API-surface
gap, registered in [`README.md`](./README.md) §7.3.

## Known gaps

1. **Floating tooltips** (the bubble for `copyable.tooltips` / `ellipsis.tooltip` /
   `editable.tooltip`) are not visible — the `Tooltip` component has not landed yet. When not
   hovering, the DOM matches antd character by character; only the hover half is missing.
2. **`editable`'s `autoSize` has no effect** and the input carries no `apollo-input*` class
   names — it is a native `<textarea>` (the `Input` component has not landed yet).
3. **The type of `ellipsis.tooltip`** only declares `title` (to be completed once `Tooltip`
   lands).
4. **Icon base styles are not wired up** — `@apollo-design/icons`' `getIconStyle` is exported
   but has no consumer, so the icons inside the copy / edit / expand buttons differ from antd
   at a **sub-pixel** level. This is the root cause of the three `copyable` cases that are not
   `exact` in L6 visual regression; registered in [`README.md`](./README.md) §7.3 (G7).
5. The remaining gaps (`h1~h6`/`p` margin reset, form-control font reset, no dark/compact
   visual comparison, …) are registered one by one in [`README.md`](./README.md) §7.3.
