---
category: Data Display
title: Carousel
subtitle: 走马灯
---

# Carousel

Provide slides through the native default slot. See the existing nine [demos](./demo).

## API

| Prop | Description | Type | Default |
| --- | --- | --- | --- |
| effect | Transition effect | `'scrollx' \| 'fade'` | `'scrollx'` |
| dots | Show dots; object adds a dots class | `boolean \| { className?: string }` | `true` |
| dotPlacement | Dots placement; start/end imply vertical | `'top' \| 'bottom' \| 'start' \| 'end'` | `'bottom'` |
| dotPosition | Existing placement alias; use dotPlacement | `DotPlacement \| 'left' \| 'right'` | `—` |
| autoplay | Autoplay; object enables dot progress | `boolean \| { dotDuration?: boolean }` | `false` |
| autoplaySpeed | Playback interval configuration in ms | `number` | `3000` |
| speed | Transition duration in ms | `number` | `500` |
| cssEase | CSS transition easing | `string` | `'ease'` |
| infinite | Loop with cloned content instances | `boolean` | `true` |
| initialSlide | Initial index; changes reposition the carousel | `number` | `0` |
| slidesToShow | Visible slides; forced to1 in fade | `number` | `1` |
| slidesToScroll | Slides per move; forced to1 in fade | `number` | `1` |
| draggable | Mouse dragging | `boolean` | `true` |
| swipe | Allow swipe gestures | `boolean` | `true` |
| touchMove | Respond to mouse/touch movement | `boolean` | `true` |
| touchThreshold | Minimum movement divisor: viewport size/value | `number` | `5` |
| vertical | Vertical layout; inferred from placement when omitted | `boolean` | `—` |
| waitForAnimate | Reject new moves while animating | `boolean` | `false` |
| pauseOnHover | Pause while hovering content | `boolean` | `true` |
| pauseOnDotsHover | Pause while hovering dots | `boolean` | `false` |
| pauseOnFocus | Pause while focus is inside this carousel | `boolean` | `false` |
| arrows | Show native previous/next buttons | `boolean` | `false` |
| accessibility | Enable carousel keys and the list focus entry | `boolean` | `true` |
| adaptiveHeight | Adapt list height to the current slide | `boolean` | `false` |
| rtl | Horizontal RTL; defaults to current Provider direction | `boolean` | `—` |
| useCSS | Enable CSS transitions | `boolean` | `true` |
| useTransform | Use transform; false uses left/top | `boolean` | `true` |
| edgeFriction | Drag resistance at a non-looping edge | `number` | `0.35` |
| prefixCls | Root class prefix | `string` | `'apollo-carousel'` |
| id | Id on the actual root div | `string` | `—` |
| classNames | Inner semantic classes | `{ slider?: string }` | `—` |
| styles | Inner semantic styles | `{ slider?: CSSProperties }` | `—` |
| className | Existing inner class alias; prefer classNames.slider | `string` | `—` |

Native class, complete style (objects, strings or arrays), ARIA/data and listeners land on the actual root div. The former inner style prop is removed; use styles.slider for that target. The non-conflicting existing className alias remains inside. Current components.carousel presentation and Provider direction remain reactive, including removal.

The unconsumed easing API is removed directly during development. Use the working cssEase property; there is no compatibility channel.

### Slots

| Slot | Content | Scope |
| --- | --- | --- |
| default | Complete Vue slide content, including arrays, Fragments, conditional emptiness and zero | — |
| prev-arrow / next-arrow | Complete content of the existing native arrow button | `{ currentSlide: number, slideCount: number }` |

The native button owns disabled state, accessible naming, click and keyboard behavior. Migrate a former button root in an arrow slot to icon/span content. Siblings and conditional content are preserved; custom content does not duplicate the default arrow graphic.

### Events

| Event | Template | Payload |
| --- | --- | --- |
| beforeChange | `@before-change` | `(current: number, next: number)` |
| afterChange | `@after-change` | `(current: number)` |
| swipe | `@swipe` | `('left' \| 'right' \| 'up' \| 'down')` |
| edge | `@edge` | Same direction, at a non-looping edge |
| keydown | `@keydown` | Native KeyboardEvent before navigation; supports preventDefault() |

Use natural onBeforeChange/onAfterChange listeners with h(). Vue owns dispatch; attrs listeners are not called manually. There is no value model; use the public navigation methods. Each completed swipe notifies once, and a same-position request does not invent a transition.

### Reference and behavior

```ts
interface CarouselRef {
  nativeElement: HTMLDivElement | null;
  goTo(slide: number, dontAnimate?: boolean): void;
  next(): void;
  prev(): void;
  autoPlay(playType?: 'update' | 'leave' | 'blur'): void;
  innerSlider: Readonly<CarouselEngineState>;
}
```

innerSlider is the actual reactive engine state, not a slick instance. Finite goTo indices wrap or clamp against current slides. Disabling animation completes immediately. Configuration/slide-structure changes settle the accepted old transition, then remeasure current settings; retired timers cannot restore stale layout. initialSlide or effective RTL changes reposition using the current initial value.

Native key handling retains keyCode support, reverses horizontal RTL arrows and supports vertical up/down. Inputs, selects, textarea, editable content, composition and canceled events do not navigate. Original interactive content retains its native Tab behavior. Inactive content is inert/aria-hidden; a visible boundary clone remains interactive. Playback retains the existing autoplaySpeed+50 schedule. Focus/content-hover/dots-hover reasons combine, and moving focus within this instance does not resume early.

Original keyed slides retain component identity. Concrete native ids and local for/ARIA references in clone trees gain stable instance suffixes. External references and component business id props remain unchanged. Parent refs belong to originals; component content slots are forwarded once at actual render time with their scope/owner, and returned clone refs are cleared.

Clones remain independent component instances and do not mirror arbitrary internal uncontrolled state. Use infinite=false for content requiring one local instance. Invisible component-internal fixed ids are not inspected or rewritten, and slots are not pre-invoked to discover hidden structure.

## Theme

The existing eight tokens remain: arrowSize, arrowOffset, dotWidth, dotHeight, dotGap, dotOffset, dotWidthActive and dotActiveWidth. Each accepts a number(px) or CSS length string and responds to current theme.components.Carousel replacement/removal. dotWidthActive is the existing alias used when dotActiveWidth is not explicit; the newer explicit value wins. CSS calc derives arrow geometry from current arrowSize, including rem lengths. Native root style can override variables explicitly.

Unsupported slick features such as responsive, rows, variableWidth, lazyLoad, asNavFor and appendDots/customPaging are not added. Existing reference/algorithm evidence remains; complete library acceptance runs later on one frozen version.
