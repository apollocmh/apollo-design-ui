---
title: Tour
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
| defaultOpen | Initial open state when uncontrolled (⚠️ defaults to **open** when neither `open` nor `defaultOpen` is given and current is valid, per rc source) | boolean | - |
| current | Current step (`v-model:current`) | number | 0 |
| defaultCurrent | Initial step when uncontrolled | number | 0 |
| type | Panel type | 'default' \| 'primary' | 'default' |
| arrow | Whether to show the arrow (overridden by `steps[].arrow`) | boolean \| { pointAtCenter } | true |
| placement | Default placement (overridden by `steps[].placement`; falls back to `center` without a target) | TourPlacement | 'bottom' |
| mask | Mask (overridden by `steps[].mask`) | boolean \| { style?, color? } | true |
| gap | Highlight area expansion | { offset?: number \| [number, number]; radius?: number } | offset 6 / radius 2 |
| animated | Placeholder animation (antd always passes true) | boolean \| { placeholder } | true |
| keyboard | Keyboard navigation (Esc / ← / →) | boolean | true |
| closeIcon | Global close icon (`#closeIcon` slot wins; overridden by `steps[].closeIcon`) | VNodeChild | - |
| closable | Whether to show the close button (overridden by `steps[].closable`; `aria-*` on the object pass through) | boolean \| { closeIcon?, ...aria } | - |
| scrollIntoViewOptions | Scroll options when the target is off-screen | boolean \| ScrollIntoViewOptions | { block: 'center', inline: 'center' } |
| zIndex | Popup z-index (computed via `useZIndex` when omitted) | number | - |
| getPopupContainer | Mount container | (node: HTMLElement) => HTMLElement | - |
| disabledInteraction | Whether the mask blocks all interactions (including inside the hole) | boolean | false |
| builtinPlacements | Custom placement config map | Record&lt;string, AlignType&gt; | - |
| rootClassName | Additional class on the root | string | - |
| className / style | Land on the placeholder element (rc protocol); `style` also lands on the mask | string / CSSProperties | - |
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

### Slots

| Slot | Description | Arguments |
| --- | --- | --- |
| title / description / cover | Step content (wins over the same-name string prop) | { step, current, total } |
| closeIcon | Close icon (wins over the prop) | - |
| nextButton / prevButton | Button text (wins over `*.children`) | { step, current, total } |
| indicators | Custom indicators (mapped to `indicatorsRender`) | { current, total } |
| actions | Custom actions (mapped to `actionsRender`; `originNode` is the default button group) | { current, total, originNode } |

### TourPurePanel

The counterpart of `Tour._InternalPanelDoNotUseOrYouWillBeFired`. Same props as `TourStepProps` plus `current` (0) / `total` (6, upstream quirk preserved).

### Theme tokens

| Token | Description | Default |
| --- | --- | --- |
| zIndexPopup | Popup z-index | zIndexPopupBase + 70 (1070) |
| closeBtnSize | Close button size | fontSize × lineHeight = 22px |
| primaryPrevBtnBg | Primary prev-button background | rgba(255,255,255,0.15) |
| primaryNextBtnHoverBg | Primary next-button hover background | rgb(240,240,240) |

Arrow tokens are shared with tooltip / dropdown and are not re-declared.
