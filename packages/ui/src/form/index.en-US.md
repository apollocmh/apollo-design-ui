---
title: Form
subtitle: Form
titleTemplate: '%s - @apollo-design/ui'
description: Data collection and validation with inputs, selects, nested and list fields.
---

# Form

See `index.zh-CN.md` for full API tables. Key notes:

- first UI consumer of `@apollo-design/form-core` (store/Field/List live in the foundation package);
- value channel: control receives `value` (valuePropName) + `onChange` synthesized to Vue `onUpdate:value` (v-model bridge);
- `getFieldId` = namePath.join('_') with form `name` prefix; `parentNode` is blacklisted;
- explicit rule `message` wins over `validateMessages` templates;
- error list debounce: 0ms when has content / 10ms when cleared (antd verbatim);
- `aria-describedby` / `aria-invalid` / `aria-required` are injected on the control (antd verbatim).

The Form default slot receives `{ values, form }`; enable `render-props` when the whole slot reads current store values. Fields keep their metadata and reset subscriptions in both modes, including forms created with `useForm()` outside the container.

Form.Item receives `{ control, meta, form }` in both bound and layout modes. A standalone layout item has an empty control/metadata and `form: undefined`. Its `reset()` and `metaChange(meta)` notifications are Vue emits. Form.List keeps its existing `{ fields, operations, meta }` scope, including stable `fieldKey` values.

In development version `0.0.0`, replace positional Form / Form.Item slot arguments with the named object directly; there is no compatibility layer or deprecation period. Validators, value extraction, normalization and asynchronous business callbacks retain their function contracts. `useWatch(pathOrSelector, form)` or `useWatch(pathOrSelector, { form, preserve })` returns a Ref and releases its subscription with the calling effect scope.

`nativeElement` returns the actual HTML container or null for a containerless/fragment host.

Use `#requiredMark="{ label, required }"` for custom mark content and render the stable original-label component with `<component :is="label" />`. The primitive `requiredMark` prop accepts `boolean | 'optional'`. Custom feedback uses `#feedbackIcon="{ status, errors, warnings }"` on Form or Form.Item, with Item priority and live slot withdrawal. In development, replace the former requiredMark content callback, feedbackIcons and hasFeedback.icons directly with these slots; hasFeedback is boolean.

Form.Item implements `label`, `help`, `extra`, `tooltip` and `feedbackIcon` slots. Explicit empty slots override their corresponding props. Tooltip help is a keyboard-focusable native button beside the associated label. Form and styled Form.Item forward native attrs/class/style to their actual root. Form.List and noStyle items have no DOM root. Nested items stop inheriting outer label/wrapper column widths.

`useFormInstance()` reads the nearest existing Form instance and returns undefined outside Form. Repeated useForm calls and a Form receiving the same external store share one actual instance and control registry. `getFieldInstance(name)` returns the actual DOM/component public ref as `object | undefined`; custom expose objects need not have a focus method. `focusField(name)` uses the control’s real focus capability; `scrollToField(name, { focus: true })` scrolls its actual element and focuses when supported. `scrollToFirstError=false` disables automatic scrolling.

All eleven Form component Tokens, including inlineItemMarginBottom, read current `ConfigProvider theme.components.Form`, including replacement and removal. Standalone Form.Item uses the same theme. Native style CSS variables keep local precedence; custom prefixes require matching preloaded static CSS. Semantic classNames/styles merge Provider defaults with local values and receive resolved current Form props. Form disabled=false overrides an outer disabled Provider.

Form.ErrorList forwards native attrs to its actual help root and owns `visibleChanged(visible: boolean)`. Duplicate messages retain separate rows. Leaving rows keep their last content until motion completes, then the measured placeholder is released.

Dynamic `prefixCls` and layout changes update derived classes, feedback icons in real controls, error/help content and the measured margin placeholder. Standalone `Form.ErrorList` reads ConfigProvider’s prefix; inside Form.Item / Form.List it follows the nearest prefix context. Preload static CSS for every custom prefix; changing the prefix does not generate runtime styles.
