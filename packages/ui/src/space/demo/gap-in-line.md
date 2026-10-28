---
order: 12
title:
  zh-CN: 换行时的行距
  en-US: Gap In Line
---

用临界容器宽度切换换行，核对水平 gap 与行距。

Toggle a threshold container width to inspect column and row gaps.

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Space } from '@apollo-design/ui';
const singleCol = ref(false);
</script>
<template>
  <label><input v-model="singleCol" type="checkbox" /> Single column</label>
  <div style="max-width: 100%; overflow: auto; margin-top: 12px"><Space :style="{ width: singleCol ? '307px' : '310px' }" :size="[8, 8]" wrap><div v-for="i in 4" :key="i" class="gap-box">{{ i }}</div></Space></div>
</template>
<style scoped>.gap-box { width: 150px; height: 100px; display: grid; place-items: center; color: var(--apollo-color-text); background: var(--apollo-color-fill-secondary); }</style>
```
