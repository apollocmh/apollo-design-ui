---
order: 8
title:
  zh-CN: 提示格式化
  en-US: Tip formatter
---

`formatter` 定制 tooltip 文案；传 `null` 则永不显示。

```vue
<script setup lang="ts">
// 对齐 antd `tipFormatter.tsx`：`formatter` 定制提示文案；传 `null` 则**永不显示** tooltip。
import { Slider } from '@apollo-design/ui';

const formatter = (value?: number): string => `${value}%`;
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 16px">
    <Slider :default-value="30" :formatter="formatter" />
    <Slider :default-value="30" :formatter="null" />
  </div>
</template>
```
