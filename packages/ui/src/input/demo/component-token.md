---
order: 201
title:
  zh-CN: 组件 Token
  en-US: Component Token
---

Input 的 19 个既有组件 Token 可通过 `theme.components.Input` 配置。默认字号与非负 padding 随当前主题派生；不设置固定输入高度。示例切换紧凑主题、垂直内边距和前缀间距，同时用容器选择器覆盖 `--apollo-input-*` 变量，并可切换祖先 class 来改变字号和 padding。Search 按钮随输入伸展，autoSize 文本域在主题、祖先样式和宽度变化后重新量测。显式样式和 CSS 变量继续优先于默认派生。
