---
order: 5
title:
  zh-CN: 上传前置钩子
  en-US: Before Upload
---

对比 `beforeUpload` 的两种拒绝语义：返回 `false` 时文件仍进入列表但不发送请求；返回 `Upload.LIST_IGNORE` 时文件被完全忽略。两者都不会产生网络请求。
