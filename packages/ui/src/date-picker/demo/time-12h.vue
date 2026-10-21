<script setup lang="ts">
// 对齐 antd 的 demo/time.tsx（12 小时制）
import { DatePicker, Flex } from '@apollo-design/ui';
</script>

<template>
  <Flex vertical align="flex-start" gap="small">
    <DatePicker
      show-time
      use12-hours
      format="YYYY-MM-DD hh:mm:ss A"
      placeholder="12 小时制"
    />
    <DatePicker
      show-time
      :show-hour="true"
      :show-minute="true"
      :show-second="false"
      :hour-step="2"
      :minute-step="15"
      format="YYYY-MM-DD HH:mm"
      placeholder="步长：2 小时 / 15 分钟"
    />
  </Flex>
</template>
