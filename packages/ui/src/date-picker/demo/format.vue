<script setup lang="ts">
// 对齐 antd 的 demo/format.tsx
import { DatePicker, Flex } from '@apollo-design/ui';
</script>

<template>
  <Flex vertical align="flex-start" gap="small">
    <DatePicker format="DD/MM/YYYY" placeholder="DD/MM/YYYY" />
    <DatePicker format="YYYY年MM月DD日" placeholder="YYYY年MM月DD日" />
    <DatePicker.RangePicker
      :format="['YYYY-MM-DD', 'YYYY/MM/DD']"
      :placeholder="['开始日期', '结束日期']"
    />
  </Flex>
</template>
