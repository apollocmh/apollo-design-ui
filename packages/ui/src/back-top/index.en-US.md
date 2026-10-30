---
category: Navigation
title: BackTop
subtitle: Back Top
---

A button to scroll back to top.

> ⚠️ Deprecated since antd 6.x. Use `FloatButton.BackTop` instead.

## API

| Prop | Description | Type | Default |
|---|---|---|---|
| visibilityHeight | Show after scrolling past this value (px) | `number` | `400` |
| duration | Scroll-to-top duration (ms; <=0 jumps directly) | `number` | `450` |
| target | Reactive container getter; supports pending template refs | `() => HTMLElement \| Window \| Document \| null` | `ownerDocument` |
| prefixCls | Component class prefix | `string` | `apollo-back-top` |

The `click` event emits the original `MouseEvent` once after scrolling starts; use `@click` or `onClick` with `h()`. Vue `.once` works normally.
The default slot accepts complete text, numbers, sibling nodes and Fragments. An explicitly empty slot hides the button; an absent slot uses the default icon. Slot VNodes are preserved inside a stable `-custom` span.

`nativeElement` exposes the actual `HTMLButtonElement | null`. The root is a native `type="button"` control with Tab, Enter, Space and focus styles. Hidden controls are excluded from keyboard navigation. Native class, style, ARIA, data attributes and listeners belong to this button. Its default icon label is “Back to top”; use `aria-label` to localize it. Give custom icon content an accessible name and keep nested interactive controls outside the slot.

Current `ConfigProvider.components['back-top'].className/style` apply to the root; native style wins. `theme.components.BackTop.zIndexPopup` defaults to `zIndexBase + 10`. Theme `motion: false` and the system reduced-motion preference disable scrolling animation.

## Design Notes

- `visibilityHeight={0}` keeps it always visible.
- The responsive inset narrows at viewports <= 768px / <= 480px.
- Changing targets, clicking again or unmounting cancels the previous scroll animation. Container listeners and pending scroll frames are released on target changes and unmount.

## Development migration (2026-10-30)

Under ADR 0007, the old root `div` becomes a native button, default content uses spans, and custom content gains a stable span host. Update tag selectors and move nested buttons/links outside the slot. Existing component classes remain available. The default slot now renders all nodes instead of cloning its first child. This development correction has no compatibility adapter or deprecation period; original reference baselines remain unchanged with exact differences asserted by this component's tests.
