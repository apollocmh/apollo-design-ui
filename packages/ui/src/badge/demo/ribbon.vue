<script setup lang="ts">
// 对齐 antd 的 ribbon demo（Card 用原生 div 等价替换）
import { Badge } from '@apollo-design/ui';
</script>

<template>
  <div style="position: relative; padding: 24px; background: #fff; border-radius: 4px; width: calc(100% - 8px)">
    <Badge.Ribbon text="Hippopotamus">
      <div style="height: 60px; background: #f0f0f0; border-radius: 4px" />
    </Badge.Ribbon>
    <Badge.Ribbon text="Hippopotamus" color="pink">
      <div style="height: 60px; background: #f0f0f0; border-radius: 4px; margin-top: 16px" />
    </Badge.Ribbon>
    <Badge.Ribbon text="Hippopotamus" color="red">
      <div style="height: 60px; background: #f0f0f0; border-radius: 4px; margin-top: 16px" />
    </Badge.Ribbon>
    <Badge.Ribbon text="start" placement="start" color="blue">
      <div style="height: 60px; background: #f0f0f0; border-radius: 4px; margin-top: 16px" />
    </Badge.Ribbon>
    <Badge.Ribbon text="#2db7f5" color="#2db7f5">
      <div style="height: 60px; background: #f0f0f0; border-radius: 4px; margin-top: 16px" />
    </Badge.Ribbon>
  </div>
</template>
