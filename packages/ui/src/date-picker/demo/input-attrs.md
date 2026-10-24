---
order: 28
title:
  zh-CN: 标签与输入属性
  en-US: Labels and input attributes
---

用 `id` 与原生 `label for` 关联输入框，`aria-describedby` 关联说明。范围选择器使用对象 `id` 分别标记两端。`class/style/data-*` 仍作用于选择器根。

Associate native labels with inputs using `id` and `label for`, and descriptions using `aria-describedby`. Object ids identify each range endpoint. `class/style/data-*` still target the selector root.

```vue
<script setup lang="ts">
import { DatePicker, Flex, RangePicker } from '@apollo-design/ui';
</script>

<template>
  <Flex gap="small" vertical align="flex-start">
    <label for="demo-date-input">日期 / Date</label>
    <DatePicker id="demo-date-input" name="date" aria-describedby="demo-date-hint" required />
    <span id="demo-date-hint">选择日期，也可以使用键盘输入。 / Pick or type a date.</span>
    <label for="demo-range-start">开始日期 / Start date</label>
    <label for="demo-range-end">结束日期 / End date</label>
    <RangePicker :id="{ start: 'demo-range-start', end: 'demo-range-end' }" />
  </Flex>
</template>
```
