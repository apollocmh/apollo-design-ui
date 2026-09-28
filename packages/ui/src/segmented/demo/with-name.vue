<script setup lang="ts">
// 对齐 antd 的 with-name demo
import { Segmented } from '@apollo-design/ui';
</script>

<template>
  <Segmented name="group" :options="['Daily', 'Weekly', 'Monthly']" />
</template>
