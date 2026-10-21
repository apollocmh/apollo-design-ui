<script setup lang="ts">
// 对齐 antd 的 demo/min-max-date.tsx：可选区间 [今天-7, 今天+7]
import { DatePicker, Flex } from '@apollo-design/ui';
import dayjs from 'dayjs';

const minDate = dayjs().subtract(7, 'day');
const maxDate = dayjs().add(7, 'day');
</script>

<template>
  <Flex vertical align="flex-start" gap="small">
    <DatePicker :min-date="minDate" :max-date="maxDate" placeholder="今天前后 7 天" />
    <div class="demo-hint">
      可选范围：{{ minDate.format('YYYY-MM-DD') }} ~ {{ maxDate.format('YYYY-MM-DD') }}
    </div>
  </Flex>
</template>
