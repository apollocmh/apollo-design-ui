<script setup lang="ts">
// 使用本库操作按钮观察徽标数值更新。

import { Badge, Button, Space } from '@apollo-design/ui';
import { ref } from 'vue';

const count = ref(5);
</script>

<template>
  <Space wrap :size="16">
    <Badge :count="count">
      <div style="width: 40px; height: 40px; background: var(--apollo-color-fill-alter); border-radius: 4px; display: inline-flex; align-items: center; justify-content: center" />
    </Badge>
    <Button :disabled="count === 0" aria-label="减少计数 / Decrease count" @click="count = Math.max(count - 1, 0)">-</Button>
    <Button aria-label="增加计数 / Increase count" @click="count = count + 1">+</Button>
    <Button @click="count = -12">负数 / Negative</Button>
    <Button @click="count = 5">重置 / Reset</Button>
  </Space>
</template>
