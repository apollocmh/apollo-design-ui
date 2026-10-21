---
order: 212
title:
  zh-CN: 登录表单
  en-US: Login form
---

一个完整的登录场景：`Form.Item` 的 `rules` 校验用户名与密码，`Checkbox` 通过 `value-prop-name="checked"` 与布尔字段绑定，提交后由 `@finish` 展示欢迎信息。`Input` 使用 `autocomplete` 与 `aria-label` 兼顾浏览器自动填充与可访问性。
