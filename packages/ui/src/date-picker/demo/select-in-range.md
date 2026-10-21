---
order: 223
title:
  zh-CN: 区间内选择
  en-US: Select in range
---

`@calendar-change` 会在范围选择的中间过程触发，携带 `info.range` 标识当前选的是起点还是终点；`disabled-date` 的第二个参数 `info.from` 是已选的起点。示例把结束日期限制在起点前后 7 天内，并实时显示选择进度。
