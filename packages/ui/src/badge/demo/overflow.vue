<script setup lang="ts">
// 对齐 antd 的 overflow demo
import { Badge } from '@apollo-design/ui';
</script>

<template>
  <Badge :count="99">
    <div style="width: 40px; height: 40px; background: #f0f0f0; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center" />
  </Badge>
  <Badge :count="100" :overflow-count="10">
    <div style="width: 40px; height: 40px; background: #f0f0f0; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center" />
  </Badge>
  <Badge :count="1000" :overflow-count="999">
    <div style="width: 40px; height: 40px; background: #f0f0f0; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center" />
  </Badge>
</template>
