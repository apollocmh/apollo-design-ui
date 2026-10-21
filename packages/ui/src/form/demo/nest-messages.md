---
order: 213
title:
  zh-CN: 嵌套校验消息
  en-US: Nested messages
---

`Form` 的 `validate-messages` 支持按规则类型嵌套覆盖默认文案：`required`、`types.email`、`string.min`、`number.min` 分别对应不同校验失败场景。模板变量如 `${name}`、`${min}` 会在运行时替换为字段名和规则参数。
