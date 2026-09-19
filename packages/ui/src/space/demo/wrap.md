---
order: 4
title:
  zh-CN: 自动换行
  en-US: Wrap
---

自动换行。`wrap` 只在水平方向有意义。

配合元组 `size`（`[横向, 纵向]`）可以分别控制「同一行内的间距」与「换行后的行距」。

```vue
<script setup lang="ts">
import { Space } from '@apollo-design/ui';
import { BTN_DEFAULT } from './_standin';
</script>

<template>
  <Space :size="[8, 16]" wrap>
    <button v-for="i in 20" :key="i" type="button" :style="BTN_DEFAULT">Button</button>
  </Space>
</template>
```
