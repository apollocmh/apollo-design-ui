---
order: 0
title:
  zh-CN: 基本布局
  en-US: Basic
---

通过 `vertical` 控制主轴方向（演示区同时可切换方向）。

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Flex } from '@apollo-design/ui';

const value = ref<'horizontal' | 'vertical'>('horizontal');
const baseStyle = { width: '25%', height: '54px' };
</script>

<template>
  <Flex gap="medium" vertical>
    <Flex :vertical="value === 'vertical'">
      <div v-for="i in 4" :key="i" :style="{ ...baseStyle, backgroundColor: i % 2 ? '#1677ff' : '#1677ffbf' }" />
    </Flex>
  </Flex>
</template>
```
