---
order: 3
title:
  zh-CN: 加载完成前显示骨架
  en-US: Loading state
---

`loading` 是**三态**：未传与 `true` 都显示骨架，**只有 `false` 显示子内容**。

⚠️ 与 antd 的唯一差异：**显式传 `loading={undefined}`** 时上游渲染 children、
我们渲染骨架 —— 因为 React 的判据是 `'loading' in props`（看「键是否存在」），
而 Vue 的 prop 没有这个概念。属平台固有差异，详见 README §7。

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Skeleton } from '@apollo-design/ui';

const loading = ref(true);
</script>

<template>
  <Skeleton :loading="loading">
    <div>真实内容</div>
  </Skeleton>
</template>
```
