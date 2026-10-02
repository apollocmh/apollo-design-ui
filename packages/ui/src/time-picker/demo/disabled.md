---
order: 4
title:
  zh-CN: 禁用
  en-US: Disabled
---

禁用状态。

```vue
<script setup lang="ts">
// 对齐 antd 的 disabled demo。
import { TimePicker } from '@apollo-design/ui';
import dayjs from 'dayjs';

const value = dayjs('12:08:23', 'HH:mm:ss');
</script>

<template>
  <TimePicker :default-value="value" disabled />
</template>
```
