<script setup lang="ts">
// 对齐 antd 的 vertical demo
import { Segmented } from '@apollo-design/ui';
</script>

<template>
  <Segmented vertical :options="['Daily', 'Weekly', 'Monthly']" />
</template>
