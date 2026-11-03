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
import { Button, Skeleton } from '@apollo-design/ui';
import { ref } from 'vue';

const loading = ref(true);
</script>

<template>
  <div>
    <Button style="margin-bottom: 16px" @click="loading = !loading">切换（当前 {{ loading ? '骨架' : '内容' }}）</Button>
    <Skeleton :loading="loading">
      <div>这是真实内容。</div>
    </Skeleton>
  </div>
</template>
```
