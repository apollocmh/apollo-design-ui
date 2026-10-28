---
order: 11
title:
  zh-CN: 自定义语义结构的样式和类
  en-US: Semantic style & class
---

通过 `classNames` / `styles` 定制语义结构（root / indicator）。按钮切换九个已有 Token、适用零值与默认恢复；方向改变时输入草稿保留。Vue 原生 class/style 控制根，指示器样式使用 styles.indicator。

```vue
<Badge :count="5" :styles="{ indicator: { backgroundColor: '#52c41a' } }"><div class="box" /></Badge>
```
