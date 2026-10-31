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
| open / v-model:open | Whether visible. Cancel/close requests false; OK only notifies | `boolean` | `false` |
| title | Title text; `#title` takes precedence | `string` | — |
| width | Width (accepts a responsive breakpoint object) | `string \| number \| Partial<Record<Breakpoint, string \| number>>` | `520` |
| height | Height | `string \| number` | — |
| loading | Skeleton in the body (**footer is forced off**) | `boolean` | `false` |
| centered | Vertically centered | `boolean` | `false` |
| closable | Close button. `false` hides it; an object may carry `disabled` / `onClose` / `afterClose` | `boolean \| {...}` | `true` |
| mask | Mask. `false` disables it; an object may carry `enabled` / `blur` / `closable` | `boolean \| { enabled?, blur?, closable? }` | `true` |
| okText / cancelText | Text; same-name slots take precedence | `string` | locale (OK / Cancel) |
| okType | OK button type | `'text' \| 'link' \| 'primary' \| 'default' \| 'dashed'` | `'primary'` |
| confirmLoading | OK button loading (**cancelling is blocked while true**) | `boolean` | `false` |
| okButtonProps / cancelButtonProps | OK / Cancel button props; use Vue-native `class` for root styling (not `className` / `rootClassName`) | `ModalButtonProps` | — |
| getContainer | Container; `false` renders **inline** (no portal) | `GetContainer` (Portal; includes Element / ShadowRoot / function / false) | `document.body` |
| zIndex | z-index | `number` | — |
| keyboard | Close on ESC | `boolean` | `true` |
| scrollLock | Lock body scroll while open | `boolean` | `true` |
| forceRender | Render even when closed | `boolean` | `false` |
| destroyOnHidden | Unmount on close | `boolean` | `false` |
| mousePosition | Origin of the zoom motion | `{ x, y } \| null` | — |
| focusable | Focus behaviour: `{ trap?, focusTriggerAfterClose? }` | — | `trap` follows `mask`; `focusTriggerAfterClose: true` |
| panelRef | Panel root node (forwarded to watermark) | `Ref \| Function` | — |
| classNames / styles | Nine semantic targets; objects or functions receiving `{ props: ModalProps }` from the current render | `ModalProps["classNames"] / ModalProps["styles"]` | — |

**deprecated (dev warnings)**: `bodyStyle` → `styles.body`; `maskStyle` → `styles.mask`;
`destroyOnClose` → `destroyOnHidden`; `focusTriggerAfterClose` → `focusable.focusTriggerAfterClose`;
`maskClosable` → `mask.closable`; `autoFocusButton` → `focusable.autoFocusButton`.

### Events and slots

| Event | Payload | Meaning |
|---|---|---|
| `update:open` | `boolean` | Cancellation/close request. Controlled refusal preserves the actual open state |
| `ok` | `Event` | OK notification; manage asynchronous loading and closing in the parent |
| `cancel` | `Event` | Cancel button, close button, mask or Escape |
| `afterClose` | none | Leave motion completed |
| `afterOpenChange` | `boolean` | Open/close motion completed |

| Slot | Scope | Content |
|---|---|---|
| default | — | Body |
| title / okText / cancelText / closeIcon | — | Named content; empty slots hide it |
| footer | `{ OkBtn, CancelBtn }` | Stable action components using current button configuration and events |
| modalRender | `{ ModalPanel }` | Stable current panel component; wrap it with `<component :is="ModalPanel" />` |

Native `class`, `style`, `id`, ARIA, data attributes and listeners land on the actual panel.
`panelRef` receives `HTMLElement | null`; Modal does not expose focus/blur methods.
An omitted `open` starts closed; withdrawing a controlled `open` preserves its last accepted value.

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
| `then(resolve, reject)` | Hook instances only: `await api.confirm(config)` resolves `true` for accepted OK and `false` for cancellation, destruction or holder/owner teardown |

`onOk(close)` and `onCancel(close)` are imperative services. Returning a promise enables
loading and closes on success; rejection keeps the dialog open. Programmatic `footer(originNode,
{ OkBtn, CancelBtn })`, `modalRender(node)`, `afterClose` and `afterOpenChange` remain config functions.
Closing/closed instances ignore updates and unregister from `destroyAll` after cleanup. Commands
issued before the hook holder mounts are retained; destroying such a command prevents mounting.

`ModalFuncProps` adds `content` / `icon` / `type` / `okCancel` / `autoFocusButton` /
`focusable.autoFocusButton` on top of `ModalProps`, and narrows `width` to `string | number`.

### Semantic slots (9)

```
root / container / wrapper / mask / header / title / body / footer / close
```

⚠️ Inside `ConfirmDialog`, `body` is lifted out and re-attached to `-confirm-content`.

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
   `focusable.autoFocusButton: null` explicitly disables button autofocus (the deprecated top-level form also supports `null`).

## Known differences from antd

See `COMPATIBILITY.md` for the retained differences: no `ContextIsolator`
(form / space isolation); no cssinjs hash / `-css-var` classes; the imperative path
mounts a Vue app into a detached `div` (React uses a `DocumentFragment`); `holderRender`
is not implemented.

## Migration

Replace ordinary `afterClose` / `afterOpenChange` props with `@after-close` /
`@after-open-change` (`onAfterClose` / `onAfterOpenChange` in `h()`). `@ok` and `@cancel`
are typed Vue events. Replace ordinary `modalRender` with `#modalRender`; use the scoped
`ModalPanel` component. Ordinary footer content uses `#footer` and its scoped buttons.
Imperative configuration services and programmatic renderers retain their responsibilities.

The ordinary `focusTrap` declaration had no runtime consumer; use `focusable.trap`.
The imperative config's inherited `open` field also had no consistent lifecycle consumer
and has been removed: calling a method opens, `destroy()` closes, and `update()` changes
only the content and effective configuration of a live session. It does not reopen one.

Imperative `update({ confirmLoading: true })` explicitly shows the OK loading state and
blocks clicking it. Updating to `false` restores the business promise's own loading state;
an unsettled promise continues showing its spinner.
