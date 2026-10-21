---
order: 204
title:
  zh-CN: 动态表单项
  en-US: Dynamic form item
---

`useWatch('accountType', form)` 监听账号类型，配合 `v-if` 动态渲染「公司名称」字段。`Form.Item` 的 `rules` 只在该字段实际存在时参与校验；切换类型后，已隐藏字段的值不会阻止表单提交。
