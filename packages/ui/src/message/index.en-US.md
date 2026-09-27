---
category: Feedback
title: Message
subtitle: Global message
---

Display global feedback messages. Imperative API (`message.success(...)`), the overlay is portaled.

## When to use

- Show a short-lived result of an operation at the top of the page (success / error / warning / loading).
- Chain a "in progress → done" flow (`loading` + `then`).
- ⚠️ Prefer `message.useMessage()` and its `contextHolder`: static methods **cannot consume
  context**, so ConfigProvider configuration does not apply to them.

## Demos

See [`demo/`](./demo) (11 demos, one-to-one with antd): component-token / duration / hooks /
info / loading / other / render-panel / stack / style-class / thenable / update.

## API

### Static methods

| Method | Description | Signature |
|---|---|---|
| `message.success` / `info` / `warning` / `error` / `loading` | Open a message of that type | `(content, duration?, onClose?) => MessageType` |
| `message.open` | Open with full config | `(config: ArgsProps) => MessageType` |
| `message.destroy` | Close one (by key) or all | `(key?: string \| number) => void` |
| `message.config` | Global defaults (**merged**) | `(config: ConfigOptions) => void` |
| `message.useMessage` | Hook form | `(config?: ConfigOptions \| (() => ConfigOptions)) => [MessageInstance, () => VNode]` |
| `message._InternalPanelDoNotUseOrYouWillBeFired` | Private: single static panel (docs/debug) | component |
| `message._InternalListDoNotUseOrYouWillBeFired` | Private: static list (same) | component |

> ⚠️ When the **second argument is a function**, it is treated as `onClose` and the third is ignored.

### Return value `MessageType`

**Callable + thenable** (identical to antd):

```ts
const hide = message.loading('In progress…', 0);
hide();                       // calling closes it
message.loading('In progress…', 2).then(() => message.success('Done'));
```

| Member | Description |
|---|---|
| `()` | Close this message |
| `.then(fn)` | Resolves `true` on **natural close** (timer expiry); ⚠️ a manual close does **not** resolve (upstream semantics) |
| `.promise` | Underlying `Promise<boolean>` |

### `ArgsProps` (input of `message.open`)

| Property | Description | Type | Default |
|---|---|---|---|
| content | Content | `VNodeChild` | — |
| duration | Display duration in seconds; `0` disables auto close | `number` | `3` |
| type | `'info' \| 'success' \| 'error' \| 'warning' \| 'loading'` | — | — |
| key | Unique id; opening the same key **reuses** the notice (content update) | `string \| number` | auto |
| icon | Custom icon (takes precedence; the type class is still applied) | `VNodeChild` | type icon |
| onClose | Called on natural close | `() => void` | — |
| onClick | Click on the notice root | `(e: MouseEvent) => void` | — |
| pauseOnHover | Pause the timer on hover | `boolean` | `true` |
| className / style | Notice root class / style | — | — |
| classNames / styles | Semantic slots (see below) | — | — |

### `ConfigOptions` (`config()` / `useMessage()`)

| Property | Description | Type | Default |
|---|---|---|---|
| top | Offset from the top (number ⇒ px) | `number \| string` | `8` |
| duration | Default duration (seconds) | `number` | `3` |
| maxCount | Max visible; keeps the **last** N | `number` | — |
| rtl | Adds `-rtl` to the list root | `boolean` | from ConfigProvider direction |
| stack | Stacked collapse: `true` or `{ threshold }` | `boolean \| { threshold?: number }` | `false` |
| pauseOnHover | Pause on hover | `boolean` | `true` |
| getContainer | Portal container | `() => HTMLElement` | `document.body` |
| prefixCls | Class prefix | `string` | `apollo-message` |
| transitionName | Motion name | `string` | `{prefixCls}-fade` |
| classNames / styles | Semantic slots | — | — |

### Semantic slots (6)

```
list / listContent              // list level
root / wrapper / icon / title   // notice level
```

> ⚠️ Only the **object form** is supported (function form is PENDING, same as D36).

### Slots (C8-R2, only the `_InternalPanelDoNotUseOrYouWillBeFired` static panel)

| Slot | Description | Arguments |
|---|---|---|
| content | Rich content (equivalent to the `content` text prop, slot first) | — |
| icon | Custom icon (empty slot = hidden) | — |

> The imperative input `message.open({ content, icon })` keeps `VNodeChild` (programmatic context, no template).

### Type exports

`MessageArgsProps`, `MessageConfigOptions`, `MessageInstance`, `MessageType`,
`MessageNoticeType`, `MessageTypeOpen`, `MessageJointContent`, `MessageSemanticType`.

## Theme (Component Token)

3 tokens (CSS variables `--apollo-message-*`): `zIndexPopup` (`zIndexPopupBase + 1000 + 10` =
**2010** — note this is **not** notification's `+50`) / `contentBg` (`colorBgElevated`) /
`contentPadding` (`(controlHeightLG − fontSize × lineHeight) / 2` px + `paddingSM` px).

## Design notes

### It reuses notification's shared style layer

antd's message is built entirely on rc-notification (`useRcNotification`) and reuses
notification's shared tokens and list-item styles. This repo does the same: the imperative
API and the overlay structure come from `notification/engine/` (our own Vue port of
rc-notification); message only adds "config translation + icons/semantic slots + the
imperative entry point".

### Holder and queue of the imperative path

`message.success()` has no component instance ⇒ state lives on a **module-level singleton**:
the first call creates the holder (mounted on a **detached div**, never attached to the
document) and pushes the task into a queue, which is replayed once the instance is ready.
`config()` **merges** and triggers one sync.

### Style imports

```ts
import '@apollo-design/theme/dist/tokens.css'; // theme variables, required first
import '@apollo-design/ui/message/style.css';  // on demand
// or
import '@apollo-design/ui/style.css';          // all-in-one
```

With a custom `prefixCls` (e.g. `my-app`), emit the CSS yourself via `genMessageStyle('my-app')`.

## FAQ

**Why is there no close button on the notice?**

message passes `closable: false` (same as antd) — messages dismiss themselves by timer.

**Do already visible messages follow a later `config()`?**

List-level options such as `top` / `rtl` / `prefixCls` affect subsequent renders, and
`maxCount` only affects the next `open`. Notices already displayed are not re-laid out
(same as antd).
