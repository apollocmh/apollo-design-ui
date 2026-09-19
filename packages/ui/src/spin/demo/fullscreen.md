---
order: 8
title:
  zh-CN: 全屏
  en-US: Fullscreen
---

`fullscreen` 会加一层半透明遮罩并把转圈居中，非常适合做整页加载器。

⚠️ 两条容易忽略的语义：

- `fullscreen` 会让 `isNested` 恒为真 —— 即使**没有** children，`-section` 也会
  下移到内层 div（根元素只留下遮罩）；
- 因此 `styles.section` 落在内层 div 上，**不**进根元素；而 `styles.mask`
  只在 `fullscreen` 时并入根元素。

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Spin } from '@apollo-design/ui';

const spinning = ref(false);
const percent = ref(0);
</script>

<template>
  <button type="button" @click="spinning = true">Show fullscreen</button>
  <Spin :spinning="spinning" :percent="percent" fullscreen />
</template>
```
