---
order: 206
title:
  zh-CN: 动态校验规则
  en-US: Dynamic rules
---

`rules` 可以是 `computed` 计算出的数组。示例用 `Switch` 切换「普通 / 严格」模式：严格模式追加最小长度与「字母 + 数字」正则规则，`Form.Item` 会在下一次校验时立即使用新规则。`Switch` 带 `aria-label`，保证可访问名称。
