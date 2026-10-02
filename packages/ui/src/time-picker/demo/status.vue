<script setup lang="ts">
// 对齐 antd 的 status demo。
import { Space, TimePicker, TimeRangePicker } from '@apollo-design/ui';
</script>

<template>
  <Space vertical>
    <TimePicker status="error" />
    <TimePicker status="warning" />
    <TimeRangePicker status="error" />
    <TimeRangePicker status="warning" />
  </Space>
</template>
