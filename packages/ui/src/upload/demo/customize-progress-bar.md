---
order: 207
title:
  zh-CN: 自定义进度条
  en-US: Customize Progress Bar
---

`progress` 支持渐变 `strokeColor`、数字或 CSS 长度 `strokeWidth`、`showInfo` 与 ARIA 名称。
本例显示 4px 渐变进度和当前百分比。初始文件从 30% 推进到 100%，新选择的文件通过
mock `customRequest` 反馈进度；成功事件后收起进度条。
