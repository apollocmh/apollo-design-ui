---
order: 4
title:
  zh-CN: 延迟显示
  en-US: Delay
---

`delay` 指定**延迟多少毫秒才进入加载态**，用来避免「请求秒回时闪一下加载图标」。

⚠️ 两条容易误解的语义：

- **开要等，关不等**：`spinning` 变 `true` 时走 `delay`，变 `false` 时**立即**生效
  （`should close immediately`）；
- `delay` 是**重新计时**而不是「至少显示这么久」：每次 `spinning` / `delay`
  变化都会取消上一次的定时器。

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Spin } from '@apollo-design/ui';

const loading = ref(false);
</script>

<template>
  <Spin :spinning="loading" :delay="500">
    <div>Alert message title</div>
  </Spin>
  <p>
    加载状态：<input v-model="loading" type="checkbox" />
  </p>
</template>
```
