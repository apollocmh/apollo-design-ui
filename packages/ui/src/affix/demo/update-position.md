---
order: 5
title:
  zh-CN: 手动更新位置
  en-US: Update position
---

`ref` 只暴露 `updatePosition`（与 antd 的 `useImperativeHandle` 一致）：
内容尺寸或布局在程序里变化后，手动触发一次重新测量。

尺寸变化通常由内部的 `ResizeObserver` 自动捕捉，无需手动调用。

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Affix, Button } from '@apollo-design/ui';

const affixRef = ref<{ updatePosition: () => void } | null>(null);
</script>

<template>
  <Affix ref="affixRef" :offset-top="60">
    <Button @click="affixRef?.updatePosition()">手动重新测量</Button>
  </Affix>
</template>
```
