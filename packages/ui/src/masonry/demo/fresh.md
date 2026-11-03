---
order: 3
title:
  zh-CN: 内容变化
  en-US: Fresh
---

条目内容高度会变时用 `fresh` —— 它给**每个条目**各挂一个 `ResizeObserver`，
点一下就重新量测并重排。

⚠️ `fresh` **不改变 DOM 结构**（观察器不产节点，上游的 `ResizeObserver` 是 `cloneElement`）。
与 antd 的 demo 的差异：高度用确定值而不是 `Math.random()`。
