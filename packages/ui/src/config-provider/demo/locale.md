---
order: 2
title:
  zh-CN: 语言包
  en-US: locale
---

`locale` 会传导到整棵子树，下游组件用 `useLocale('<ComponentName>')` 读取。

语言包来自 `@apollo-design/locale`（73 个，从 antd 6.6.4 的 `es/locale/*` 生成）。
`ComponentName` 与 antd 一致：`Empty` / `Table` / `Form` / `Pagination` …

⚠️ 已知限制：`useLocale` 目前**不是响应式**的（`locale` 包的设计未决项 D24），
切换 `locale` 后需要让子树重新挂载才能拿到新文案。
`ConfigProvider` 这一侧的接线是响应式的（context 里的值会立刻变）。
