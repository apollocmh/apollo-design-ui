---
order: 3
title:
  zh-CN: 加载完成前显示骨架
  en-US: Loading state
---

`loading` 是**三态**：未传与 `true` 都显示骨架，**只有 `false` 显示子内容**。

由调用者维护loading状态；业务正文切换时会卸载，需持久的输入数据放在父级响应状态中。
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
