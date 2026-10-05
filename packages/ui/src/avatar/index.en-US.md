---
category: Data Display
title: Avatar
subtitle: Avatar
---

Avatars can be used to represent people or objects. They support images, icons, or characters.

## When To Use

- When showing a user/account avatar.
- When representing an entity with an image, an icon, or characters.

## Demos

See [`demo/`](./demo) (**9**, matching antd's user-visible demos).

| demo | Content |
|---|---|
| `basic` | Three sizes × two shapes |
| `type` | Icon / character / image |
| `dynamic` | Auto font size for long strings (`gap` sets the side padding) |
| `badge` | With badge |
| `group` | `Avatar.Group` (incl. `max.count` truncation) |
| `max-count` | `max.count` includes the overflow indicator |
| `fallback` | Fallback when the image is missing |
| `toggle-debug` | Compute character alignment while hidden |
| `responsive` | Responsive size |

⚠️ 1 antd demo is **not ported** (gap in `README.md` §5):
`component-token` (tokens are build-time artifacts in a zero-runtime architecture).

## API

### Avatar

| Property | Description | Type | Default |
|---|---|---|---|
| shape | Shape | `'circle' \| 'square'` | `Avatar.Group`'s `shape`, then `'circle'` |
| size | Size | `SizeType \| 'default'(deprecated) \| number \| ScreenSizeMap` | `Avatar.Group`'s `size` → `ConfigProvider.componentSize` → `'medium'` |
| gap | Side padding of characters (px) | `number` | `4` |
| src | Image source. A string renders `<img>`; a VNode is rendered as-is | `VNodeChild` | — |
| srcSet | `<img>` `srcset` | `string` | — |
| draggable | `<img>` `draggable` | `boolean \| 'true' \| 'false'` | — |
| icon | Icon | `VNodeChild` | — |
| alt | `<img>` `alt`. ⚠️ **Omitting it leaves the image without alt** (screen readers and axe will complain) | `string` | — |
| crossOrigin | `<img>` `crossorigin` | `'' \| 'anonymous' \| 'use-credentials'` | — |
| onClick | Click callback. ⚠️ This is a **prop**, not an event | `(e?: MouseEvent) => void` | — |
| onError | Image error callback. ⚠️ **Return `false` to prevent the built-in fallback** (check is `!== false`) | `() => boolean` | — |
| prefixCls | Class name prefix | `string` | from ConfigProvider |
| class / style | **Native root attrs** (not Props) | `string \| array \| object` / `CSSProperties` | — |

> ⚠️ **Rendering priority is five-way exclusive**: string `src` → `src` is a VNode → `icon` → characters (scaled) → characters (first frame, `opacity:0`).

### Avatar.Group

| Property | Description | Type |
|---|---|---|
| max | Overflow config | `{ count?, style?, popover? }` |
| size | Forwarded to every child avatar (via context) | `AvatarSize` |
| shape | Forwarded to every child avatar (via context) | `'circle' \| 'square'` |
| maxCount / maxStyle / maxPopoverPlacement / maxPopoverTrigger | ⚠️ **All deprecated**, use `max={{ … }}` | |

> ⚠️ No truncation happens when `max.count` is `0` (or `>=` the number of children).
> ⚠️ A child's own `size` / `shape` **overrides** the value forwarded by the Group.

### Ref

Both components expose `{ nativeElement }` (`HTMLSpanElement` for `Avatar`, `HTMLDivElement` for `Avatar.Group`).

## Theme

### Component Token (12)

| Token | Description | Default |
|---|---|---|
| `containerSize` / `containerSizeLG` / `containerSizeSM` | Avatar size (large/small) | `controlHeight` / `controlHeightLG` / `controlHeightSM` |
| `textFontSize` / `textFontSizeLG` / `textFontSizeSM` | Font size of avatars | `fontSize` |
| `iconFontSize` / `iconFontSizeLG` / `iconFontSizeSM` | Font size of avatar icons | `Math.round((fontSizeLG + fontSizeXL) / 2)` / `fontSizeHeading3` / `fontSize` |
| `groupSpace` | Spacing between avatars in a group | `marginXXS` |
| `groupOverlapping` | Overlapping of avatars in a group (**negative**) | `-marginXS` |
| `groupBorderColor` | Border color of avatars in a group | `colorBorderBg` |

Runtime tuning uses CSS variables: `--apollo-avatar-container-size` / `--apollo-avatar-group-overlapping` …
(12 of them, named the same way as antd's `--ant-avatar-*`).
