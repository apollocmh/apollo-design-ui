---
title: 虚拟滚动
order: 11
---

`virtual` 开启虚拟滚动（大表格场景）：表体交给 `@apollo-design/virtual-list`，只渲染视口内的行。
`scroll.y` 给视口高度、`scroll.x` 给内容宽度 —— **virtual 下二者必须是数值**（否则按 1 / 500 兜底并告警）。
