<script setup lang="ts">
// 对齐 antd demo/tooltip.tsx（tooltip 数据 prop；string / TooltipProps 对象）
import { FloatButton } from '@apollo-design/ui';
</script>

<template>
  <div>
    <FloatButton
      style="inset-block-end: 108px"
      :tooltip="{ title: 'Since 5.25.0+', color: 'blue', placement: 'top' }"
    />
    <FloatButton tooltip="Documents" />
  </div>
</template>
