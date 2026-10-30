---
order: 6
title:
  zh-CN: 组件 Token
  en-US: Component Token
---

通过 `ConfigProvider.theme.components.Switch` 覆盖组件 Token；当前配置会写入开关根元素的 CSS 变量，由静态样式消费。支持主题切换、嵌套覆盖和撤销。

覆盖 `trackHeight` / `trackMinWidth` / `trackPadding` / `handleSize` / `handleBg` /
`handleShadow` 后的效果（把手比轨道大，探出轨道外）。
