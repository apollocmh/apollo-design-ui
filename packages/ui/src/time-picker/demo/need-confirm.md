---
order: 6
title:
  zh-CN: 需要确认
  en-US: Need confirm
---

`needConfirm` ⇒ 需要点「确定」才提交。

```vue
<script setup lang="ts">
// 对齐 antd 的 need-confirm demo。
import { TimePicker } from '@apollo-design/ui';
import type { TimePickerEmits } from '@apollo-design/ui';

const onChange: TimePickerEmits['change'] = (time, timeString) => {
  console.log(time, timeString);
};
</script>

<template>
  <TimePicker :need-confirm="true" @change="onChange" />
</template>
```
