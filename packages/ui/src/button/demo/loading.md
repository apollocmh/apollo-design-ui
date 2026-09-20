---
order: 2
title:
  zh-CN: 加载中
  en-US: Loading
---

`loading` 有两种形态：

- 布尔：`true` 立刻进入加载态。
- 对象：`{ delay, icon }`。`delay > 0` 时**延迟到点才置为加载态**，用于防止连点；
  变回 `false` **只能靠 `loading` prop 自己变回**，不会自动复位。

加载中时点击被拦截（`preventDefault` 且不 emit `click`）。

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Button } from '@apollo-design/ui';

const loading = ref(false);

function enter() {
  loading.value = true;
  setTimeout(() => {
    loading.value = false;
  }, 3000);
}
</script>

<template>
  <Button type="primary" loading>Loading</Button>
  <Button type="primary" :loading="{ delay: 1000 }" @click="enter()">Delay 1s</Button>
  <Button type="primary" :loading="loading" @click="enter()">Click me</Button>
</template>
```
