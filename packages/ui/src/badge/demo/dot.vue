<script setup lang="ts">
// 对齐 antd 的 dot demo

import { Badge, Space } from '@apollo-design/ui';
import { ref } from 'vue';

const count = ref(5);
</script>

<template>
  <Space wrap>
    <Badge :dot="true">
      <div style="width: 40px; height: 40px; background: #f0f0f0; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center">dot</div>
    </Badge>
    <Badge :dot="true" :count="count">
      <div style="width: 40px; height: 40px; background: #f0f0f0; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center">count</div>
    </Badge>
  </Space>
</template>
