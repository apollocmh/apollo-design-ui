---
order: 203
title:
  zh-CN: 表单方法调用
  en-US: Form methods
---

通过 `useForm()` 取得表单实例后，可以调用 `setFieldsValue`、`getFieldsValue`、`validateFields`、`validateFields({ validateOnly: true })` 与 `resetFields`。`validateFields` 校验失败时会 reject，示例捕获 `errorFields` 并把结果显示在页面上；`validateOnly` 只执行校验，不返回字段值。

`render-props` 使默认作用域插槽的 `{ values, form }` 随 store 更新；示例直接显示当前 `values`，使用外部 `useForm()` 实例时也会更新。
