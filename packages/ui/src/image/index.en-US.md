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

See [`demo/`](./demo) (14 demos, one-to-one with antd): basic / component-token /
controlled-preview / cover-placement / fallback / image-render / nested /
placeholder / preview-group / preview-group-top-progress / preview-group-visible /
preview-img-info / preview-mask / preview-src.

## API

### Image · Props

| Property | Description | Type | Default |
|---|---|---|---|
| prefixCls | Class name prefix | `string` | from ConfigProvider, falls back to `apollo` |
| src | Image source | `string` | — |
| width / height | Size. Numbers are normalized to `px` (see Design notes) | `number \| string` | — |
| alt | Accessible name; also the root `aria-label` when previewable | `string` | — |
| fallback | Image shown when loading fails | `string` | — |
| placeholder | Placeholder content; `{ progress: true \| { percent, render } }` renders the progress layer | `VNodeChild \| { progress }` | — |
| preview | `false` disables preview; object form see below | `boolean \| PreviewConfig` | `true` |
| className | Root class name (also applied to `<img>`, same as antd) | `string` | — |
| class / style | **Native root attrs** (not Props) | `string` / `CSSProperties` | — |
| style | Root inline style. **Overrides `styles.root`** | `CSSProperties` | — |
| wrapperStyle | ⚠️ Deprecated, use `styles.root` | `CSSProperties` | — |
| classNames / styles | Semantic class names / styles, see "Semantic slots" | — | — |
| imageRender | Custom `<img>` rendering | `(info: ImageRenderInfo) => VNodeChild` | — |
| onClick | Click (internal preview opens first, then this runs) | `(e: MouseEvent) => void` | — |
| onError | `<img>` load error | `(e: Event) => void` | — |
| crossOrigin / decoding / loading / referrerPolicy / sizes / srcSet / useMap / draggable | Native attributes forwarded to `<img>` | — | — |

### Image · PreviewConfig (object form of `preview`)

| Property | Description | Type | Default |
|---|---|---|---|
| src | Large image used by the preview (defaults to `src`) | `string` | — |
| open | Controlled open state | `boolean` | — |
| defaultOpen | Uncontrolled initial open state | `boolean` | `false` |
| onOpenChange | Open state changed | `(open, prevOpen) => void` | — |
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
| imageRender | Custom rendering of the preview image | `(info) => VNodeChild` | — |
| actionsRender | Custom toolbar | `(originNode, info) => VNodeChild` | — |
| countRender | Custom counter text inside a group | `(current, total) => VNodeChild` | — |
| onTransform | Transform (rotate/scale/flip/x/y) changed | `(info: TransformInfo) => void` | — |
| visible | ⚠️ Deprecated, use `open` | `boolean` | — |
| onVisibleChange | ⚠️ Deprecated, use `onOpenChange` | `(visible, prevVisible) => void` | — |
| rootClassName | ⚠️ Deprecated, use `classNames.root` | `string` | — |
| maskClassName | ⚠️ Deprecated, use `classNames.cover` | `string` | — |
| toolbarRender | ⚠️ Deprecated, use `actionsRender` | `ActionsRender` | — |
| forceRender / destroyOnClose | Removed (no longer supported by antd); ignored when passed | — | — |

### Image · Events

| Name | Description |
|---|---|
| update:open | Emitted when the preview open state changes (**together with** `preview.onOpenChange`); supports `v-model:open` |

### Image.PreviewGroup · Props

| Property | Description | Type | Default |
|---|---|---|---|
| items | Image list (preferred); a string or `{ src, alt, ... }` | `Array<string \| object>` | — |
| preview | Same as `Image`, plus `onVisibleChange(visible, prev, current)` | `boolean \| GroupPreviewConfig` | `true` |
| current | Controlled current index | `number` | — |
| defaultCurrent | Uncontrolled initial index | `number` | `0` |
| previewPrefixCls | Preview layer prefix | `string` | `${prefixCls}-preview` |
| onChange | Current index changed | `(current, prevCurrent) => void` | — |
| classNames / styles | Same as `Image` | — | — |

### Image.PreviewGroup · Slots & Events

| Name | Description |
|---|---|
| default | Child `Image`s (collected in registration order when `items` is omitted) |
| update:current | Current index changed (**together with** `onChange`); supports `v-model:current` |

### Semantic slots

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
inherited 16px). Same as D69 for `input`.

### The preview overlay is portaled

The SSR-visible part of `Image` is the root `div` + `<img>` + placeholder + cover; the
preview overlay is mounted to `body` through `@apollo-design/portal` (`getContainer` can
change that), so it is **absent from the SSR output**. With `preview=false` the overlay
component is not mounted at all.

### Style imports

```ts
import '@apollo-design/theme/dist/tokens.css'; // theme variables, required first
import '@apollo-design/ui/image/style.css';    // on demand
// or
import '@apollo-design/ui/style.css';          // all-in-one
```

With a custom `prefixCls` (e.g. `my-app`), emit the CSS yourself via
`genImageStyle('my-app')` — the static artifacts only cover the `apollo` and `ant` prefixes.

## FAQ

**Why is the preview overlay `z-index` 1080?**

`zIndexPopup = zIndexPopupBase(1000) + 80`, identical to antd; override it with
`preview.zIndex`.

**Can `items` and the default slot be used together in `Image.PreviewGroup`?**

`items` wins. When it is omitted, child `Image`s are collected in registration order
(registration returns an auto-incrementing id).

**Is the overlay re-created when switching inside a group?**

No. A group mounts exactly **one** `Preview` and updates `src` / `mousePosition` on switch.
