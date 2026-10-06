---
category: Feedback
title: Skeleton
subtitle: Skeleton
group:
  title: Feedback
  order: 2
---

# Skeleton

Provide a placeholder while you wait for content to load.

## When to use

- When a resource takes a long time to load and you **only know the rough structure** in advance;
- When you want to give a visual hint that content is being prepared, instead of a blank screen.

## Code examples

> ⚠️ The `demo/` directory for this component **is not in place yet** (see `README.md` §7).
> The snippets below are **runnable** minimal examples and will be replaced by `<demo>` blocks later.

### Basic

```vue
<template>
  <ASkeleton />
</template>

<script setup lang="ts">
import { Skeleton as ASkeleton } from '@apollo-design/ui';
</script>
```

### Title only (no paragraph)

```vue
<ASkeleton :paragraph="false" />
```

### With avatar

```vue
<ASkeleton avatar :paragraph="false" />
```

### Show skeleton while loading, then real content

```vue
<template>
  <ASkeleton :loading="loading">
    <div>Real content</div>
  </ASkeleton>
</template>

<script setup lang="ts">
import { Skeleton as ASkeleton } from '@apollo-design/ui';
const loading = ref(true);
</script>
```

### Active animation and rounded corners

```vue
<ASkeleton active round />
```

## API

### Props

| Property | Description | Type | Default |
|---|---|---|---|
| `active` | Show the animation effect | `boolean` | `false` |
| `loading` | Show the skeleton. **Both "not passed" and `true` show the skeleton; only `false` renders children** (see below) | `boolean` | — |
| `avatar` | Show an avatar placeholder. Pass an object to override the derived props | `boolean \| SkeletonAvatarProps` | `false` |
| `title` | Show a title placeholder. Pass an object to override | `boolean \| SkeletonTitleProps` | `true` |
| `paragraph` | Show a paragraph placeholder. Pass an object to override | `boolean \| SkeletonParagraphProps` | `true` |
| `round` | Show rounded corners | `boolean` | `false` |
| `prefixCls` | Class name prefix | `string` | `apollo-skeleton` |
| `class` / `style` | **Native root attrs** (not Props); `style` overrides `styles.root`. ⚠️ Other extra attrs are still dropped, matching upstream | `string \| array \| object` / `CSSProperties` | — |
| `classNames` | Semantic class names, see "Semantic slots" | `SkeletonSemanticClassNames` | — |
| `styles` | Semantic styles, see "Semantic slots" | `SkeletonSemanticStyles` | — |

Object form of `avatar` / `title` / `paragraph`:

| Key | Applies to | Description |
|---|---|---|
| `width` | title / paragraph | Width. For `paragraph` it may be an **array** (per row); as a single value **only the last row** gets it |
| `rows` | paragraph | Number of rows |
| `size` | avatar | Size |
| `shape` | avatar | `'circle' \| 'square' \| 'round' \| 'default'` |
| `active` / `className` / `style` | all three | Overrides |

### Events

None. Skeleton emits no events.

### Slots

| Name | Description |
|---|---|
| `default` | The real content. **Rendered only when `loading === false`**, and **with no wrapper element** |

### Semantic slots

`classNames` / `styles` each accept 6 keys, matching the DOM structure one-to-one:

| Key | Applies to |
|---|---|
| `root` | The root `div` |
| `header` | The `-header` container (**only present when `avatar` is set**) |
| `section` | The `-section` container (**only present when `title` or `paragraph` is set**) |
| `avatar` | The avatar element |
| `title` | The title element |
| `paragraph` | The paragraph element |

> ⚠️ Function-style `classNames` / `styles` are **not supported** (consistent with
> divider / button / typography, per the `empty-semantic-fn` decision, option B).

### Type exports

`SkeletonProps`, `SkeletonRef`, `SkeletonConfig`, `SkeletonSlot`,
`SkeletonSemanticClassNames`, `SkeletonSemanticStyles`, `SkeletonSemanticType`,
`SkeletonSemanticAllType`, `SkeletonSemanticValue`,
`SkeletonAvatarProps`, `SkeletonAvatarOwnProps`, `SkeletonTitleProps`, `SkeletonParagraphProps`,
`SkeletonButtonProps`, `SkeletonInputProps`, `SkeletonImageProps`, `SkeletonNodeProps`, `SkeletonNodeSlot`,
`SkeletonElementProps`, `SkeletonElementSemanticClassNames`, `SkeletonElementSemanticStyles`,
`SkeletonElementSemanticType`, `SkeletonElementSize`, `SkeletonShape`, `SkeletonWidthUnit`.

### ref

```ts
const skeletonRef = ref<{ nativeElement: HTMLDivElement | null }>();
```

### Compound components

`Skeleton.Avatar` / `Skeleton.Button` / `Skeleton.Input` / `Skeleton.Image` / `Skeleton.Node`
are exported from the same package and used exactly like antd's.

## Design notes

### The four states of `loading` (⚠️ the only compatibility difference)

antd's check is `loading || !('loading' in props)` — it looks at **whether the key exists**.
Measured against antd 6.6.4:

| Case | antd 6.6.4 | This implementation |
|---|---|---|
| ① **Not passed** (key absent) | renders skeleton | renders skeleton ✅ |
| ② **Explicitly `loading={undefined}`** | **renders children** | renders skeleton ❌ |
| ③ `loading={true}` | renders skeleton | renders skeleton ✅ |
| ④ `loading={false}` | renders children | renders children ✅ |

**Only case ② differs.** The reason is that **Vue props have no notion of "key exists"**
(when not passed, the value is also `undefined`, so the two are indistinguishable)
⇒ this is a **platform-inherent difference** (PLATFORM), not a bug.
This implementation uses `loading !== false`, i.e. "not passed = show skeleton".

### The three blocks derive their props from each other

`width` / `rows` / `shape` for `avatar` / `title` / `paragraph` depend on
**whether the other two are present**:

| Derivation | Rule |
|---|---|
| avatar `shape` | `hasTitle && !hasParagraph` ⇒ `'square'`, otherwise `'circle'` (`size` is always `'large'`) |
| title `width` | `!hasAvatar && hasParagraph` ⇒ `'38%'`; `hasAvatar && hasParagraph` ⇒ `'50%'`; otherwise unset |
| paragraph `width` | `!hasAvatar \|\| !hasTitle` ⇒ `'61%'`; otherwise unset |
| paragraph `rows` | `!hasAvatar && hasTitle` ⇒ `3`, otherwise `2` |

Passing an object **overrides** the derived value (`{ ...derived, ...userObject }`).

### DOM structure: `-header` and `-section` are siblings

```html
<div class="apollo-skeleton [-with-avatar] [-active] [-rtl] [-round]">
  <div class="apollo-skeleton-header"><!-- only when avatar is set --></div>
  <div class="apollo-skeleton-section"><!-- only when title or paragraph is set -->
    <h3 class="apollo-skeleton-title"></h3>
    <ul class="apollo-skeleton-paragraph"><li></li>…</ul>
  </div>
</div>
```

The title is an `<h3>` and the paragraph is a `<ul>` with `rows` `<li>` children
(matching upstream). When `loading === false` the **root element does not exist at all** —
children are rendered directly.

### Accessibility

⚠️ **antd's Skeleton has no ARIA at all** (measured: `aria-*` / `role` occurrences are **0**) —
no `aria-busy`, no `aria-live`, no `role="status"`. Screen readers do not announce "loading".
**We match it verbatim** and do not add attributes on our own (doing so would break the
mechanical DOM-contract baseline in L4).

⚠️ **One exception (we are stricter than upstream; registered)**: on `Skeleton.Image`'s `<svg>`
we add `aria-hidden="true"` + `focusable="false"` (antd's `Image.js` has neither).
This is a deliberate improvement — a decorative placeholder is meaningless to screen readers.
It is pinned by `__tests__/a11y.test.ts`.

### Component tokens

See `style/token.ts`. Under the zero-runtime architecture:
**alias-derived tokens go through `var(--apollo-*)`** (theme-adaptive, validated by build gate B7);
**literal tokens** have their single source of truth in `token.ts` and are inlined by `style/index.ts`.

### Importing styles

```ts
import '@apollo-design/ui/skeleton/style.css';
```

> ⚠️ The per-component style subpath is currently **missing** (`packages/ui/package.json`'s
> `exports` does not declare it). This is a repo-wide infrastructure issue affecting
> `skeleton` / `divider` / `spin`. See `README.md` §7.
