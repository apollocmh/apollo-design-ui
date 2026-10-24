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


Dynamic `prefixCls` and layout changes update derived classes, feedback icons in real controls, error/help content and the measured margin placeholder. Standalone `Form.ErrorList` reads ConfigProvider’s prefix; inside Form.Item / Form.List it follows the nearest prefix context. Preload static CSS for every custom prefix; changing the prefix does not generate runtime styles.
