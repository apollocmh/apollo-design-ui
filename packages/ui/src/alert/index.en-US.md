---
category: Feedback
title: Alert
subtitle: 警告提示
---

Show information that needs attention, with complete Vue content slots and an owned native close button. All15 working examples are in [`demo/`](./demo).

## Props

| Prop | Description | Type | Default |
| --- | --- | --- | --- |
| type | Alert type | `'success' \| 'info' \| 'warning' \| 'error'` | warning for banner, otherwise info |
| variant | Local value overrides current components.alert configuration | `'outlined' \| 'filled'` | outlined |
| title | Text title; use #title for rich content | `string` | — |
| message | Deprecated title alias, used when title is absent | `string` | — |
| description | Text description; use #description for rich content | `string` | — |
| showIcon | Explicit false suppresses the banner default icon | `boolean` | true for banner, otherwise false |
| banner | Banner appearance | `boolean` | false |
| closable | Boolean or close configuration; an object enables closing | `boolean \| AlertClosable` | current Provider, otherwise false |
| closeIcon | Legacy scalar icon; prefer #closeIcon or closable.closeIcon | `string \| number \| boolean \| null` | — |
| closeText | Deprecated close text; prefer #closeIcon | `string` | — |
| afterClose | Legacy completion callback; prefer @after-close | `() => void` | — |
| prefixCls | DOM prefix; preload matching static CSS for a custom prefix | `string` | apollo-alert |
| id / role | Actual root div attributes | `string` | role=alert |
| classNames / styles | root/icon/section/title/description/actions/close; object or function receiving current merged props | `AlertSemanticValue<…>` | — |

Native class/style, tabindex, ARIA/data, listeners and once modifiers belong to the actual root div. title remains the documented content prop. Native root listeners receive DOM events; onClick/onMouseenter/onMouseleave are their programmatic forms.

## Slots

| Slot | Description |
| --- | --- |
| #title | Complete title content; present empty content suppresses title/message fallback. |
| #description | Complete description; empty content removes description layout. |
| #icon | Complete type icon; empty slots suppress default artwork. showIcon=false takes precedence. |
| #action | Complete action content, including multiple native controls. |
| #closeIcon | Text/artwork inside the native close button; present empty slots suppress every icon fallback. |

All five slots are read in the current render and accept fragments and0. Conditional removal restores fallback. There is no implicit default-to-title API. Close content priority is slot, local configuration icon, closeText, legacy closeIcon, Provider configuration icon, Provider closeIcon, default artwork. Explicit0/false/null/empty strings are content values, not absent fields.

## Events and close state

| Event | Payload and timing |
| --- | --- |
| close | Native MouseEvent from click or Enter/Space activation; each instance accepts one close request. |
| after-close | Once after the owned alert completes removal, including disabled/reduced motion. |

onClose/onAfterClose are programmatic Vue listeners. Configuration onClose/afterClose hooks remain business notifications and cannot suppress Vue events; the same function is not called twice. A configured afterClose takes priority over the legacy plain callback. The button has the default accessible name Close; closable aria-label/aria-labelledby and data attributes belong to that button.

Closing is internal one-time state. There is no open/visible model or cancellation hook. Use parent v-if/key to remount; changing closable does not reopen a closed instance. Immediate parent removal during close does not report an internal animation completion. The existing truthy closeText shortcut remains ahead of the legacy boolean visibility branch.

## Ref

`AlertRef.nativeElement: HTMLDivElement | null` refers to the actual root and becomes null after removal/unmount.

## ErrorBoundary

Typed Alert.ErrorBoundary and named AlertErrorBoundary refer to the same component. Healthy default content remains a complete fragment without a wrapper. There is no reset method/model/expose; use parent key remounting for recovery.

| Prop | Description | Type |
| --- | --- | --- |
| title / message | Error title data; defaults to String(error), message is a legacy alias | `VNodeChild` |
| description | Error description; defaults to Vue error-phase information in pre | `VNodeChild` |
| id | Error fallback Alert id | `string` |

Vue onErrorCaptured handles actual descendant setup/render/lifecycle and owned event errors, including0/false/null/undefined, and stops propagation. The boundary itself and errors outside Vue's call chain are outside its scope. Native attrs/styles belong to the error fallback Alert; healthy fragment children do not receive arbitrary forwarded attrs.

The default Error details region is focusable and supports native horizontal keyboard scrolling on narrow screens. Custom description content owns its own interaction and semantics.

## Theme

| Token | Purpose | Default source |
| --- | --- | --- |
| borderRadius | Corner radius | borderRadiusLG |
| withDescriptionIconSize | Description icon size | fontSizeHeading3 |
| defaultPadding | Normal padding | paddingContentVerticalSM / fixed12px inline |
| withDescriptionPadding | Description padding | paddingMD / paddingContentHorizontalLG |

The nearest current theme.components.Alert and aliases are consumed on updates/removal. Explicit root CSS variables take precedence. Default/dark/compact/combined source scopes remain local; closing respects theme.token.motion and prefers-reduced-motion.

An explicitly empty ThemeProvider restores the default aliases and four component tokens, including through an unconfigured ConfigProvider. A ConfigProvider without any theme source leaves page CSS dark/compact scopes authoritative. Semantic functions receive the resolved type, variant, prefixCls, role, icon visibility and close state; role defaults to alert and accepts an explicit value.

Null or undefined Provider type icons retain the default fallback. Default icons are decorative; custom content owns its semantics.

Migration and validation boundaries: `docs/migrations/alert-contracts.md`, `docs/audit/2026-10-29-alert-contract-audit.md`.
