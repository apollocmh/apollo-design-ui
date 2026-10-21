---
order: 205
title:
  zh-CN: 动态增减表单项
  en-US: Dynamic form items
---

`Form.List` 的默认插槽接收 `{ fields, operations, meta }`：`fields` 用于 `v-for` 渲染行，`operations.add` / `operations.remove` / `operations.move` 负责增删与排序，`meta.errors` 汇总列表级校验错误。行内 `Form.Item` 使用 `[field.name, 'name']` 这样的数组 `name` 与列表项绑定。
