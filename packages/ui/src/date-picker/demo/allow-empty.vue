<script setup lang="ts">
// 对齐 antd 的 demo/allow-empty.tsx
import { DatePicker } from '@apollo-design/ui';
</script>

<template>
  <DatePicker.RangePicker
    :allow-empty="[true, false]"
    :placeholder="['开始日期（可空）', '结束日期（必填）']"
  />
</template>
