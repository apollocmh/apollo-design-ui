---
order: 209
title:
  zh-CN: 嵌套路径
  en-US: Form item path
---

`Form.Item` 的 `name` 支持数组路径，例如 `['user', 'name']` 与 `['user', 'email']`，它们会映射到 `{ user: { name, email } }`。`useWatch(['user', 'name'], form)` 订阅嵌套值，`setFieldsValue({ user: { ... } })` 可以一次写入整棵子树。
