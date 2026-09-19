---
order: 1
title:
  zh-CN: 前缀
  en-US: prefixCls
---

`prefixCls` 会传给整棵子树，且**内层没给时继承外层**（与 antd 的 `nest prefixCls` 行为一致）。

默认值是 `apollo`（裁决 `prefix-cls-default` = A）。静态 CSS 同时为 `apollo` 与 `ant`
两份前缀生成了产物，所以设成 `ant` 可以复用既有样式。

⚠️ 自定义前缀（如 `my-app`）需要自行产出 CSS：
`genComponentCss('empty', 'my-app')` —— 零运行时的固有代价。
