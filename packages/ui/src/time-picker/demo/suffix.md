---
order: 11
title:
  zh-CN: 前后缀
  en-US: Prefix and Suffix
---

`suffixIcon` 与 `prefix` 自定义前后缀；范围版也支持 `prefix`。

```vue
<script setup lang="ts">
// 对齐 antd 的 suffix demo。
import { SmileOutlined } from '@apollo-design/icons';
import { Space, TimePicker, TimeRangePicker } from '@apollo-design/ui';
import type { TimePickerEmits } from '@apollo-design/ui';

const onChange: TimePickerEmits['change'] = (time, timeString) => {
  console.log(time, timeString);
};
</script>

<template>
  <Space vertical :size="12">
    <TimePicker @change="onChange">
      <template #suffixIcon><SmileOutlined /></template>
    </TimePicker>
    <TimePicker>
      <template #prefix><SmileOutlined /></template>
    </TimePicker>
    <TimeRangePicker>
      <template #prefix><SmileOutlined /></template>
    </TimeRangePicker>
  </Space>
</template>
```
