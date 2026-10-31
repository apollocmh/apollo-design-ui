---
category: Other
title: Affix
subtitle: Affix
group:
  title: Other
  order: 7
---

# Affix

Keep content fixed to the visible edge of the window or an actual scroll container after reaching an offset. The default slot accepts complete Vue content.

```vue
<Affix :offset-top="16" :target="() => scrollArea" @change="onAffixed">
  <button>Sticky toolbar</button>
</Affix>
```

## API

| Prop | Description | Type | Default |
| --- | --- | --- | --- |
| offsetTop | Top affixing offset | number | 0 when both offsets are absent |
| offsetBottom | Bottom offset. Top wins when both conditions match; bottom can still match when top does not | number | — |
| target | Actual scrolling element or Window. Omitted: Provider.getTargetContainer, then window | () => HTMLElement \| Window \| null \| undefined | — |
| prefixCls | Current component prefix | string | apollo-affix |

A null/undefined result means pending. It releases the previous target and fixed state without selecting window. Reactive template refs update automatically; use the existing `updatePosition()` method after a nonreactive target change.

| Event | Payload | Timing |
| --- | --- | --- |
| change | affixed: boolean | Accepted affixed state flips; unchanged scrolling does not repeat it |

| Slot | Description |
| --- | --- |
| default | Complete VNodeChild content with persistent node identity |

| AffixRef | Description |
| --- | --- |
| updatePosition(): void | Coalesce remeasurement of the current target and content into the next frame |

No new instance API is introduced. A template ref can use `ref<AffixRef | null>(null)`.

## Native attrs and current configuration

The outer measuring div owns native class/style, id, data, ARIA and listeners once. Vue merges string, array and object styles with `ConfigProvider.components.affix.style`; caller styles take precedence. These remain native attrs rather than Affix Props. The fixed and spacer nodes are internal positioning layers.

The prefix, component configuration and theme follow current Provider values. The sole component Token is `zIndexPopup`, derived from `zIndexBase + 10` by default. Replacement, removal and explicit zero affect the actual fixed layer.

```vue
<ConfigProvider :theme="{ components: { Affix: { zIndexPopup: 20 } } }">
  <Affix :offset-top="0">Toolbar</Affix>
</ConfigProvider>
```

## Geometry and cleanup

Existing rounded comparisons and the outer layout reference are preserved. Top has branch priority; setting it does not remove the bottom condition. Fixed width follows the outer available width. Content keeps its natural height, and its existing ResizeObserver updates the spacer on growth and shrinkage without replacing inputs.

Measurement and listeners start after mounting. Scrolling retains frame coalescing and the unchanged-position fast path; size notifications perform full measurement. Target replacement, a pending target and unmount release listeners, observations and pending frames. SSR schedules none of these effects. Arbitrary position rearrangement without a size, scroll or explicit update signal does not add a new observer or polling loop.

## Demos

basic, offset-bottom, on-change, target and update-position. Existing geometry and s54 listener-idempotency regressions remain. Final nine-dimensional and distribution acceptance are separate.
