---
order: 3
title:
  zh-CN: 自定义描述
  en-US: Description
---

保留字符串描述、关闭描述和完整节点三个场景。#description 可以包含多个业务节点；复选框切换槽内内容，故意为空时不回退到描述 prop，也不产生带间距的空宿主。

只有 description 为 undefined 才使用当前语言。false、null、空串和空数组隐藏描述，数字 0 保留。
