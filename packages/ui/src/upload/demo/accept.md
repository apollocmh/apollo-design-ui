---
order: 4
title:
  zh-CN: 类型与大小校验
  en-US: Accept & Validation
---

`accept` 限定文件选择器；`beforeUpload` 里做真实校验：非图片或超过 1MB 时用 `message.error` 提示并返回 `Upload.LIST_IGNORE`，文件不会进入列表。
