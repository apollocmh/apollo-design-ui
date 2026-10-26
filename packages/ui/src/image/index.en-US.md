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

See [`demo/`](./demo) (18 native demos): basic / component-token /
controlled-preview / cover-placement / fallback / image-render / nested /
placeholder / preview-group / preview-group-top-progress / preview-group-visible /
preview-img-info / preview-mask / preview-src / style-class / transform-events /
popup-provider / preview-close.

## API

### Image · Props

| Property | Description | Type | Default |
|---|---|---|---|
| prefixCls | Full root prefix; follows the current prop and falls back to the current ConfigProvider namespace when removed | `string` | `apollo-image` |
| src | Image source | `string` | — |
| width / height | Size. Numbers are normalized to `px` (see Design notes) | `number \| string` | — |
| alt | Image alternative text; a nonempty value also names the trigger/dialog. Omission produces empty img alt and generic trigger/dialog names | `string` | `''` |
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
| previewCloseIcon | Customize the close icon; empty slots take priority and the button keeps its name | No arguments |

`originNode` is a real VNode carrying the original ref, load/error handling, native attributes and styles. Render it with `<component :is="originNode" />`. `src` is the current raw img src, including fallback, or undefined when absent. alt/width/height reflect current props, title comes from a string native attr, and classNames.image is the merged semantic image class. A present slot takes precedence, including an intentionally empty result; removing it restores the default img. Stable images/rich nodes retain identity within the same structure. Progress/standalone-placeholder branches do not invoke this slot.

`ImageSlots` and `ImageRenderInfo` are exported from the component and package root. The top-level function prop is removed directly without a compatibility layer or deprecation period; see the [migration](../../../../docs/migrations/image-render-slot.md). Preview extensions use the distinct slots below.

### Preview slot scopes

Image and PreviewGroup support previewImage/previewActions/previewCloseIcon; Group also supports previewCount. Current slot functions run when preview content actually renders. Empty slots suppress defaults, and removing them restores defaults. Closed/SSR previews and the Progress early branch do not eagerly invoke them. Only Group owns grouped preview extensions; a child Image's imageRender remains its thumbnail slot.

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
| cover | Thumbnail cover; false hides it, null/omission uses default content; placement-only objects are supported | `VNodeChild \| { placement?: 'center' \| 'top' \| 'bottom', coverNode?: VNodeChild }` | — |
| mask | Preview mask appearance; false hides it. Object fields are blur/className/style; semantic styles.popup.mask takes priority | `boolean \| { blur?: boolean, className?: string, style?: Record<string, string \| number> }` | `true` |
| maskClosable | Close when the mask is clicked | `boolean` | `true` |
| closable | Show the close button | `boolean` | `true` |
| closeIcon | Custom close icon | `VNodeChild` | — |
| movable | Allow dragging | `boolean` | `true` |
| minScale / maxScale / scaleStep | Zoom bounds and step | `number` | `1` / `50` / `0.5` |
| zIndex | Overlay z-index | `number` | `1080` (`zIndexPopupBase + 80`) |
| getContainer | Current overlay container; falls back to ConfigProvider.getPopupContainer, then body | `() => HTMLElement` | `document.body` |
| icons | Icon slots (rotateLeft/rotateRight/zoomIn/zoomOut/close/left/right/flipX/flipY) | `PreviewIcons` | built-in icons |
| rootClassName | Additional popup root class; semantic entry is classNames.popup.root | `string` | — |
| maskClassName | Additional popup mask class; semantic entry is classNames.popup.mask | `string` | — |

Close icon priority is the current `#previewCloseIcon` → explicit `preview.closeIcon` (including null/false/0) → `preview.icons.close` → built-in icon. `closable=false` hides only the close button and skips its icon slot; Escape, maskClosable and the toolbar close action retain their behavior. Live visibility/content updates retain preview identity, editors and transforms. The button keeps an independent accessible name. See the [close-control regression](../../../../docs/audit/2026-10-25-image-preview-close-remediation.md).

Image/Group read the current minScale/maxScale for zoom, wheel, double-click and non-reset transforms. Replacing/removing limits applies on the next operation; changing the configuration retains the current scale and preview identity without emitting transform. At or above the current maximum, both the zoom-in button and previewActions.disabled.zoomIn are disabled. Reset/close still return to scale 1. See the [bounds regression](../../../../docs/audit/2026-10-25-image-scale-bounds-remediation.md).

scaleStep is a proportional increment: zoom-in multiplies by 1+step, zoom-out divides by it. The default 0.5 changes 1 to 1.5 and applies to wheel and double-click zoom from 1. Step/min/max must be finite positive numbers; invalid values use defaults, and max below min is normalized to min. See the consolidated [migration](../../../../docs/migrations/image-contracts.md) for resources, containers, Group types and zoom behavior. Ineffective forceRender/destroyOnClose fields are removed from the type.

Loading uses actual img events and cached completion, with no extra Image constructor or validation request. Fallback removes failed srcSet/sizes so candidates cannot override it; changing src/srcSet/sizes retries the current resource. Drag accepts the primary button and releases its owning-window listeners on close, movable=false, lost button, window blur and unmount.

### Image · Events

| Name | Description |
|---|---|
| click | Original MouseEvent, after the internal preview request; supports Vue modifiers and listener arrays |
| error | Original img Event; placeholder roots do not receive image errors, and error.once belongs to the component |
| keydown | Original KeyboardEvent before built-in Enter/Space handling; preventDefault cancels that keyboard action |
| openChange | Interaction request `(nextOpen: boolean, prevOpen: boolean)`, captured before writing state |
| update:open | Boolean request for top-level `v-model:open`; prop changes do not echo events |
| transform | Complete current TransformInfo snapshot (rotate/scale/flipX/flipY/x/y); an accepted close also emits its reset, while a refused close keeps the transform |

With preview=false, native role/tabindex/aria-label survive. Ordinary preview roots own button/0. An imageRender slot or VNode cover uses a group root and adds a separate visible native preview button for nonempty image content. originNode remains a plain img that callers can place in their own native controls. Native controls, labels, editable descendants and canceled events retain their behavior without propagation modifiers. The image and noninteractive cover still open the preview; caption text remains selectable. Rich roots grow naturally while height still sizes the image; explicit root styles take priority. The button name is “Preview image: name”, using an explicit aria-label before alt. Ordinary root naming is unchanged. Progress only notifies click/keydown without opening a latent preview. Bind with `@click`, `@error` and `@keydown`; onXxx in h()/ImageProps registers Vue listeners. See the [consolidated migration](../../../../docs/migrations/image-contracts.md).

The modal preview locks focus and its owning body through leave completion, including mask=false; each instance releases its own locks and returns focus to its actual trigger. Escape follows the owning window's top layer and IME protection, with native cancellation taking priority. Group arrow shortcuts require an unmodified, non-composing event outside editors. Reduced motion, theme motion=false and zero transition duration avoid the 500ms fallback; live preference and theme changes preserve preview content.

When imageRender completely replaces originNode, nonempty content retains a separate visible native preview button; empty slots add none. Closing prioritizes the saved connected focus target, with the current preview action as a fallback if the trigger was replaced.

Open state has one public Vue entrypoint. Without open, internal state applies; removing control resumes the last synchronized value. Interaction emits openChange before update:open, and the parent may decline a request. Legacy preview state fields are removed; non-state business hooks remain in preview. See the [model migration](../../../../docs/migrations/image-open-model.md).

The ineffective preview.onTransform field moves directly to top-level `@transform`. Import TransformInfo from the root entrypoint. Listener arrays, replacement and `.once` follow Vue semantics; root DOM events with the same name do not enter this business event. See the [transform event migration](../../../../docs/migrations/image-transform-event.md).

Opening moves focus into the preview. Tab/Shift+Tab cycle within it, and Escape requests closing. A controlled parent declining that request keeps focus inside. Focus returns to the original trigger after the closing animation or when the whole preview unmounts. Close and group navigation buttons have their own accessible names, including with decorative custom icons.

### Image.PreviewGroup · Props

| Property | Description | Type | Default |
|---|---|---|---|
| items | Preferred image list; native image attributes plus src/width/height/fallback and optional business metadata | `Array<string \| PreviewGroupItem>` | — |
| preview | Preview behavior; excludes Image-specific src/cover, which belong to items/child Images | `boolean \| GroupPreviewConfig` | `true` |
| open | Top-level controlled open state; supports `v-model:open` | `boolean` | — |
| defaultOpen | Uncontrolled initial state; later changes do not reset it | `boolean` | `false` |
| current | Controlled current index | `number` | — |
| defaultCurrent | Uncontrolled initial index | `number` | `0` |
| previewPrefixCls | Full preview prefix; current override first, then the current Provider-derived value | `string` | `${prefixCls}-preview` |
| classNames / styles | Actual group root and shared popup semantics; child Image semantics belong to the child/Provider | Corresponding PreviewGroupSemanticType fields | — |

Removing current control resumes the last synchronized index; shrinking an uncontrolled list normalizes it into range. Empty lists mount no blank dialog. Disabled/empty groups leave no inert preview button semantics on children. Both items and registered data carry dimensions/fallback and forward only native image attributes to img.

### Image.PreviewGroup · Slots & Events

| Name | Description |
|---|---|
| default | Child `Image`s (collected in registration order when `items` is omitted) |
| previewImage / previewActions | Same native preview slots as Image |
| previewCloseIcon | Same no-argument close icon slot as Image; only Group owns grouped content |
| previewCount | Native counter slot receiving one PreviewCountInfo object; current is zero-based |
| openChange / update:open | Same open requests/model notifications as Image; supports `v-model:open` |
| change | Index request `(current: number, prevCurrent: number)` |
| update:current | Numeric model request after change; supports `v-model:current` |
| transform | Same transform snapshot as Image; child Images do not duplicate group notifications |

### Semantic slots

Image consumes static semantic objects from `ConfigProvider.components.image.classNames/styles`; both Image and PreviewGroup consume their popup group for the shared preview. Field/image/map replacement, late addition and removal read current values while retaining stable images, editors and open previews. See the [ordinary image report](../../../../docs/audit/2026-10-25-image-provider-remediation.md) and [popup provider report](../../../../docs/audit/2026-10-25-image-popup-provider-remediation.md).

Slots of `classNames` / `styles` (`placeholder` and `popup` are **nested groups**):

```
root / image / cover
placeholder.progress: root / content / rail / indicator
popup: root / mask / body / footer / actions / close
```

Provider/local classes concatenate through the nested schema before existing preview class aliases are added. Popup style fields merge shallowly: a local popup.root replaces the Provider's whole root style object, while other fields remain. Native class/style stay on the actual Image/Group root and are not copied to the popup. Native Image root style still overrides styles.root. The shared merge rules and static configuration shape are unchanged.

Group navigation icons read the current ConfigProvider.direction, resolving defaults and custom icons before mirroring for ltr/rtl. A one-sided custom icon retains the other default, and explicit null stays empty. Replacing/removing icons updates the open preview while retaining image, transform and editor state. Previous/Next still request adjacent indices and keep their names. See the [direction regression](../../../../docs/audit/2026-10-25-image-provider-direction-remediation.md).

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
`TransformInfo`, `ImageSemanticType`, `PreviewGroupSemanticType`, `PreviewGroupItem`, `ProgressClassNames`, `ProgressStyles`. Image.PreviewGroup has the same complete declaration type as the named ImagePreviewGroup export.

## Theme (Component Token)

7 tokens (CSS variables `--apollo-image-*`): `zIndexPopup` (`zIndexPopupBase + 80` = 1080) /
`previewOperationColor` (`colorTextLightSolid` @0.65) / `previewOperationHoverColor` (@0.85) /
`previewOperationColorDisabled` (@0.25) / `previewOperationSize` (`fontSizeIcon × 1.5` = 18px) /
`progressAnimationDuration` (`3s`); `imagePreviewSwitchSize` (= `controlHeightLG`, 40px by default, mapped to `--apollo-image-preview-switch-size`) controls the actual group switch width and height.

Override all seven through `ConfigProvider.theme.components.Image`. Thumbnail, Progress and body-mounted preview read current alias/component variables from the same Vue context, including an outer ThemeProvider, nested inheritance, dark/compact algorithms and replacement/removal. Static CSS owns unconfigured defaults. Native Image style and popup semantic styles can override variables. Stacking priority is preview.zIndex, styles.popup.root.zIndex, parent overlay context, then the component variable. See the actual component-token demo and [shared evidence](../../../../docs/audit/2026-10-25-image-contract-audit.md).

The default group counter uses a `colorBgSpotlight` background and inherits the footer operation color, including over a light page or with the mask disabled. This background applies only to the default counter node (also available as `previewCount.originNode`); custom counter slots keep their own styling. See the [contrast regression](../../../../docs/audit/2026-10-25-image-counter-contrast-remediation.md).

## Design notes

### Numeric `width` / `height` are normalized to `px`

Vue's `style` does **not** append `px` to numbers (that is React's behavior) — a bare
number is silently dropped. The component therefore routes every size through
`toCssSize()`: the root and `<img>` `style`, and the `Progress` width/height.
Missing this does not throw — the `<img>` falls back to the CSS `height:auto`, keeps the
intrinsic ratio and gets the wrong height: it **looks fine but is the wrong size**, and
only the L6 pixel comparison can catch it.

### The variable declaration block covers two roots

Static defaults cover both `.apollo-image` and `.apollo-image-preview`. Configured themes write current CSS variables on each actual root. Vue provide/inject preserves source context across Teleport, so the preview does not depend on source DOM ancestry. No component stylesheet or global theme patch is generated at runtime.

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
