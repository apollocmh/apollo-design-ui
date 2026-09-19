---
order: 5
title:
  zh-CN: 主题
  en-US: theme
---

`theme` 支持 `token` / `algorithm` / `components` / `cssVarPrefix` / `inherit`，
合并语义与 antd 的 `useTheme` 一致（嵌套时 `token` 浅合并、`components` 逐组件合并；
`inherit: false` 时不继承外层）。

**它是怎么生效的**：`ConfigProvider` 调 `getDesignToken()` 算出完整 token，
再用 `createCSSVarScope()` 把 `--apollo-*` 写到作用域元素上。
静态 CSS 只引用 `var(--apollo-*)`，所以主题切换**零样式重算**。

⚠️ 两处已知限制：

1. `theme.components`（Component Token）目前只进 context，**不产出 CSS 变量**
   —— `tokens.css` 只声明 Alias 层（PITFALLS 92）。
2. 给了 `theme` 时，为了让 CSS 变量有地方挂，会多渲染一个 `display: contents`
   的作用域元素（不产生布局盒）。差异登记为 **D26**。
