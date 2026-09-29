---
order: 12
title:
  zh-CN: 与数字输入框联动
  en-US: With input number
---

与 `InputNumber` 联动，两者共用同一个值。

```vue
<script setup lang="ts">
// 对齐 antd `slider-with-input-number.tsx`：与 InputNumber 联动（两者共用同一个值）。
import { ref } from 'vue';
import { InputNumber, Slider } from '@apollo-design/ui';

const value = ref(30);
</script>

<template>
  <div style="display: flex; align-items: center; gap: 16px">
    <Slider v-model:value="value" style="flex: 1" />
    <!-- ⚠️ 数值输入框必须自带可访问名（axe 的 label），Slider 的把手同理见 README/U13 -->
    <InputNumber v-model:value="value" aria-label="Value" />
  </div>
</template>
```
