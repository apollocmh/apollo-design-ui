<script setup lang="ts">
// 对齐 antd 的 change demo（Button/Icon 用原生 button 等价替换）

import { Badge, Button } from '@apollo-design/ui';
import { ref } from 'vue';

const count = ref(5);
</script>

<template>
  <div>
    <Badge :count="count">
      <div style="width: 40px; height: 40px; background: var(--apollo-color-fill-alter); border-radius: 4px; display: inline-flex; align-items: center; justify-content: center" />
    </Badge>
    <Button :disabled="count === 0" aria-label="减少计数 / Decrease count" @click="count = Math.max(count - 1, 0)">-</Button>
    <Button aria-label="增加计数 / Increase count" @click="count = count + 1">+</Button>
    <Button @click="count = -12">负数 / Negative</Button>
    <Button @click="count = 5">重置 / Reset</Button>
  </div>
</template>
