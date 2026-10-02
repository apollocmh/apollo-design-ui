---
order: 9
title:
  zh-CN: 校验状态
  en-US: Status
---

`status` 标记校验状态（`error` / `warning`），单值与范围都支持。

```vue
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
```
