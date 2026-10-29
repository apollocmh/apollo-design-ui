---
order: 106
title:
  zh-CN: 搜索加载中
  en-US: Search Loading
---

`InputSearch` 的 `loading` 会让搜索按钮进入加载态，并拦截回车触发的重复搜索。

通过 `@search` 开始一次异步搜索；结束后保留输入值，卸载时清理待完成请求。
