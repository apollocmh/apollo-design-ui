<script setup lang="ts">
// 对齐 antd 的 shape demo
import { Segmented } from '@apollo-design/ui';
</script>

<template>
  <Segmented shape="round" :options="['Daily', 'Weekly', 'Monthly']" />
</template>
