---
category: Data Display
title: Card
subtitle: Card
---

A general card container.

## When To Use

- The most basic card container. It can host text, lists, images and paragraphs —
  commonly used on dashboard pages.
- When a group of related information should be grouped in one container and
  visually separated from its surroundings.

## Demos

See [`demo/`](./demo) (**10**, matching antd's user-visible demos).

| demo | Content |
|---|---|
| `basic` | Typical card (with a `size="small"` counterpart) |
| `border-less` | Borderless card via `variant="borderless"` |
| `simple` | Content area only (no head) |
| `flexible-content` | `cover` + `Card.Meta` |
| `in-column` | Used together with grid columns |
| `loading` | `loading` renders a Skeleton inside the body |
| `grid-card` | Content separation via `Card.Grid` |
| `inner` | Inner card via `type="inner"` |
| `tabs` | Card with tabs via `tabList` |
| `meta` | Cover + avatar + title + description |

⚠️ 4 antd demos are **not ported** (gaps in `README.md` §5):
`style-class` (needs `antd-style`) · `component-token` (tokens are build-time artifacts
in a zero-runtime architecture) · `no-body-debug` / `button-alignment-debug`
(marked `debug` upstream, not in the docs body).

## API

### Card

| Property | Description | Type | Default | Global Config |
|---|---|---|---|---|
| title | Card title | `VNodeChild` | — | × |
| extra | Content to render in the top-right corner | `VNodeChild` | — | × |
| cover | Cover content | `VNodeChild` | — | × |
| actions | Action list (each wrapped in `<li><span>` with equal widths) | `VNodeChild[]` | — | × |
| loading | Show a Skeleton instead of the content | `boolean` | `false` | × |
| hoverable | Lift the card on hover | `boolean` | `false` | × |
| size | Card size | `'medium' \| 'small' \| 'middle' \| 'default'` | `medium` | ✅ (`componentSize`) |
| type | Card type (only `'inner'` for now) | `'inner'` | — | × |
| variant | Variant. `'borderless'` drops `-bordered` and uses the tertiary shadow | `'outlined' \| 'borderless'` | `outlined` | ✅ (`card.variant`) |
| tabList | Tab list. ⚠️ `tab` is deprecated, use `label` | `CardTabListType[]` | — | × |
| activeTabKey | Controlled active tab (**mutually exclusive with `defaultActiveTabKey`**) | `string` | — | × |
| defaultActiveTabKey | Initial active tab (uncontrolled) | `string` | — | × |
| tabBarExtraContent | Extra content on the tab bar | `VNodeChild \| { left, right }` | — | × |
| tabProps | Props forwarded to the internal `Tabs` | `TabsProps` | — | × |
| onTabChange | Tab switch callback. ⚠️ This is a **prop**, not an event | `(key: string) => void` | — | × |
| classNames | Semantic class names (7 slots), function form supported | `CardSemanticClassNames \| ((info) => …)` | — | ✅ (`card.classNames`) |
| styles | Semantic styles (7 slots), function form supported | `CardSemanticStyles \| ((info) => …)` | — | ✅ (`card.styles`) |
| prefixCls | Class prefix (**the root prefix itself**, not a suffix) | `string` | from ConfigProvider, falls back to `apollo-card` | × |
| class / style | **Native root attrs** (not Props) | `string \| array \| object` / `CSSProperties` | — | × |
| style | Root inline style (**overrides** `styles.root`) | `CSSProperties` | — | × |
| id | Root element id | `string` | — | × |
| bordered | ⚠️ **Deprecated**, use `variant` | `boolean` | — | × |
| headStyle | ⚠️ **Deprecated**, use `styles.header` | `CSSProperties` | — | × |
| bodyStyle | ⚠️ **Deprecated**, use `styles.body` | `CSSProperties` | — | × |

> ⚠️ Semantic slots **override** the deprecated `headStyle` / `bodyStyle`
> (merge order is `{...headStyle, ...mergedStyles.header}`).

### Events

**None.** `onTabChange` is a **prop** upstream (there is no value/onChange pair, so the
"emit both" rule of `COMPATIBILITY.md` §3 does not apply). ⚠️ This repo's `Tabs` uses
`v-model:activeKey` + a `change` event, but Card keeps the upstream prop form.

### Slots

| Name | Description |
|---|---|
| default | Card content (antd's `children`) |

### Card.Meta

| Property | Description | Type | Default |
|---|---|---|---|
| avatar | Avatar | `VNodeChild` | — |
| title | Title | `VNodeChild` | — |
| description | Description | `VNodeChild` | — |
| classNames | Semantic class names (`root` / `section` / `avatar` / `title` / `description`) | `CardMetaSemanticClassNames \| ((info) => …)` | — |
| styles | Semantic styles (same five slots) | `CardMetaSemanticStyles \| ((info) => …)` | — |
| prefixCls | Class prefix (**the *card* prefix**: `x` ⇒ `x-meta`) | `string` | falls back to `apollo-card` |
| class / style | Native root attrs | `string` / `CSSProperties` | — |

> ⚠️ `avatar` sits **outside** `section`; `title` / `description` sit **inside** it.
> The root has **no** `-rtl` (`Card.Meta` does not read `direction`).

### Card.Grid

| Property | Description | Type | Default |
|---|---|---|---|
| hoverable | Hover highlight. ⚠️ **Defaults to `true`** (unlike `Card`'s `false`) | `boolean` | `true` |
| prefixCls | Class prefix (**the *card* prefix**: `x` ⇒ `x-grid`) | `string` | falls back to `apollo-card` |
| class / style | Native root attrs | `string` / `CSSProperties` | — |

### Ref

All three components expose `{ nativeElement }` (`HTMLDivElement | null`).

> ⚠️ Upstream `Card` is `forwardRef<HTMLDivElement>` (the ref *is* the DOM element), while
> `Card.Grid` / `Card.Meta` are `{ nativeElement }`. This repo normalizes all three to the
> object form (see `README.md` §2 item 1).

### Semantic DOM

| Slot | `Card` target | `Card.Meta` target |
|---|---|---|
| `root` | root `<div class="{prefixCls}">` | root `<div class="{prefixCls}-meta">` |
| `header` / `section` | `<div class="{prefixCls}-head">` | `<div class="{prefixCls}-meta-section">` |
| `body` / `avatar` | `<div class="{prefixCls}-body">` | `<div class="{prefixCls}-meta-avatar">` |
| `extra` / `title` | `<div class="{prefixCls}-extra">` | `<div class="{prefixCls}-meta-title">` |
| `title` / `description` | `<div class="{prefixCls}-head-title">` | `<div class="{prefixCls}-meta-description">` |
| `actions` | `<ul class="{prefixCls}-actions">` | — |
| `cover` | `<div class="{prefixCls}-cover">` | — |

## Theme

### Component Token (13)

| Token | Description | Default |
|---|---|---|
| `headerBg` | Background color of the card header | `transparent` |
| `headerFontSize` | Font size of the card header | `fontSizeLG` |
| `headerFontSizeSM` | Font size of a small card header | `fontSize` |
| `headerHeight` | Height of the card header | `fontSizeLG * lineHeightLG + padding * 2` |
| `headerHeightSM` | Height of a small card header | `fontSize * lineHeight + paddingXS * 2` |
| `actionsBg` | Background color of the actions area | `colorBgContainer` |
| `actionsLiMargin` | Margin of each action item | `${paddingSM}px 0` |
| `tabsMarginBottom` | Bottom margin of the built-in tabs | `-padding - lineWidth` |
| `extraColor` | Text color of the extra area | `colorText` |
| `bodyPaddingSM` | Padding of a small card body | `12` |
| `headerPaddingSM` | Padding of a small card header | `12` |
| `bodyPadding` | Padding of the card body | `paddingLG` |
| `headerPadding` | Padding of the card header | `paddingLG` |

> ⚠️ Upstream writes `token.bodyPadding ?? token.paddingLG` for the last two, but that key
> is **not** part of antd 6's `AliasToken` (a v4 leftover) ⇒ it always resolves to
> `paddingLG`. This repo writes `paddingLG` directly (see `README.md` §2 item 2).

Runtime tuning uses CSS variables: `--apollo-card-header-height` /
`--apollo-card-body-padding` / `--apollo-card-actions-bg` … (13 of them, named the same
way as antd's `--ant-card-*`).
