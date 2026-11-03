---
order: 4
title:
  zh-CN: 滚动容器
  en-US: Container
preview:
  mode: viewport
  viewportHeight: 320
  scrollable: true
---

`target` 是一个**返回元素或 `window` 的函数**（不是元素本身）。
换绑 `target` 时，旧 target 上的监听也会被解绑。

⚠️ 固定在容器底部时，偏移量是「容器可视区底边到**视口**底边的距离」参与计算
（`getFixedBottom` 用 `window.innerHeight`，不是容器高度）。
