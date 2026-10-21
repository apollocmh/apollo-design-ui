---
order: 13
title:
  zh-CN: 字段联动
  en-US: Dependencies
---

确认密码的 `FormItem` 声明 `dependencies: ['password']`：密码变化时会重新校验确认框；`validator` 从表单实例读取当前密码并返回 Promise。
