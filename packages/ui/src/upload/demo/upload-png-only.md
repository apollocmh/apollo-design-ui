---
order: 206
title:
  zh-CN: 仅限 PNG
  en-US: Upload PNG Only
---

`accept="image/png"` 只影响文件选择框的过滤，真正的类型校验放在 `beforeUpload`：非 PNG 文件会提示错误并返回 `Upload.LIST_IGNORE`，不会进入列表。
