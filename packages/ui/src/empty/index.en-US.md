---
category: Data Display
title: Empty
subtitle: Empty state
---

Placeholder shown when there is no data.

## When to use

- Render it instead of leaving a blank area when a data set is empty.
- Or use it as an onboarding slot — pass a "Create" button through the default slot.

## Demos

See [`demo/`](./demo) (6 demos, one-to-one with antd).

## API

### Props

| Property | Description | Type | Default |
|---|---|---|---|
| prefixCls | Class name prefix | `string` | from ConfigProvider, falls back to `apollo` |
| className | Class name of the root element | `string` | — |
| rootClassName | Also applied to the root element (after `className`) | `string` | — |
| style | Inline style of the root element. **Overrides `styles.root`** | `CSSProperties` | — |
| image | Custom illustration. A string renders as `<img draggable="false">` | `VNodeChild \| Component` | `PRESENTED_IMAGE_DEFAULT` |
| imageStyle | ⚠️ Deprecated, use `styles.image`. Merged with `styles.image`, which wins | `CSSProperties` | — |
| description | Description text. `false` hides the description block | `VNodeChild` | locale `Empty.description` (`No data` for `en_US`) |
| classNames | Semantic class names | `EmptySemanticClassNames \| ((info: { props }) => EmptySemanticClassNames)` | — |
| styles | Semantic styles | `EmptySemanticStyles \| ((info: { props }) => EmptySemanticStyles)` | — |

### Slots

| Name | Description |
|---|---|
| default | Footer content. Renders `<prefix>-footer` when non-empty |

### Static properties / named exports

| Name | Description |
|---|---|
| `Empty.PRESENTED_IMAGE_DEFAULT` | Default illustration (184×152) |
| `Empty.PRESENTED_IMAGE_SIMPLE` | Simple illustration (64×41). Adds a `<prefix>-normal` class to the root |

Both are also available as named exports:
`import { PRESENTED_IMAGE_SIMPLE } from '@apollo-design/ui'`.

> ⚠️ The `-normal` check is **reference equality** (`image === PRESENTED_IMAGE_SIMPLE`),
> not "is it 64×41". A look-alike component you build yourself will not trigger it.

### Semantic slots

`classNames` / `styles` each have four slots: `root` / `image` / `description` / `footer`.

Merge priority (low → high):

```
ConfigProvider.empty.classNames/styles
  → component classNames / styles
  → className / rootClassName / style (applied to the root element)
```

Note that **`style` overrides `styles.root`** — that is antd's merge order, matched one-to-one.

### Type exports

`EmptyProps`, `EmptyRef`, `EmptyConfig`, `EmptySemanticType`, `EmptySemanticAllType`,
`EmptySemanticClassNames`, `EmptySemanticStyles`, `EmptySemanticValue`, `EmptyImage`.

### ref

| Name | Description |
|---|---|
| nativeElement | The root `div`. `null` before the first render |

## Design notes

### Two different checks for `description`

| Check | Purpose |
|---|---|
| `description !== undefined` | Picks the **value**: a provided value wins (including `0` and `''`); locale is only used when omitted |
| `isRenderable(description)` | Decides **whether to render**: `false` / `''` / `null` render no description block |

So `:description="''"` takes `''` (locale is not consulted) but renders nothing.

### Illustrations and themes

The illustration's colors are emitted as `var(--apollo-*)`, so dark / compact themes
follow automatically — no extra work per theme.

### Importing styles

```ts
import '@apollo-design/theme/dist/tokens.css'; // theme variables first
import '@apollo-design/ui/empty/style.css';    // per component
// or
import '@apollo-design/ui/style.css';          // all components
```

With a custom `prefixCls` (e.g. `my-app`), generate the CSS yourself via
`genComponentCss('empty', 'my-app')` — the static artifacts only cover `apollo` and `ant`.
