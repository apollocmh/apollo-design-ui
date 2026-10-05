---
category: Other
title: Affix
subtitle: Affix
group:
  title: Other
  order: 7
---

# Affix

Make an element stick to viewport.

## When to use

- When the page is long and an element (toolbar, action bar) needs to stay **within the viewport**;
- Commonly used for navigation and button groups.

## Code examples

### Basic

```vue
<script setup lang="ts">
import { Affix, Button } from '@apollo-design/ui';
</script>

<template>
  <Affix :offset-top="80">
    <Button type="primary">Affix top at 80px</Button>
  </Affix>
</template>
```

### Affix bottom

```vue
<Affix :offset-bottom="80">
  <Button>Affix bottom at 80px</Button>
</Affix>
```

### Change callback

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Affix, Button } from '@apollo-design/ui';

const affixed = ref(false);
</script>

<template>
  <Affix :offset-top="120" @change="(v) => (affixed = v)">
    <Button>{{ affixed ? 'Affixed' : 'Not affixed' }}</Button>
  </Affix>
</template>
```

### Scroll container

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Affix, Button } from '@apollo-design/ui';

const container = ref<HTMLElement | null>(null);
const getTarget = () => container.value ?? window;
</script>

<template>
  <div ref="container" style="height: 300px; overflow: auto">
    <Affix :target="getTarget" :offset-top="10">
      <Button>Affix in container</Button>
    </Affix>
  </div>
</template>
```

### Update position manually

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Affix, Button } from '@apollo-design/ui';

const affixRef = ref<{ updatePosition: () => void } | null>(null);
</script>

<template>
  <Affix ref="affixRef" :offset-top="60">
    <Button @click="affixRef?.updatePosition()">Re-measure</Button>
  </Affix>
</template>
```

## API

### Props

| Property | Description | Type | Default |
|---|---|---|---|
| `offsetTop` | Offset from the top of the viewport after affixing | `number` | — |
| `offsetBottom` | Offset from the bottom of the viewport after affixing. **Mutually exclusive with `offsetTop`**: when both are set only `offsetTop` takes effect | `number` | — |
| `target` | Scroll listening and positioning reference; **a function returning an element or `window`**. Default `window` | `() => HTMLElement \| Window \| null` | — |
| `prefixCls` | Class name prefix | `string` | `apollo-affix` |

### Native root attributes

The outer placeholder-measuring element is the root. Vue-native `class`, `style`, and other `$attrs` fall through to it; `class` supports string, array, and object forms. `style` merges with `ConfigProvider.components.affix.style`, with caller values taking precedence. These are not Affix-specific Props, so no `className`, `rootClassName`, or `style` Props are declared.

```vue
<Affix class="toolbar-affix" :style="{ zIndex: 20 }">
  <Toolbar />
</Affix>
```

### Events

| Event | Description | Arguments |
|---|---|---|
| `change` | Fired when the affixed state **flips** (not repeatedly while staying affixed) | `(affixed: boolean)` |

### Slots

| Name | Description |
|---|---|
| `default` | The affixed content |

### ref

```ts
const affixRef = ref<{ updatePosition: () => void } | null>(null);
```

## Design notes

### Two-layer structure

The outer element always stays in the document flow (the **placeholder measuring layer**, where
`restProps` land); the inner element gets `position: fixed` when affixed, and an equal-height
**placeholder** (`aria-hidden="true"`) is inserted to prevent layout jumps.

⚠️ **The inner `apollo-affix` class name only exists while affixed**
(antd's `mergedCls = clsx({ [rootCls]: affixStyle })`).

### `offsetTop` / `offsetBottom` are mutually exclusive

antd's `internalOffsetTop = neither passed ? 0 : offsetTop`, but `getFixedTop` requires
`offsetTop !== undefined` ⇒ **when both are set only `offsetTop` takes effect**.

### Positioning predicates (`utils.ts`, exported for unit tests)

```ts
getFixedTop(placeholderRect, targetRect, offsetTop)
// offsetTop !== undefined && round(targetRect.top) > round(placeholderRect.top) - offsetTop
//   ⇒ offsetTop + targetRect.top

getFixedBottom(placeholderRect, targetRect, offsetBottom)
// offsetBottom !== undefined && round(targetRect.bottom) < round(placeholderRect.bottom) + offsetBottom
//   ⇒ offsetBottom + (window.innerHeight - targetRect.bottom)
```

⚠️ `Math.round` participates in the **comparison only** (to remove sub-pixel jitter);
the result uses the raw values.
⚠️ `getFixedBottom` uses `window.innerHeight` (not the target height) — affixing to the
"visible bottom of a container" needs the distance from the container's bottom edge to the
viewport's bottom edge.

When comparing an unchanged affix position, account for Vue's inline style values: numeric
measurements are written as pixel strings such as `"64px"`. The fast path compares that value
with the computed position to avoid repeating the full measurement. Geometry helpers do not emit
probe logs in production.

### Accessibility

⚠️ **Affixed-state changes are invisible to screen readers**: antd outputs no
`aria-live` / `role="status"` / `aria-busy`. We match it verbatim and do not add attributes.
The whole component contains exactly one ARIA attribute (`aria-hidden="true"` on the placeholder).

### Component token

| Token | Default | Description |
|---|---|---|
| `zIndexPopup` | `zIndexBase + 10` | z-index of the affixed layer |

⚠️ Known gap: without the "Component Token → CSS variable" pipeline users cannot override
`zIndexPopup` yet.

### Importing styles

```ts
import '@apollo-design/ui/affix/style.css';
```

## Known gaps

- **Not testable in jsdom / static rendering**: real scrolling, `ResizeObserver` triggering,
  visual comparison of the affixed state — see `README.md` §7.1
  (the predicates are pinned by pure-function unit tests; the gap is the component-level integration).
- The per-component style subpath `./affix/style.css` depends on the `exports` declaration in
  `packages/ui/package.json` (repo-wide infrastructure issue).
