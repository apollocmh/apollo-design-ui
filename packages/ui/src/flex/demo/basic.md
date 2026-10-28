---
order: 0
title:
  zh-CN: 基本布局
  en-US: Basic
---

使用具名原生单选组切换横向与纵向布局，子元素直接参与 Flex。

```vue
<script setup lang="ts">
import { Flex } from '@apollo-design/ui';
import { ref, useId } from 'vue';

const value = ref<'horizontal' | 'vertical'>('horizontal');
const directionName = useId();
const baseStyle = { width: '25%', height: '54px' };
</script>

<template>
  <Flex gap="middle" vertical>
    <fieldset style="margin: 0; padding: 0; border: 0; min-width: 0">
      <legend>Direction</legend>
      <label v-for="direction in ['horizontal', 'vertical']" :key="direction" style="margin-inline-end: 12px">
        <input v-model="value" type="radio" :name="directionName" :value="direction" /> {{ direction }}
      </label>
    </fieldset>
    <Flex :vertical="value === 'vertical'">
      <div v-for="i in 4" :key="i" :style="{ ...baseStyle, background: i % 2 ? 'var(--apollo-color-primary)' : 'var(--apollo-color-primary-bg-hover)' }" />
    </Flex>
  </Flex>
</template>
```
