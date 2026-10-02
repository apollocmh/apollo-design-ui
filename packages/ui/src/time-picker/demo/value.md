---
order: 12
title:
  zh-CN: 受控组件
  en-US: Under Control
---

受控用法：`v-model:value`。

```vue
<script setup lang="ts">
// 对齐 antd 的 value demo。
import { TimePicker } from '@apollo-design/ui';
import type { TimePickerValue } from '@apollo-design/ui';
import { ref } from 'vue';

const value = ref<TimePickerValue>(null);
</script>

<template>
  <TimePicker v-model:value="value" />
</template>
```
