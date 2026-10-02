---
order: 0
title:
  zh-CN: 基本
  en-US: Basic
---

点击 `TimePicker`，然后可以在浮层中选择或者输入某一时间。

```vue
<script setup lang="ts">
// 对齐 antd 的 basic demo。
//
// ⚠️ 上游还传了 `defaultOpenValue`（把面板锚定到 `00:00:00`）—— 本仓的 `date-picker`
//    目前**忽略**它（README §5 第 7 条），所以这里刻意不写：写了也不会生效，
//    只会让 demo 显得在演示一个本仓没实现的能力。
import { TimePicker } from '@apollo-design/ui';
import type { TimePickerEmits } from '@apollo-design/ui';

const onChange: TimePickerEmits['change'] = (time, timeString) => {
  console.log(time, timeString);
};
</script>

<template>
  <TimePicker @change="onChange" />
</template>
```
