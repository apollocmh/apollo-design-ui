---
order: 0
title:
  zh-CN: 基本
  en-US: Basic
---

五种选择粒度（日 / 周 / 月 / 季 / 年）由 `picker` 控制。

```vue
<script setup lang="ts">
// 对齐 antd 的 basic demo（5 个 picker 形态：date / week / month / quarter / year）。
import { DatePicker, Flex } from '@apollo-design/ui';
import type { SingleValue } from '@apollo-design/ui';

const onChange = (date: SingleValue, dateString: string | string[] | null) => {
  console.log(date, dateString);
};
</script>

<template>
  <Flex gap="small" vertical align="flex-start">
    <DatePicker @change="onChange" />
    <DatePicker picker="week" @change="onChange" />
    <DatePicker picker="month" @change="onChange" />
    <DatePicker picker="quarter" @change="onChange" />
    <DatePicker picker="year" @change="onChange" />
  </Flex>
</template>
```
