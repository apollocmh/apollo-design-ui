---
order: 3
title:
  zh-CN: 固钉状态改变回调
  en-US: Change callback
preview:
  mode: viewport
  viewportHeight: 320
  scrollable: true
---

`@change` 只在状态**翻转**时触发（连续固钉不会重复发）。
Vue 侧是 `emit('change', affixed)`，模板上写 `@change` —— antd 的 `onChange` prop 不移植成 prop（规则 C19）。
