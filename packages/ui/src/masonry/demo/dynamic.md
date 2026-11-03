---
order: 2
title:
  zh-CN: 动态
  en-US: Dynamic
---

增删条目；`onLayoutChange` 把算出来的列号写回 `items`，写回后条目就「钉」在该列。

⚠️ 与 antd 的 demo 有两处**有意**差异：① 新增条目的高度用确定值
（上游用 `Math.random()`，每次渲染都不同 ⇒ demo 冒烟测试不可复现）；
② `Card` / `CloseOutlined` 用原生 div / 文本 `×` 替换（本仓 Card 尚未落地）。
