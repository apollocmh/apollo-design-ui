<script setup lang="ts">
// 对齐 antd 的 basic demo（Avatar/Icon 用原生元素等价替换，缺口见 README §7）
import { Badge } from '@apollo-design/ui';
</script>

<template>
  <Badge :count="5">
    <div style="width: 40px; height: 40px; background: #f0f0f0; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center" />
  </Badge>
  <Badge :count="0" :show-zero="true">
    <div style="width: 40px; height: 40px; background: #f0f0f0; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center" />
  </Badge>
  <Badge>
    <div style="width: 40px; height: 40px; background: #f0f0f0; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center" />
  </Badge>
</template>
