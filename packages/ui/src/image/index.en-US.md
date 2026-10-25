---
category: Data Display
title: Image
subtitle: Image
---

Previewable image. The preview overlay is portaled and supports zoom / rotate /
flip / switching inside a group.

## When to use

- Show an image and let the user click it to view the larger preview.
- A set of images needs one shared preview with prev/next switching
  (`Image.PreviewGroup`).
- You need a placeholder while loading and a fallback when loading fails
  (`placeholder` / `fallback`).

## Demos

See [`demo/`](./demo) (15 demos, covering the main antd scenarios
controlled-preview / cover-placement / fallback / image-render / nested /
placeholder / preview-group / preview-group-top-progress / preview-group-visible /
preview-img-info / preview-mask / preview-src.

## API

### Image · Props

| Property | Description | Type | Default |
|---|---|---|---|
| prefixCls | Full root prefix; follows the current prop and falls back to the current ConfigProvider namespace when removed | `string` | `apollo-image` |
| src | Image source | `string` | — |
| width / height | Size. Numbers are normalized to `px` (see Design notes) | `number \| string` | — |
| alt | Accessible name; also the root `aria-label` when previewable | `string` | — |
| fallback | Image shown when loading fails | `string` | — |
| placeholder | Placeholder content; `{ progress: true \| { percent, render } }` renders the progress layer | `VNodeChild \| { progress }` | — |
| preview | `false` disables preview; object form see below | `boolean \| PreviewConfig` | `true` |
| open | Top-level controlled open state; supports `v-model:open` | `boolean` | — |
| defaultOpen | Uncontrolled initial state; later changes do not reset it | `boolean` | `false` |
| class / style | Native root attrs. Style accepts Vue strings, objects and arrays, overrides `styles.root`, and stays on the root; use `styles.image` for the img | `string \| array \| object` / `StyleValue` | — |
| wrapperStyle | ⚠️ Deprecated, use `styles.root` | `CSSProperties` | — |
| classNames / styles | Semantic class names / styles, see "Semantic slots" | — | — |
| crossOrigin / decoding / loading / referrerPolicy / sizes / srcSet / useMap / draggable | Native attributes forwarded to `<img>` | — | — |

Progress/standalone-placeholder branches forward native attrs to the existing Progress root and merge Image root and placeholder.progress semantics, with native style last. ID/data and naming/description ARIA stay current; progress owns its role, range and busy state. Removing an explicit aria-label restores the percentage name. Root click notifies once without opening preview; img errors stay on the img. See the [native style correction](../../../../docs/migrations/image-native-styles.md).

### Image · Slots

| Name | Description | Scope |
|---|---|---|
| imageRender | Customize thumbnail content; an empty slot suppresses the default img | One `ImageRenderInfo` object; details below |
| previewImage | Customize the preview image area | One PreviewImageInfo object |
| previewActions | Customize the preview toolbar | One PreviewActionsInfo object |

`originNode` is a real VNode carrying the original ref, load/error handling, native attributes and styles. Render it with `<component :is="originNode" />`. `src` is the current raw img src, including fallback, or undefined when absent. alt/width/height reflect current props, title comes from a string native attr, and classNames.image is the merged semantic image class. A present slot takes precedence, including an intentionally empty result; removing it restores the default img. Stable images/rich nodes retain identity within the same structure. Progress/standalone-placeholder branches do not invoke this slot.

`ImageSlots` and `ImageRenderInfo` are exported from the component and package root. The top-level function prop is removed directly without a compatibility layer or deprecation period; see the [migration](../../../../docs/migrations/image-render-slot.md). Preview extensions use the distinct slots below.

### Preview slot scopes

Image and PreviewGroup support previewImage/previewActions; Group also supports previewCount. Current slot functions run when preview content actually renders. Empty slots suppress defaults, and removing them restores defaults. Closed/SSR previews and the Progress early branch do not eagerly invoke them. Only Group owns grouped preview extensions; a child Image's imageRender remains its thumbnail slot.

| Type | Fields |
|---|---|
| PreviewImageInfo | originNode (actual img VNode), src (raw current src including fallback, possibly undefined), alt, transform, current, total |
| PreviewActionsInfo | originNode (default toolbar VNode), icons, actions, transform, image (src/alt), current, total, disabled (zoomIn/zoomOut) |
| PreviewCountInfo | originNode (default counter VNode), current, total; Group only |

The current index is zero-based, matching the Group model; add one for display. A single image uses current=0/total=1. Transform is the current six-field snapshot. Actions provides zero-argument flipX/flipY/rotateLeft/rotateRight/zoomIn/zoomOut/reset/close callbacks using the same transform and close requests as default controls; disabled reports zoom button state. Arrow keys in inputs, textarea, select and contenteditable retain native editing behavior. Escape can still request closing, and child preventDefault takes priority.

These types, PreviewActions and PreviewGroupSlots are exported from the root entrypoint. Render `<component :is="info.originNode" />` to preserve image refs/gestures or the default toolbar. See the [preview slot migration](../../../../docs/migrations/image-preview-slots.md).

### Image · PreviewConfig (object form of `preview`)

| Property | Description | Type | Default |
|---|---|---|---|
| src | Large image used by the preview (defaults to `src`) | `string` | — |
| afterOpenChange | Called after the open/close motion | `(open) => void` | — |
| cover | Cover (hover layer). `false` renders nothing; `{ placement: 'center' \| 'top' \| 'bottom', coverNode }` | `MaskNode` | — |
| mask | Mask. `false` ⇒ root gets `-preview-mask-hidden` | `MaskNode` | — |
| maskClosable | Close when the mask is clicked | `boolean` | `true` |
| closable | Show the close button | `boolean` | `true` |
| closeIcon | Custom close icon | `VNodeChild` | — |
| movable | Allow dragging | `boolean` | `true` |
| minScale / maxScale / scaleStep | Zoom bounds and step | `number` | `1` / `50` / `0.5` |
| zIndex | Overlay z-index | `number` | `1080` (`zIndexPopupBase + 80`) |
| getContainer | Overlay container | `() => HTMLElement` | `document.body` |
| icons | Icon slots (rotateLeft/rotateRight/zoomIn/zoomOut/close/left/right/flipX/flipY) | `PreviewIcons` | built-in icons |
| rootClassName | ⚠️ Deprecated, use `classNames.root` | `string` | — |
| maskClassName | ⚠️ Deprecated, use `classNames.cover` | `string` | — |
| forceRender / destroyOnClose | Removed (no longer supported by antd); ignored when passed | — | — |

### Image · Events

| Name | Description |
|---|---|
| click | Original MouseEvent, after the internal preview request; supports Vue modifiers and listener arrays |
| error | Original img Event; placeholder roots do not receive image errors, and error.once belongs to the component |
| keydown | Original KeyboardEvent before built-in Enter/Space handling; preventDefault cancels that keyboard action |
| openChange | Interaction request `(nextOpen: boolean, prevOpen: boolean)`, captured before writing state |
| update:open | Boolean request for top-level `v-model:open`; prop changes do not echo events |
| transform | Complete current TransformInfo snapshot (rotate/scale/flipX/flipY/x/y); an accepted close also emits its reset, while a refused close keeps the transform |

With preview=false, native role/tabindex/aria-label survive. Preview triggers own button/0 and use an explicit aria-label before the alt fallback. Progress only notifies click/keydown without opening a latent preview. Bind with `@click`, `@error` and `@keydown`; onXxx in h()/ImageProps registers Vue listeners. See the [migration](../../../../docs/migrations/image-native-events.md) and [evidence](../../../../docs/audit/2026-10-25-image-native-events-remediation.md).

Open state has one public Vue entrypoint. Without open, internal state applies; removing control resumes the last synchronized value. Interaction emits openChange before update:open, and the parent may decline a request. Legacy preview state fields are removed; non-state business hooks remain in preview. See the [model migration](../../../../docs/migrations/image-open-model.md).

The ineffective preview.onTransform field moves directly to top-level `@transform`. Import TransformInfo from the root entrypoint. Listener arrays, replacement and `.once` follow Vue semantics; root DOM events with the same name do not enter this business event. See the [transform event migration](../../../../docs/migrations/image-transform-event.md).

Opening moves focus into the preview. Tab/Shift+Tab cycle within it, and Escape requests closing. A controlled parent declining that request keeps focus inside. Focus returns to the original trigger after the closing animation or when the whole preview unmounts. Close and group navigation buttons have their own accessible names, including with decorative custom icons.

### Image.PreviewGroup · Props

| Property | Description | Type | Default |
|---|---|---|---|
| items | Image list (preferred); a string or `{ src, alt, ... }` | `Array<string \| object>` | — |
| preview | Static preview content/behavior options, as in Image | `boolean \| GroupPreviewConfig` | `true` |
| open | Top-level controlled open state; supports `v-model:open` | `boolean` | — |
| defaultOpen | Uncontrolled initial state; later changes do not reset it | `boolean` | `false` |
| current | Controlled current index | `number` | — |
| defaultCurrent | Uncontrolled initial index | `number` | `0` |
| previewPrefixCls | Full preview prefix; current override first, then the current Provider-derived value | `string` | `${prefixCls}-preview` |
| classNames / styles | Same as `Image` | — | — |

### Image.PreviewGroup · Slots & Events

| Name | Description |
|---|---|
| default | Child `Image`s (collected in registration order when `items` is omitted) |
| previewImage / previewActions | Same native preview slots as Image |
| previewCount | Native counter slot receiving one PreviewCountInfo object; current is zero-based |
| openChange / update:open | Same open requests/model notifications as Image; supports `v-model:open` |
| change | Index request `(current: number, prevCurrent: number)` |
| update:current | Numeric model request after change; supports `v-model:current` |
| transform | Same transform snapshot as Image; child Images do not duplicate group notifications |

### Semantic slots

Image accepts static semantic objects through `ConfigProvider.components.image.classNames/styles`. Replacing a field, image config or entire components map, adding it later, and removing it use current values. Classes join local classes, local styles override global styles, and native root style comes last. Stable image/rich nodes retain input state. See the [evidence](../../../../docs/audit/2026-10-25-image-provider-remediation.md); global preview styles and PreviewGroup wiring remain under separate review.

Slots of `classNames` / `styles` (`placeholder` and `popup` are **nested groups**):

```
root / image / cover
placeholder.progress: root / content / rail / indicator
popup: root / mask / body / footer / actions / close
```

Merge priority (low → high): `classNames` → `preview.rootClassName` /
`preview.maskClassName` (deprecated surface) → **native `class` / `style`**
(applied to the root element).

> ⚠️ `popup` is a nested semantic group: this repo's `useMergeSemantic` does not yet
> implement antd's `schema` branch, and its `clsx` would collapse the object value into
> `''`, so `popup` is merged by the component itself (both `Image` and `PreviewGroup`).

### Static properties / named exports

| Name | Description |
|---|---|
| `Image.PreviewGroup` | Preview group. Also exported as `ImagePreviewGroup` |
| `genImageStyle(prefixCls?)` | Emits the full CSS of this component (for custom prefixes) |
| `genImageTokenDecls()` | Component variable declaration block (mirrors antd's `-css-var` block) |
| `prepareImageComponentToken(seed)` | Component token derivation (type `ImageComponentToken`) |

### Type exports

`ImageProps`, `PreviewConfig`, `PreviewGroupProps`, `GroupPreviewConfig`, `PreviewIcons`,
`PlaceholderType`, `ImageProgressConfig`, `ImageStatus`, `CoverPlacement`, `MaskType`,
`TransformInfo`, `ImageSemanticType`, `ProgressClassNames`, `ProgressStyles`.

## Theme (Component Token)

7 tokens (CSS variables `--apollo-image-*`): `zIndexPopup` (`zIndexPopupBase + 80` = 1080) /
`previewOperationColor` (`colorTextLightSolid` @0.65) / `previewOperationHoverColor` (@0.85) /
`previewOperationColorDisabled` (@0.25) / `previewOperationSize` (`fontSizeIcon × 1.5` = 18px) /
`progressAnimationDuration` (`3s`); derived `imagePreviewSwitchSize` (= `controlHeightLG`).

## Design notes

### Numeric `width` / `height` are normalized to `px`

Vue's `style` does **not** append `px` to numbers (that is React's behavior) — a bare
number is silently dropped. The component therefore routes every size through
`toCssSize()`: the root and `<img>` `style`, and the `Progress` width/height.
Missing this does not throw — the `<img>` falls back to the CSS `height:auto`, keeps the
intrinsic ratio and gets the wrong height: it **looks fine but is the wrong size**, and
only the L6 pixel comparison can catch it.

### The variable declaration block covers two roots

antd declares component variables on every `-css-var` root, and the preview overlay root
carries that class too (it receives `mergedRootClassName`). This repo has no `-css-var`
class, so the equivalent is to attach the declaration block to both `.apollo-image` and
`.apollo-image-preview`: the preview overlay is teleported to `body`, i.e. **outside** the
`.apollo-image` subtree, so attaching it only to the latter breaks every
`var(--apollo-image-preview-*)` (the close button font-size falls back from 18px to the
inherited 16px). Same as `input`.

### The preview overlay is portaled

The SSR-visible part of `Image` is the root `div` + `<img>` + placeholder + cover; the
preview overlay is mounted to `body` through `@apollo-design/portal` (`getContainer` can
change that), so it is **absent from the SSR output**. With `preview=false` the overlay
component is not mounted at all.

### Style imports

```ts
import '@apollo-design/theme/tokens.css'; // theme variables, required first
import '@apollo-design/ui/image/style.css';    // on demand
// or
import '@apollo-design/ui/style.css';          // all-in-one
```

The default published CSS uses the apollo namespace. `ConfigProvider.prefixCls="my-app"` produces `my-app-image` and `my-app-image-preview`; generate and load matching CSS with `genImageStyle('my-app')` during the application build. Image.prefixCls and Group.previewPrefixCls accept full prefixes. Dynamic updates change DOM names and require the corresponding CSS to be preloaded; the component generates no runtime styles. Open previews and stable rich nodes retain state; see the [prefix evidence](../../../../docs/audit/2026-10-25-image-prefix-remediation.md). The broader D04 strategy remains separate.

## FAQ

**Why is the preview overlay `z-index` 1080?**

`zIndexPopup = zIndexPopupBase(1000) + 80`, identical to antd; override it with
`preview.zIndex`.

**Can `items` and the default slot be used together in `Image.PreviewGroup`?**

`items` wins. When it is omitted, child `Image`s are collected in registration order
(registration returns an auto-incrementing id).

**Is the overlay re-created when switching inside a group?**

No. A group mounts exactly **one** `Preview` and updates `src` / `mousePosition` on switch.
