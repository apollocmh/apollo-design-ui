<script setup lang="ts">
import { Flex } from '@apollo-design/ui';
</script>

<template>
  <Flex vertical>
    <div v-for="i in 4" :key="i" :style="{ height: '60px', backgroundColor: i % 2 ? 'var(--apollo-color-primary)' : 'var(--apollo-color-primary-bg-hover)' }" />
  </Flex>
  <Flex style="margin-top: 20px">
    <div
      v-for="i in 4"
      :key="i"
      :style="{ width: '25%', height: i % 2 ? '60px' : '40px', backgroundColor: i % 2 ? 'var(--apollo-color-primary)' : 'var(--apollo-color-primary-bg-hover)' }"
    />
  </Flex>
</template>
