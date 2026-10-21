---
order: 205
title:
  zh-CN: 上传前转换文件
  en-US: Transform File
---

本仓不提供已废弃的 `transformFile` 属性；等价能力由 `beforeUpload` 返回新的 `File` 完成。示例把文件名中的空格替换为连字符并转成小写，再交给 mock 上传。
