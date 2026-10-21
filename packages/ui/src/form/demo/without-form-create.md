---
order: 219
title:
  zh-CN: 无表单实例
  en-US: Without form instance
---

不调用 `useForm()` 时，`Form` 会自动创建一个内部 store，`Form.Item` 的注入与 `@finish` 仍然正常工作。示例通过改变 `key` 重新挂载表单来实现重置，并展示 `@finish` 收集到的字段值。
