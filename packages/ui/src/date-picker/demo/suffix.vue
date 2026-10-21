<script setup lang="ts">
// 对齐 antd 的 demo/suffix.tsx：通过 suffixIcon 替换 / 隐藏面板图标。
import { CalendarOutlined, SmileOutlined } from '@apollo-design/icons';
import { DatePicker, Flex } from '@apollo-design/ui';
import { computed, h } from 'vue';

const calendarIcon = computed(() => h(CalendarOutlined));
const smileIcon = computed(() => h(SmileOutlined));
</script>

<template>
  <Flex vertical align="flex-start" gap="small">
    <DatePicker
      :suffix-icon="calendarIcon"
      placeholder="自定义日历图标"
      aria-label="自定义日历图标的日期选择器"
    />
    <DatePicker
      :suffix-icon="smileIcon"
      placeholder="自定义笑脸图标"
      aria-label="自定义笑脸图标的日期选择器"
    />
    <DatePicker
      :suffix-icon="null"
      placeholder="不显示后缀图标"
      aria-label="不显示后缀图标的日期选择器"
    />
  </Flex>
</template>
