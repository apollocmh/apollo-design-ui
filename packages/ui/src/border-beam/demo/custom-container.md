---
order: 3
title:
  zh-CN: 自定义容器
  en-US: Custom container
---

流光跟随宿主的圆角与边框（`border-radius: inherit`）。原生 `class/style` 修饰宿主，`styles.effect` 只修饰装饰层。

```vue
<BorderBeam class="custom-beam-host" :style="{ padding: '8px' }" :size="40" :styles="{ effect: { opacity: 0.8 } }">
  <div style="position: relative; border: 1px solid #ddd; border-radius: 16px">Custom container</div>
</BorderBeam>
```
