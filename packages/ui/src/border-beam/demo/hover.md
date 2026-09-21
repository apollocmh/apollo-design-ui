---
order: 1
title:
  zh-CN: 鼠标悬浮时显示
  en-US: Hover
---

通过状态控制流光的显示与隐藏。

```vue
<div @mouseenter="hovered = true" @mouseleave="hovered = false">
  <BorderBeam v-if="hovered" />
</div>
```
