---
order: 208
title:
  zh-CN: 弹窗表单
  en-US: Form in modal
---

把 `Form` 放进 `Modal`，在 `@ok` 中调用 `form.validateFields()`：校验通过后关闭弹窗并展示提交结果，校验失败则保持弹窗打开，由 `Form.Item` 显示错误。`Modal` 的 `closable` 传入带 `aria-label` 的对象，保证关闭按钮有可访问名称。
