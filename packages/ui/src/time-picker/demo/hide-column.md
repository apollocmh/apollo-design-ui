---
order: 5
title:
  zh-CN: 隐藏列
  en-US: Hide column
---

用 `format` 控制显示哪几列（`HH:mm` ⇒ 只有时与分）。

```vue
<script setup lang="ts">
// 对齐 antd 的 hide-column demo。
import { TimePicker } from '@apollo-design/ui';
import dayjs from 'dayjs';

const format = 'HH:mm';
const value = dayjs('12:08', format);
</script>

<template>
  <TimePicker :default-value="value" :format="format" />
</template>
```
