<script setup lang="ts">
// 对齐 antd 的 basic demo（Radio.Group 用原生 radio 等价替换，缺口见 README §7）

import { Flex } from '@apollo-design/ui';
import { ref } from 'vue';

const value = ref<'horizontal' | 'vertical'>('horizontal');
const baseStyle = { width: '25%', height: '54px' };
</script>

<template>
  <Flex gap="medium" vertical>
    <label style="display: flex; gap: 12px">
      <input v-model="value" type="radio" value="horizontal" /> horizontal
      <input v-model="value" type="radio" value="vertical" /> vertical
    </label>
    <Flex :vertical="value === 'vertical'">
      <div v-for="i in 4" :key="i" :style="{ ...baseStyle, backgroundColor: i % 2 ? '#1677ff' : '#1677ffbf' }" />
    </Flex>
  </Flex>
</template>
