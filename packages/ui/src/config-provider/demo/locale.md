---
order: 2
title:
  zh-CN: 语言包
  en-US: locale
---

`locale` 的替换、深更新和撤回保留业务节点。示例在 Empty 与 Pagination 上显示当前语言，同时保留输入草稿。

`useLocale(name)` 返回两个 ComputedRef，脚本用 `.value`。没有 Provider 时语言码为 undefined；分片浅合并，缺失字段回退 en_US。global.clear 在 en_US / zh_CN 有 Apollo 文案，其它语言沿用默认回退。
