---
order: 226
title:
  zh-CN: 自定义后缀图标
  en-US: Custom suffix icon
---

通过 `suffix-icon` 传入 `VNodeChild` 可以替换默认日历图标；传入 `null` 则完全不渲染后缀图标。示例用 `h(CalendarOutlined)` 与 `h(SmileOutlined)` 构造图标节点，并保留第三种「无图标」形态。
