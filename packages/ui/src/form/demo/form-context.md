---
order: 207
title:
  zh-CN: 表单上下文
  en-US: Form context
---

在 `Form` 的后代组件中调用 `useWatch('username')` 时无需显式传入 `form` 实例：`useWatch` 会通过 `Form` 提供的上下文字段自动订阅。示例中的 `WatchDisplay` 是一个独立子组件，用来证明「不传 form 也能读到最新值」。
