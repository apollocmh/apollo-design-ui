---
order: 224
title:
  zh-CN: 起止日期联动
  en-US: Start and end
---

两个独立的 `DatePicker` 通过 `disabled-date` 互相限制：开始日期不能晚于已选结束日期，结束日期不能早于已选开始日期。`@change` 回写 `value`，页面下方实时显示当前范围。
