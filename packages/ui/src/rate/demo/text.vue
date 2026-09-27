<script setup lang="ts">
// 对齐 antd demo/text.tsx（tooltips 数据 prop；TooltipProps 对象形态逐字支持）

import type { TooltipProps } from '@apollo-design/ui';
import { Flex, Rate } from '@apollo-design/ui';
import { ref } from 'vue';

const desc: (TooltipProps | string)[] = [
  'terrible',
  { placement: 'top', title: 'bad', trigger: 'hover' },
  'normal',
  'good',
  'wonderful',
];
const value = ref(3);

const getDescTitle = (v: number) => {
  const item = desc[v - 1];
  return item && typeof item === 'object' ? item.title : item;
};
</script>

<template>
  <Flex vertical gap="medium">
    <Rate v-model:value="value" :tooltips="desc" @change="(v: number) => (value = v)" />
    <span v-if="value">{{ getDescTitle(value) }}</span>
  </Flex>
</template>
