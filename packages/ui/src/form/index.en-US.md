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


Dynamic `prefixCls` and layout changes update derived classes, feedback icons in real controls, error/help content and the measured margin placeholder. Standalone `Form.ErrorList` reads ConfigProvider’s prefix; inside Form.Item / Form.List it follows the nearest prefix context. Preload static CSS for every custom prefix; changing the prefix does not generate runtime styles.
