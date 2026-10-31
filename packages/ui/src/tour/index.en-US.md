---
title: Tour
subtitle: Tour
titleTemplate: '%s - @apollo-design/ui'
description: A mask-based guide to walk users through features step by step.
---

# Tour

A step-by-step guide that highlights page elements with a mask cutout. Supports keyboard navigation and customizable panels.

## When To Use

- To introduce new or redesigned features to users step by step;
- To guide users through a task flow in a specified order;
- To spotlight page elements.

## Import

```ts
import { Tour } from '@apollo-design/ui';
```

## Examples

### Basic

<code src="./demo/basic.vue"></code>

### Custom mask

<code src="./demo/mask.vue"></code>

### Non-modal

<code src="./demo/non-modal.vue"></code>

### Custom actions

<code src="./demo/actions-render.vue"></code>

### Custom indicator

<code src="./demo/indicator.vue"></code>

### Placement

<code src="./demo/placement.vue"></code>

### Custom highlight area

<code src="./demo/gap.vue"></code>

### Panel preview

<code src="./demo/render-panel.vue"></code>

### Custom styles and classNames

<code src="./demo/style-class.vue"></code>

## API

### TourProps

| Prop | Description | Type | Default |
| --- | --- | --- | --- |
| steps | Tour step configs | TourStepProps[] | - |
| open | Whether the tour is open (`v-model:open`) | boolean | - |
| defaultOpen | Initial open state when uncontrolled (defaults to open when neither `open` nor `defaultOpen` is given and the step is valid) | boolean | - |
| current | Current step (`v-model:current`) | number | 0 |
| defaultCurrent | Initial step when uncontrolled | number | 0 |
| type | Panel type | 'default' \| 'primary' | 'default' |
| arrow | Whether to show the arrow (overridden by `steps[].arrow`) | boolean \| { pointAtCenter } | true |
| placement | Default placement (overridden by `steps[].placement`; falls back to `center` without a target) | TourPlacement | 'bottom' |
| mask | Mask (overridden by `steps[].mask`) | boolean \| { style?, color? } | true |
| gap | Highlight area expansion | { offset?: number \| [number, number]; radius?: number } | offset 6 / radius 2 |
| animated | Highlight animation | boolean \| { placeholder } | true |
| keyboard | Keyboard navigation (Esc / ← / →) | boolean | true |
| closeIcon | Global close icon (`#closeIcon` slot wins; overridden by `steps[].closeIcon`) | VNodeChild | - |
| closable | Whether to show the close button (overridden by `steps[].closable`; `aria-*` on the object pass through) | boolean \| { closeIcon?, ...aria } | - |
| scrollIntoViewOptions | Scroll options when the target is off-screen | boolean \| ScrollIntoViewOptions | { block: 'center', inline: 'center' } |
| zIndex | Popup z-index (computed via `useZIndex` when omitted) | number | - |
| getPopupContainer | Mount container service, with the actual placeholder | (node: HTMLElement) => HTMLElement \| ShadowRoot \| null | - |
| disabledInteraction | Whether the mask blocks all interactions (including inside the hole) | boolean | false |
| builtinPlacements | Custom placement config map | Record&lt;string, AlignType&gt; | - |
| class | **Native root attrs** (replacing upstream `rootClassName`) | string / array / object | - |
| style / id / aria-* / native events | Land once on the actual popup; style supports Vue objects, arrays and strings | Native attrs | - |
| classNames / styles | 12 semantic slots (object or function) | TourSemanticClassNames / TourSemanticStyles | - |

### TourStepProps

See `index.zh-CN.md` for the full table (target / title / description / cover / placement / mask / arrow / style / className / scrollIntoViewOptions / closeIcon / closable / nextButtonProps / prevButtonProps / type / classNames / styles).

### Events

| Event | Description | Arguments |
| --- | --- | --- |
| update:open | v-model:open | (open: boolean) |
| update:current | v-model:current | (current: number) |
| change | Step changed (emitted together with `update:current`) | (current: number) |
| close | Closed (Esc / close button / Finish), carries the current step | (current: number) |
| finish | Finish clicked on the last step | - |
| popupAlign | Actual popup alignment notification | (element: HTMLElement, align: TriggerAlign) |

### Slots

| Slot | Description | Arguments |
| --- | --- | --- |
| title / description / cover | Step content (wins over the same-name string prop) | { step, current, total } |
| closeIcon | Close icon (wins over the prop) | - |
| nextButton / prevButton | Button text (wins over `*.children`) | { step, current, total } |
| indicators | Custom indicators (mapped to `indicatorsRender`) | { current, total } |
| actions | Custom actions (mapped to `actionsRender`; `originNode` is a stable default-actions component) | { current, total, originNode } |

### TourPurePanel

The counterpart of `Tour._InternalPanelDoNotUseOrYouWillBeFired`. Render fields plus `prefixCls`, `current` (0) and `total` (6); positioning fields are not part of this static preview.

### Theme tokens

| Token | Description | Default |
| --- | --- | --- |
| zIndexPopup | Popup z-index | zIndexPopupBase + 70 (1070) |
| closeBtnSize | Close button size | fontSize × lineHeight = 22px |
| primaryPrevBtnBg | Primary prev-button background | rgba(255,255,255,0.15) |
| primaryNextBtnHoverBg | Primary next-button hover background | rgb(240,240,240) |

Arrow tokens are shared with tooltip / dropdown and are not re-declared.

## Native state and content contract

Each of `open` and `current` has one control source. Controlled actions propose changes without storing a rejected proposal; removing control retains the last accepted value. Temporarily invalid or empty steps hide the guide without resetting its accepted index. A real reopening silently resets only an uncontrolled current index.

All native attributes, class, style and listeners land once on the actual popup root. Styles accept Vue objects, arrays and strings. Semantic precedence is Provider → top-level configuration → current step → native root attrs. Explicit `styles.root` retains its mask projection; native styles do not alter the positioning placeholder or mask.

Named slots are read while rendering. A present empty slot does not fall back to data. The actions scope contains a stable component: render it with `<component :is="originNode" />`. Step button callbacks remain data actions, receive a native `MouseEvent`, and can cancel navigation with `preventDefault()`.

Arrow navigation belongs to the guide panel and respects editable targets, IME and cancelled events. Escape affects only the top guide. Opening focuses the real popup without trapping interaction inside the target hole. Accepted closing restores owned focus while preserving an outside user choice. `mask=false` neither locks scrolling nor blocks page interaction.

The existing s53 target/ancestor ResizeObserver and captured scroll signals retain their frame-coalesced geometry. Close, target replacement and unmount release listeners, observations and pending frames. Reveal scrolling runs on step activation or target/options replacement rather than fighting passive scrolling. Pure position rearrangement without an observed size/scroll signal does not introduce a new DOM observer or polling loop.

Current Provider, locale and existing Token values are used by both Tour and PurePanel. Target getters may return `HTMLElement`, `null` or `undefined`; popup container services receive the actual placeholder and may return `HTMLElement`, `ShadowRoot` or pending `null`. Top-level layers use the current Tour Token, nested layers keep the existing parent offset, and explicit zero works.

### Migration

Use the Vue `popupAlign(element, align)` notification (`@popup-align`); programmatic `onPopupAlign` remains its listener. Render `actions.originNode` directly as a component, removing VNode casts and wrapper functions. Root attrs now belong to the visible popup; use `styles.mask` for mask customization. PurePanel accepts render fields plus `prefixCls/current/total`, not target/mask positioning inputs, and forwards the same named slots. Tour exposes no public imperative instance API.
