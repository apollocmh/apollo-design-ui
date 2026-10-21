<script setup lang="ts">
// 对齐 antd 的 demo/range-picker.tsx 的时间范围
import { DatePicker } from '@apollo-design/ui';
</script>

<template>
  <DatePicker.RangePicker
    show-time
    format="YYYY-MM-DD HH:mm"
    :placeholder="['开始时间', '结束时间']"
  />
</template>
