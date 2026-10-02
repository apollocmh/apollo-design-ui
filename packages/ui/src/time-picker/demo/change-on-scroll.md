---
order: 2
title:
  zh-CN: 滚动即选
  en-US: Change on scroll
---

滚动时间列即改变值（`changeOnScroll`），配合 `needConfirm={false}` 立即提交。

```vue
<script setup lang="ts">
// 对齐 antd 的 change-on-scroll demo。
import { TimePicker } from '@apollo-design/ui';
import type { TimePickerEmits } from '@apollo-design/ui';

const onChange: TimePickerEmits['change'] = (time, timeString) => {
  console.log(time, timeString);
};
</script>

<template>
  <TimePicker :change-on-scroll="true" :need-confirm="false" @change="onChange" />
</template>
```
