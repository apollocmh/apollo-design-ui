---
category: Navigation
title: Anchor
subtitle: Anchor
---

Hyperlinks to scroll on one page.

## When To Use

- To display the structure of a page (table of contents) and jump to a section on click.
- To **highlight the current anchor automatically** while scrolling.

## Examples

See [`demo/`](./demo) (**8**, mirroring antd's user-visible demos).

| demo | Description |
|---|---|
| `basic` | The simplest usage |
| `horizontal` | Horizontally aligned anchors (the ink becomes a bottom bar) |
| `onChange` | Listening for anchor link change |
| `onClick` | Clicking an anchor does not record history |
| `replace` | Replace path in browser history |
| `targetOffset` | Scroll offset of the target (takes precedence over `offsetTop`) |
| `targetOffset-per-link` | Per-link offset (higher precedence) |
| `customizeHighlight` | Customize the anchor highlight (`getCurrentAnchor`) |

⚠️ 4 of antd's demos are **not ported** (gaps in `README.md` §5):
`static` (the only difference is scrolling behaviour ⇒ covered by L6) ·
`legacy-anchor` (covered by the L4 `anchor:children` case) ·
`style-class` (depends on `antd-style`) · `component-token` (tokens are build-time artifacts here).

## API

### Props

| Property | Description | Type | Default | Global Config |
|---|---|---|---|---|
| items | Data source (recommended). Each entry is the link fields plus `key` and an optional nested `children` | `AnchorLinkItemProps[]` | — | × |
| direction | Direction | `'vertical' \| 'horizontal'` | `'vertical'` | × |
| offsetTop | Offset of the container top (also feeds `Affix` and the `maxHeight` calc) | `number` | — | × |
| bounds | Tolerance of the hit test | `number` | `5` | × |
| targetOffset | Scroll offset of the target (**takes precedence over** `offsetTop`) | `number` | — | × |
| affix | Whether to fix the anchor. ⚠️ Defaults to **on** | `boolean \| Omit<AffixProps,'offsetTop'\|'target'>` | `true` | × |
| showInkInFixed | Whether to show the ink when not affixed | `boolean` | `false` | × |
| getContainer | Scroll container. Falls back to ConfigProvider's `getTargetContainer`, then `window` | `() => HTMLElement \| Window` | — | × |
| getCurrentAnchor | Rewrites the **highlight** (does not change the `onChange` payload) | `(activeLink: string) => string` | — | × |
| onChange | Current anchor changed (by scroll or click) | `(currentActiveLink: string) => void` | — | × |
| onClick | Click on a link. Called **before** scrolling. ⚠️ A prop with a **custom signature**, **not** a DOM event | `(e: MouseEvent, link: { title, href }) => void` | — | × |
| replace | Use `replaceState` instead of `pushState` | `boolean` | — | × |
| classNames | Semantic class names (`root` / `item` / `itemTitle` / `indicator`); the function form is supported | `AnchorSemanticClassNames \| ((info) => …)` | — | ✅ (`anchor.classNames`) |
| styles | Semantic styles (four slots); the function form is supported | `AnchorSemanticStyles \| ((info) => …)` | — | ✅ (`anchor.styles`) |
| prefixCls | Class name prefix | `string` | from ConfigProvider, fallback `apollo-anchor` | × |
| class / style | **Native attrs on the root (inner wrapper div)**, not Props; caller `style` overrides the computed `max-height` | `string \| array \| object` / `CSSProperties` | — | × |

#### AnchorLinkItemProps

| Field | Description | Type |
|---|---|---|
| href | **Required**. Internal anchors look like `#section-1` | `string` |
| title | The displayed text | `VNodeChild` |
| key | Unique identifier | `string \| number` |
| target | `<a target>` | `string` |
| className | Applied to `.{prefixCls}-link` | `string` |
| replace | Overrides `Anchor`'s `replace` for this link | `boolean` |
| targetOffset | Per-link scroll offset (also used for scroll detection) | `number` |
| children | **Nested** items. ⚠️ Not supported in the horizontal direction | `AnchorLinkItemProps[]` |

### Events

| Name | Description | Parameters |
|---|---|---|
| change | Current anchor changed (the **same path** as the `onChange` prop) | `(currentActiveLink: string)` |

⚠️ **There is no `click` event** — `onClick` is a prop with a custom signature (see above).
Declaring it as a component event would stop `@click` from being attached to the root element.

### Slots

| Name | Description |
|---|---|
| default | Link content. Corresponds to antd's **deprecated** `children` (use `items`; passing it emits a deprecation warning) |

### Sub-components

| Name | Description |
|---|---|
| `Anchor.Link` (also exported as `AnchorLink`) | A single link. Same fields as `AnchorLinkItemProps` minus `key` / `children` (the latter goes through the default slot) |

## Theme

### Component Token

**2** (both alias-derived):

| token | Default | Used for |
|---|---|---|
| `linkPaddingBlock` | `paddingXXS` | `.{p}-link`'s `padding-block` |
| `linkPaddingInlineStart` | `padding` | `.{p}-link`'s `padding-inline-start` |

There are **4 more `mergeToken` derived values** (users **cannot** override them via
`theme.components.Anchor`):

| Derived token | Computation | Used for |
|---|---|---|
| `holderOffsetBlock` | `paddingXXS` | the wrapper's `margin-block-start` / `padding-block-start` |
| `anchorPaddingBlockSecondary` | `paddingXXS / 2` | nested `.{p}-link`'s `padding-block` |
| `anchorTitleBlock` | `fontSize / 14 * 3` | `.{p}-link-title`'s `margin-block-end` |
| `anchorBallSize` | `fontSizeLG / 2` | ⚠️ **No consumer here nor upstream** (kept only for parity) |

## Design Notes

- **Current anchor rule**: for each link, extract the id with `/#([^\t\r\n\f\v]+)$/` ⇒
  `document.getElementById` ⇒ `getOffsetTop(target, container)` ⇒ keep those with
  `top <= (per-link targetOffset ?? global offsetTop) + bounds` ⇒ pick the one with the
  **largest `top`**. If none matches, the result is an empty string (no highlight).
- **`getOffsetTop` has three branches**: empty `getClientRects()` ⇒ `0`; non-zero width/height
  ⇒ relative to the container; otherwise `rect.top`.
- **The scroll listener depends on `JSON.stringify(links)`** and **not** on `getContainer` —
  changing the container prop does **not** re-attach (upstream behaviour, replicated).
- **The highlight is not taken over during a scroll animation**: `handleScroll` returns early
  while animating, and clicking the same link again does not re-emit `onChange`.
- **`AnchorLink` takes its prefix from the ConfigProvider root prefix**, independent of
  `Anchor`'s `prefixCls` prop (upstream behaviour).
- **Zero ARIA**: semantics come entirely from the **native `<a href>`**; the component adds no
  `role` / `aria-current`. This is intentional upstream and is pinned by L5.
- **There is no `ref` / `expose`** (upstream `Anchor` is a `React.FC` without forwardRef).
