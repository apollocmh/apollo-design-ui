---
category: Data Display
title: Carousel
subtitle: 走马灯
---

Carousel component.

## When To Use

- Display a set of content (images / cards / text) in a limited space, one at a time.
- Need auto play, infinite loop or fade transition.

## Examples

See [`demo/`](./demo) (7 demos, one-to-one with antd non-debug demos).

## API

| Prop | Description | Type | Default |
|---|---|---|---|
| effect | Transition effect | `'scrollx' \| 'fade'` | `'scrollx'` |
| dots | Whether to display dots | `boolean \| { className?: string }` | `true` |
| dotPlacement | Dots position | `'top' \| 'bottom' \| 'start' \| 'end'` | `'bottom'` |
| dotPosition | ⚠️ Deprecated, use `dotPlacement` | same + `'left' \| 'right'` | — |
| autoplay | Auto play; object form enables dot progress animation | `boolean \| { dotDuration?: boolean }` | `false` |
| autoplaySpeed | Auto play interval (ms) | `number` | `3000` |
| speed | Transition duration (ms) | `number` | `500` |
| cssEase | CSS easing of the transition | `string` | `'ease'` |
| infinite | Infinite loop (renders clones) | `boolean` | `true` |
| initialSlide | Initial index | `number` | `0` |
| slidesToShow | Slides per view (forced to 1 when fade) | `number` | `1` |
| slidesToScroll | Slides to scroll (forced to 1 when fade) | `number` | `1` |
| draggable | Enable mouse dragging | `boolean` | `true` |
| swipe | Enable touch swiping | `boolean` | `true` |
| vertical | Vertical layout (auto when dotPlacement is start/end) | `boolean` | — |
| waitForAnimate | ⚠️ antd default is **false** (slick's is true) | `boolean` | `false` |
| pauseOnHover | Pause on hover | `boolean` | `true` |
| arrows | ⚠️ antd default is **false** (slick's is true) | `boolean` | `false` |
| rtl | RTL (follows ConfigProvider direction by default) | `boolean` | — |

### Slots

| Slot | Description | Scope |
|---|---|---|
| default | Carousel items | — |
| prev-arrow / next-arrow | Custom arrows | `{ currentSlide, slideCount }` |

### Events

| Event | Description | Arguments |
|---|---|---|
| before-change | Before transition | `(current, next)` |
| after-change | After transition | `(current)` |
| swipe | Swipe direction | `('left' \| 'right' \| 'up' \| 'down')` |
| edge | Edge drag in non-infinite mode | `('left' \| 'right' \| 'up' \| 'down')` |

### Keyboard

`ArrowLeft` / `ArrowRight` switch slides (judged by `keyCode` 37/39; ignored inside `INPUT` / `TEXTAREA` / `SELECT`).

## Ref

| Name | Type |
|---|---|
| nativeElement | `HTMLDivElement \| null` |
| goTo | `(slide: number, dontAnimate?: boolean) => void` |
| next / prev | `() => void` |
| autoPlay | `(playType?: 'update' \| 'leave' \| 'blur') => void` |
| innerSlider | Engine state object (⚠️ PLATFORM: slick instance on React side) |

## Theme (Component Token)

8 tokens, aligned with antd's `ComponentToken` (CSS variables `--apollo-carousel-*`):

`arrowSize: 16px`, `arrowOffset: 8px`, `dotWidth: 16px`, `dotHeight: 3px`,
`dotGap: 4px`, `dotOffset: 12px`, `dotWidthActive: 24px` (deprecated), `dotActiveWidth: 24px`.

> ⚠️ Values are **build-time resolved** (do not scale with theme) — see
> `docs/analysis/carousel.md` §7 for why (arrowLength = arrowSize/√2).

## FAQ

**Why do dots disappear with a single slide?**
slick's `unslick` behavior: when children count ≤ `slidesToShow`, the engine stops —
no clones, no dots/arrows. Upstream semantics, pinned by the L4 baseline.
