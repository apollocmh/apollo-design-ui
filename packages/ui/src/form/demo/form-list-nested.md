---
order: 11
title:
  zh-CN: 嵌套动态表单
  en-US: Nested Dynamic Form
---

`Form.List` 可以嵌套：内层 `name` 用 `[field.name, 'tags']` 定位到父行，字段名路径会按层级展开。示例支持每个用户维护一组标签。
