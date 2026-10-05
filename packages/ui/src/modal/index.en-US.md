---
category: Feedback
title: Modal
subtitle: Modal
---

A modal dialog. Use it when the user must handle a transaction without leaving the page.

## When to use

- When the user should **focus on a single task** (a form, a confirmation, a warning).
- When you need an **imperative** dialog (`Modal.confirm(...)` / `Modal.info(...)`).
- When the dialog must constrain focus (focus trap + focus restore on close).

## Demos

See [`demo/`](./demo) (23 files, mirroring antd's demo list).

## API

### Component `<Modal>`

| Prop | Description | Type | Default |
|---|---|---|---|
| open | Whether visible | `boolean` | `false` |
| title | Title | `VNodeChild` | — |
| footer | Footer. `null` disables it; the function form receives `(originNode, { OkBtn, CancelBtn })` | `VNodeChild \| Function` | Cancel + OK |
| width | Width (accepts a responsive breakpoint object) | `string \| number \| Partial<Record<Breakpoint, string \| number>>` | `520` |
| height | Height | `string \| number` | — |
| loading | Skeleton in the body (**footer is forced off**) | `boolean` | `false` |
| centered | Vertically centered | `boolean` | `false` |
| closable | Close button. `false` hides it; an object may carry `disabled` / `onClose` / `afterClose` | `boolean \| {...}` | `true` |
| closeIcon | Custom close icon | `VNodeChild` | `<CloseOutlined />` |
| mask | Mask. `false` disables it; an object may carry `enabled` / `blur` / `closable` | `boolean \| { enabled?, blur?, closable? }` | `true` |
| okText / cancelText | Button text | `VNodeChild` | locale (OK / Cancel) |
| okType | OK button type | `'text' \| 'link' \| 'primary' \| 'default' \| 'dashed'` | `'primary'` |
| confirmLoading | OK button loading (**cancelling is blocked while true**) | `boolean` | `false` |
| okButtonProps / cancelButtonProps | OK / Cancel button props; use Vue-native `class` for root styling (not `className` / `rootClassName`) | `ModalButtonProps` | — |
| onOk / onCancel | OK / Cancel (also mask, close button and ESC) | `(e: Event) => void` | — |
| afterClose / afterOpenChange | Close motion end / motion end (both directions) | `() => void` / `(open: boolean) => void` | — |
| getContainer | Container; `false` renders **inline** (no portal) | `false \| string \| HTMLElement \| () => HTMLElement` | `document.body` |
| zIndex | z-index | `number` | — |
| keyboard | Close on ESC | `boolean` | `true` |
| scrollLock | Lock body scroll while open | `boolean` | `true` |
| forceRender | Render even when closed | `boolean` | `false` |
| destroyOnHidden | Unmount on close | `boolean` | `false` |
| modalRender | Custom panel render (wraps in `-render`) | `(node) => VNodeChild` | — |
| mousePosition | Origin of the zoom motion | `{ x, y } \| null` | — |
| focusable | Focus behaviour: `{ trap?, focusTriggerAfterClose? }` | — | `trap` follows `mask`; `focusTriggerAfterClose: true` |
| panelRef | Panel root node (forwarded to watermark) | `Ref \| Function` | — |
| classNames / styles | 9 semantic slots (a **function form** is accepted at runtime) | — | — |

**deprecated (dev warnings)**: `bodyStyle` → `styles.body`; `maskStyle` → `styles.mask`;
`destroyOnClose` → `destroyOnHidden`; `focusTriggerAfterClose` → `focusable.focusTriggerAfterClose`;
`maskClosable` → `mask.closable`; `autoFocusButton` → `focusable.autoFocusButton`.

### Imperative (static methods)

| Method | Description |
|---|---|
| `Modal.confirm(config)` / `info` / `success` / `error` / `warning` / `warn` | Open a confirmation dialog. `warning` and `warn` are **the same function** |
| `Modal.destroyAll()` | Close every imperative instance |
| `Modal.useModal()` | Returns `[api, contextHolder]`; `api` exposes the same six methods |
| `Modal.config({ rootPrefixCls })` | **Deprecated** — use `ConfigProvider.config` |
| `Modal._InternalPanelDoNotUseOrYouWillBeFired` | Private panel (**no portal, no mask, no motion**) for docs and debugging |

Imperative instance (returned by `Modal.confirm(...)` / `useModal()`):

| Member | Description |
|---|---|
| `destroy()` | **Closes** (runs the leave motion, then unmounts via `afterClose`) — not an immediate unmount |
| `update(config)` | Update the config (shallow merge, or pass a function) |
| `then(resolve)` | ⚠️ The instance is **thenable**: `await Modal.confirm(...)` resolves with the confirmation result, and afterwards closing **no longer triggers `onCancel`** |

`ModalFuncProps` adds `content` / `icon` / `type` / `okCancel` / `autoFocusButton` /
`focusable.autoFocusButton` on top of `ModalProps`, and narrows `width` to `string | number`.

### Semantic slots (9)

```
root / container / wrapper / mask / header / title / body / footer / close
```

⚠️ Inside `ConfirmDialog`, `body` / `mask` are lifted out and re-attached to `-confirm-content`.

## Theme (Component Token)

Six public tokens (overridable via `theme.components.Modal`): `headerBg`(transparent) /
`footerBg`(transparent) / `titleLineHeight`(`lineHeightHeading5`) /
`titleFontSize`(`fontSizeHeading5`) / `titleColor`(`colorTextHeading`) /
`contentBg`(`colorBgElevated`).

There are also **12 internal** tokens (emitted as CSS variables but outside the public
type surface): `contentPadding` / `headerPadding` / `headerBorderBottom` /
`headerMarginBottom` / `bodyPadding` / `footerPadding` / `footerBorderTop` /
`footerBorderRadius` / `footerMarginTop` / `confirmBodyPadding` /
`confirmIconMarginInlineEnd` / `confirmBtnsMarginTop` — each switching between two
value sets under the `wireframe` theme.

## Focus (hard a11y requirements)

1. **Focus trap**: enabled only when `focusable.trap` (defaults to the `mask` flag),
   `visible`, and the container's `position: fixed` are all true;
2. **Focus restore**: focus returns to the previously active element on close
   (`focusable.focusTriggerAfterClose`, default `true`).
   ⚠️ Upstream gates this on `mask` as well — **a dialog without a mask does not restore focus**
   (we follow upstream);
3. **`autoFocusButton`**: confirmation dialogs focus the OK button by default.
   ⚠️ Only the **deprecated top-level `autoFocusButton`** can express "do not autofocus" (`null`);
   `focusable.autoFocusButton: null` is swallowed by upstream's `||` and falls back to `'ok'`.

## Known differences from antd

See the deviation table in `COMPATIBILITY.md`. In short: no `ContextIsolator`
(form / space isolation, D36); no cssinjs hash / `-css-var` classes; the imperative path
mounts a Vue app into a detached `div` (React uses a `DocumentFragment`); `holderRender`
is not implemented.
