---
order: 216
title:
  zh-CN: 时间类控件
  en-US: Time-related controls
---

`DatePicker`、`TimePicker` 与 `DatePicker.RangePicker` 都可以直接作为 `Form.Item` 的控件，表单会注入 `value` 与更新事件。示例用 `useWatch` 实时回显日期、时间与区间值，提交时由 `@finish` 输出完整表单数据。
