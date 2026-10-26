---
category: Feedback
title: Skeleton
subtitle: Skeleton
group:
  title: Feedback
  order: 2
---

# Skeleton

Display a placeholder matching the expected content structure. The caller owns loading; Skeleton does not fetch data or finish loading automatically.

## Examples

All eight original demos remain, plus a live component-token example with native variable overrides and a persistent editor.

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Skeleton } from '@apollo-design/ui';
const loading = ref(true);
const draft = ref('Persistent data');
</script>
<template>
  <button type="button" @click="loading = !loading">Toggle loading</button>
  <Skeleton :loading="loading" avatar>
    <input v-model="draft" aria-label="Business draft" />
  </Skeleton>
</template>
```

## API

### Skeleton Props

| Property | Behavior | Type | Default |
|---|---|---|---|
| active | Shimmer; respects reduced motion and source motion:false | boolean | false |
| loading | Only false shows content; omitted/undefined show placeholders | boolean | — |
| prefixCls | Current class prefix | string | apollo-skeleton |
| avatar | Avatar block and single-element configuration | boolean / SkeletonAvatarProps | false |
| title | Title block configuration | boolean / SkeletonTitleProps | true |
| paragraph | Paragraph block configuration | boolean / SkeletonParagraphProps | true |
| round | Capsule title and paragraph lines | boolean | false |
| classNames | Six semantic targets; functions receive current `{ props }` | SkeletonSemanticValue&lt;SkeletonSemanticClassNames&gt; | — |
| styles | Six semantic targets; functions receive current `{ props }` | SkeletonSemanticValue&lt;SkeletonSemanticStyles&gt; | — |

### Standalone child props

Named SkeletonAvatar/SkeletonButton/SkeletonInput/SkeletonImage/SkeletonNode exports are identical to Skeleton.Avatar/Button/Input/Image/Node.

| Property | Components | Behavior |
|---|---|---|
| prefixCls | All | Current prefix |
| active | All | Shimmer, false by default |
| classNames / styles | All | Objects with root (outer div) and content (inner shape/content) |
| size | Avatar | small / medium / middle / large / existing default alias / finite nonnegative pixel number; defaults to Provider componentSize |
| shape | Avatar | circle (default) / square |
| size | Button / Input | small / medium / middle / large / existing default alias; defaults to Provider componentSize |
| shape | Button | circle / square / round / default; omitted means no shape class |
| block | Button / Input | Full-width, false by default |
| internalClassName | Node | Existing content-class override; empty uses the node class; Image uses the image class internally |

The existing size="default" warning remains; prefer medium. Root className aliases were removed. Inner dimensions/styles use styles.content.

### Block configuration

avatar/title/paragraph prefixCls/className/style are configuration data. Classes combine; matching semantic styles override configuration styles.

| Field | Block | Behavior |
|---|---|---|
| size / shape | avatar | Size and circle/square; defaults to large, square when title exists without paragraph, otherwise circle |
| width | title | Pixel number or CSS string; 38% without avatar and with paragraph, 50% with both, otherwise unset |
| rows | paragraph | Three without avatar and with title, otherwise two; nonfinite/negative means zero, positive fractions truncate |
| width | paragraph | Array applies per line; scalar applies to the last line; default last width 61% without avatar or title |

Nonfinite numeric lengths are ignored; zero remains valid. The nested avatar is one shape: use main classNames.avatar/styles.avatar rather than standalone two-layer classNames/styles configuration.

### Native attrs, Provider and priority

All six components route id/data/ARIA/tabindex/native events to their real root. Vue string/array/object class/style work; native styles win. Child content has its own semantic target. Skeleton has no root when loading=false, so attrs are not copied to business slots; add your own persistent host when needed.

The main component consumes current components.skeleton className/style/classNames/styles, including replacement/removal/restoration. Standalone children consume the global prefix, applicable size and source theme; they do not reinterpret the main six-target configuration as their two-target configuration. Nearest Provider scope, instance isolation and live RTL apply. Arbitrary custom prefixes still need matching static CSS.

### Slots, events and models

| Component / default slot | Behavior |
|---|---|
| Skeleton | Complete unwrapped content when loading=false |
| SkeletonNode | Complete native custom content; surrounding style/theme changes retain editors |
| SkeletonImage | An existing slot wins, including intentional emptiness; absent slot uses the original SVG |

No business emits or v-model; the caller controls loading. Native listeners receive DOM events. Main semantic targets are root/header/section/avatar/title/paragraph; children use root/content.

### Expose

Only the main component exposes nativeElement: HTMLDivElement | null. It is null while loading=false and after unmount. Loading switches intentionally unmount business content: keep data in caller-owned reactive state; DOM identity/focus do not survive intentional removal.

### Component tokens

All shapes consume current theme.components.Skeleton and respond to removal/restoration. Current gradient names win over existing aliases, then current Alias defaults. Root native style can override corresponding --apollo-skeleton-* variables.

| Token | Type | Default source |
|---|---|---|
| gradientFromColor | string | colorFillContent |
| gradientToColor | string | colorFill |
| color (existing deprecated alias) | string | gradientFromColor |
| colorGradientEnd (existing deprecated alias) | string | gradientToColor |
| titleHeight | number / CSS length string | controlHeight / 2 |
| blockRadius | number | borderRadiusSM |
| paragraphMarginTop | number | marginLG + marginXXS |
| paragraphLiHeight | number | controlHeight / 2 |

### Accessibility, SSR and styles

The loading root owns aria-busy=true. Decorative header/section blocks are aria-hidden, keeping empty placeholder headings out of the accessible tree. Native attrs may supply a role/name. Node/Image business slots remain accessible; the built-in SVG is decorative. Active animation respects prefers-reduced-motion and source motion:false; no live announcement is added automatically.

SSR does not depend on window; native slots and current source themes render on the server. Exact hydration/browser acceptance is recorded in the complete audit. Import @apollo-design/ui/skeleton/style.css. Development migration details: docs/migrations/skeleton-contracts.md; executed checks, evidence and unverified boundaries: docs/audit/2026-10-27-skeleton-contract-audit.md.
