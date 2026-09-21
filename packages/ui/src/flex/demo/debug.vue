<script setup lang="ts">
// 对齐 antd 的 debug demo（:empty 兜底与空隙展示）
import { Flex } from '@apollo-design/ui';
</script>

<template>
  <Flex vertical>
    <div v-for="i in 4" :key="i" :style="{ height: '60px', backgroundColor: i % 2 ? '#1677ff' : '#1677ffbf' }" />
  </Flex>
  <Flex style="margin-top: 20px">
    <div
      v-for="i in 4"
      :key="i"
      :style="{ width: '25%', height: i % 2 ? '60px' : '40px', backgroundColor: i % 2 ? '#1677ff' : '#1677ffbf' }"
    />
  </Flex>
</template>
