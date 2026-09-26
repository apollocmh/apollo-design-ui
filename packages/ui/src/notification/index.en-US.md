---
category: Feedback
title: Notification
subtitle: Notification
---

Display global notifications in six placements. Imperative API (`notification.success({ title })`),
the overlay is portaled.

## When to use

- A heavier notification than `message`: title + description + action buttons.
- Notifications should appear in a specific placement (topRight / bottomRight / top…).
- An auto-close countdown bar is needed (`showProgress`).
- ⚠️ Prefer `notification.useNotification()` and its `contextHolder`: static methods **cannot
  consume context**.

## Demos

See [`demo/`](./demo) (14 demos, one-to-one with antd): basic / component-token / custom-icon /
duration / hooks / placement / progress-color / render-panel / show-with-progress /
stack / style-class / update / with-btn / with-icon.

## API

### Static methods

| Method | Description | Signature |
|---|---|---|
| `notification.success` / `info` / `warning` / `error` | Open a notification of that type | `(config: ArgsProps) => void` |
| `notification.open` | Open with full config | `(config: ArgsProps) => void` |
| `notification.destroy` | Close one (by key) or all | `(key?: string \| number) => void` |
| `notification.config` | Global defaults (**merged**) | `(config: GlobalConfigProps) => void` |
| `notification.useNotification` | Hook form | `(config?) => [NotificationInstance, () => VNode]` |
| `notification._InternalPanelDoNotUseOrYouWillBeFired` | Private: single static panel | component |
| `notification._InternalListDoNotUseOrYouWillBeFired` | Private: static list | component |

> ⚠️ **`open()` returns `void`** — unlike `message`, notification has no thenable/callable
> handle; it also has no `loading` type (`IconType` has 4 values).

### `ArgsProps`

| Property | Description | Type | Default |
|---|---|---|---|
| title | Title | `VNodeChild` | — |
| description | Description; wrapped in `-notice-section` together with `title` | `VNodeChild` | — |
| actions | Action area | `VNodeChild` | — |
| type | `'success' \| 'info' \| 'error' \| 'warning'` | — | — |
| placement | One of six placements; **per-notice wins over global** | `NotificationPlacement` | `'topRight'` |
| duration | Seconds; `0` / `false` ⇒ never auto close | `number \| false` | `4.5` |
| showProgress | Show the auto-close countdown bar | `boolean` | — |
| pauseOnHover | Pause the timer on hover | `boolean` | `true` |
| closable | Close button. `false` / `null` ⇒ **no button at all** | `boolean \| null \| { closeIcon?, disabled?, onClose? }` | `true` |
| closeIcon | Custom close icon; `null` ⇒ no button (upstream semantics) | `VNodeChild` | — |
| icon | Custom icon (when given, `-notice-icon-{type}` is **not** applied) | `VNodeChild` | type icon |
| role | ARIA role of the notice root | `'alert' \| 'status'` | `'alert'` |
| key | Unique id; opening the same key reuses the notice | `string \| number` | auto |
| onClose / onClick / className / style / classNames / styles / props | same as antd | — | — |
| message / btn | ⚠️ Deprecated: use `title` / `actions` | — | — |

### `GlobalConfigProps` (`config()`) and `NotificationConfig` (`useNotification()`)

`top` / `bottom` / `duration` / `showProgress` / `pauseOnHover` / `prefixCls` / `getContainer` /
`placement` / `closeIcon` / `closable` / `rtl` / `maxCount` / `props`; the hook config also has
`stack` (`boolean | { threshold }`, **defaults to `{ offset: 8 }` ⇒ stacked by default**) and
`classNames` / `styles`.

### Semantic slots (11)

```
list / listContent                                                                    // list level
wrapper / root / title / description / actions / icon / section / close / progress    // notice level
```

> ⚠️ Only the **object form** is supported (function form is PENDING, same as D36).

### Type exports

`NotificationArgsProps`, `NotificationGlobalConfigProps`, `NotificationConfig`,
`NotificationInstance`, `NotificationPlacement`, `NotificationIconType`, `NotificationSemanticType`.

## Theme (Component Token)

7 keys (CSS variables `--apollo-notification-*`), 3 of which have defaults:

| token | Value |
|---|---|
| `zIndexPopup` | `zIndexPopupBase + CONTAINER_MAX_OFFSET(1000) + 50` = **2050** (⚠️ message uses `+10`) |
| `width` | `384` |
| `progressBg` | `linear-gradient(90deg, colorPrimaryBorderHover, colorPrimary)` |
| `colorSuccessBg` / `colorErrorBg` / `colorInfoBg` / `colorWarningBg` | `undefined` by default (the product uses a `var()` with fallback) |

## Design notes

### It shares the notification kernel with `message`

Both are built on `notification/engine/` (our own Vue port of rc-notification); the difference is
only in config translation and the notice's inner semantics (notification has title + description +
actions + close button; message is a single line of text).

### Stacked by default

`DEFAULT_STACK_CONFIG = { offset: 8 }` ⇒ the list root always carries `-stack`, and notifications
collapse beyond the threshold (3 by default). `message` defaults to `false` — the easiest of the
two to mix up.

### Style imports

```ts
import '@apollo-design/theme/dist/tokens.css';      // theme variables, required first
import '@apollo-design/ui/notification/style.css';  // on demand
// or
import '@apollo-design/ui/style.css';               // all-in-one
```

## FAQ

**Why does the close button sometimes have no icon?**

`closable: false` or `closeIcon: null` **removes the whole button** (upstream semantics); use
`closable: { closeIcon: null }` for "button without icon".

**Is `duration: 0` different from `duration: false`?**

No — both are normalized to `false` (never auto close).

**What happens when the same key is opened twice?**

The notice is reused and its content updated (see the `update` demo); no new notice is added.
