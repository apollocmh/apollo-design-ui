---
category: Other
title: App
subtitle: App
---

Provide independent Message, Notification and Modal services to descendants, with shared root styles for the page.

## Demos

See [`demo/`](./demo) for service usage and replacement of current message/notification defaults.

## API

| Prop | Description | Type | Default |
|---|---|---|---|
| prefixCls | Current host class prefix | `string` | `apollo-app` |
| component | Native host; `false` renders content and service holders without a host | `'div' \| 'section' \| 'main' \| 'span' \| false` | `'div'` |
| message | Message hook configuration, merged across nested Apps | `MessageConfigOptions` | — |
| notification | Notification hook configuration, merged across nested Apps | `NotificationConfig` | — |

The default slot accepts complete Vue content, including `0`, arrays, conditional and empty content. App has no owned events, v-model or imperative component ref methods. Native `class`, `style`, attributes and event listeners target the actual host. Provider `components.app.className/style` is merged first; local native styles take precedence.

With `component=false`, attributes have no host and produce a development diagnostic. They are not transferred to children or overlays. Host changes follow Vue's native subtree replacement rules; the three service holders remain stable siblings of the host.

### useApp

Call the named `useApp()` or `App.useApp()` in a **descendant component's setup**:

```ts
const { message, notification, modal } = App.useApp();
const close = message.loading('Working', 0);
close.then((terminated) => console.log(terminated));
const confirm = modal.confirm({ title: 'Continue?' });
confirm.then((accepted) => console.log(accepted));
```

The exact `UseAppProps` result contains `message: MessageInstance`, `notification: NotificationInstance` and `modal: ModalHookAPI`. Methods retain their hook's real return values and service callbacks. Commands issued during descendant setup enter the corresponding holder queues. Every App owns independent instances; nested consumers receive the closest provider. Unmounting App terminates its work and releases overlays and resources.

Without an App provider or Vue injection context, `useApp()` throws `[Apollo App] useApp() requires an App provider.` instead of returning empty fake APIs. Use a descendant's setup; the parent creating App cannot inject a child provider that does not yet exist.

### Configuration, theme and migration

Message and notification configurations are shallowly merged by field from parent App to local object. Local fields win. Replacing an object removes its former exclusive fields; removing a local prop restores the current parent configuration. The injected object retains its identity while descendants and holders read current values. Existing notices follow their respective service's update contract.

App has no component tokens. Its CSS consumes the global `colorText`, `fontSize`, `lineHeight` and `fontFamily` variables. Current Provider direction, prefix and root style replacement/removal update the host.

Replace the old documented `className/rootClassName` with native `class`; native `style` accepts StyleValue. AppConfig and useApp now expose actual configuration and service types. Type exports: `AppProps`, `AppComponentType`, `AppConfig`, `AppSlots`, `UseAppProps`.
