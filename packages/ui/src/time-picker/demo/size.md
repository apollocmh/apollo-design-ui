---
order: 8
title:
  zh-CN: 不同尺寸
  en-US: Size
---

三种尺寸：`large` / 默认 / `small`。

```vue
<script setup lang="ts">
// 对齐 antd 的 size demo。
import { Space, TimePicker } from '@apollo-design/ui';
import dayjs from 'dayjs';

const value = dayjs('12:08:23', 'HH:mm:ss');
</script>

<template>
  <Space wrap>
    <TimePicker :default-value="value" size="large" />
    <TimePicker :default-value="value" />
    <TimePicker :default-value="value" size="small" />
  </Space>
</template>
```
