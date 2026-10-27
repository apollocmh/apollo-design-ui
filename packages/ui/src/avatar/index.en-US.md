---
category: Data Display
title: Avatar
subtitle: Avatar
---

Represent a person or object using an image, icon or characters. Static avatars do not enter the Tab order; use a native link or button for an action.

## Demos

Ten examples cover size/shape, content types, dynamic characters/gap, badges, groups, overflow counts, image fallback, hidden layouts, responsive sizes and current component tokens. The max-count example switches whether its visible budget includes the indicator; `max.count` itself always counts visible children only.

## Avatar Props

| Property | Description | Type | Default |
|---|---|---|---|
| prefixCls | Local component class prefix | `string` | current ConfigProvider |
| shape | Local shape overrides Group | `'circle' \| 'square'` | Group → `'circle'` |
| size | Local size overrides Group and global size; responsive maps use the largest matching configured breakpoint | `SizeType \| 'default' \| number \| ScreenSizeMap` | Group → componentSize → `'medium'` |
| gap | Horizontal space reserved when scaling default content, px | `number` | `4` |
| src | Image URL or complete VNode data; failures fall back to icon/default | `VNodeChild` | — |
| srcSet | Native image srcset; changing it retries the image | `string` | — |
| draggable | Native image draggable attribute | `boolean \| 'true' \| 'false'` | — |
| icon | Complete icon data | `VNodeChild` | — |
| alt | Native alternative; decorative by default, provide a name when identity matters | `string` | `''` |
| crossOrigin | Native image crossorigin | `'' \| 'anonymous' \| 'use-credentials'` | — |
| beforeFallback | Synchronous hook after error; return false to retain the failed image | `(event: Event) => boolean \| void` | — |

Native class/style/id, data/ARIA and other native listeners target the stable span root. String, array and object styles override size, theme and Provider styles. Default text is visible during SSR; root and content resize observation updates its scale after mounting.

## Slots / Events

| Slot | Content |
|---|---|
| image | Complete image content; its presence overrides src, including an intentionally empty slot |
| icon | Complete icon content when no image exists; its presence overrides icon data, including an empty slot |
| default | Characters or complete business content when no image/icon exists |

| Event | Payload | Behavior |
|---|---|---|
| click | native `MouseEvent` | Once per root click; merged listeners and `.once` work |
| error | native image `Event` | Once per image failure; listener return values do not cancel fallback, use beforeFallback |

## AvatarGroup / Avatar.Group

Both exports identify the same installable component.

| Property | Description | Type |
|---|---|---|
| prefixCls | Group class prefix | `string` |
| size | Current inherited size, including numbers, zero and responsive maps; children may override it | `AvatarSize` |
| shape | Inherited shape | `'circle' \| 'square'` |
| max | `{count?, style?, popover?}`: visible count, indicator style and Popover configuration | `AvatarGroupMax` |

`max.count` excludes the `+N` indicator. Zero, missing, negative and nonfinite counts are unlimited; positive fractions are floored. Direct default-slot children count after flattening Fragments and skipping comments. Render multiple avatars with a direct `v-for`; Group does not inspect a business component's internal output.

Overflow owns a native button. Default hover also supports click and Enter/Space; Escape closes while preserving button focus. Explicit focus triggers and controlled `max.popover.open` remain Popover configuration. `max.popover.content` may override popup content. Object/function classNames, styles, containers, triggers and open callbacks are forwarded; rootClassName adds a popup class. Hidden content is destroyed by default; `destroyOnHidden:false` preserves its state.

Native Group class/style/attrs target its div. Both components expose only nullable `nativeElement` (span/div). There is no avatar business model or additional instance method.

## Component Token

Configure current tokens through `ConfigProvider :theme="{components:{Avatar:{…}}}"`. Source replacement/removal, nested Providers and all four algorithms apply to each avatar and overflow content. Native style variables override their owning root.

| Token | Type | Default source |
|---|---|---|
| containerSize / containerSizeLG / containerSizeSM | `number` | controlHeight / controlHeightLG / controlHeightSM |
| textFontSize / textFontSizeLG / textFontSizeSM | `number` | fontSize |
| iconFontSize / iconFontSizeSM | `number` | average icon size / fontSize |
| iconFontSizeLG | `number \| string` | fontSizeHeading3 |
| groupSpace | `number` | marginXXS |
| groupOverlapping | `number`, may be negative | -marginXS |
| groupBorderColor | `string` | colorBorderBg |

See the [Avatar migration notes](https://github.com/apollocmh/apollo-design-ui/blob/master/docs/migrations/avatar-contracts.md) for development-stage event and Group alias changes.
