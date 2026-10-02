---
order: 3
title:
  zh-CN: 自定义浮层样式
  en-US: Colored Popup
---

通过 `classNames.popup.root` 给浮层根加类名。

```vue
<script setup lang="ts">
// 对齐 antd 的 colored-popup demo。
import { TimePicker } from '@apollo-design/ui';
import type { TimePickerEmits } from '@apollo-design/ui';

const onChange: TimePickerEmits['change'] = (time, timeString) => {
  console.log(time, timeString);
};

const classNames = { popup: { root: 'myCustomClassName' } };
</script>

<template>
  <TimePicker :class-names="classNames" @change="onChange" />
</template>
```
