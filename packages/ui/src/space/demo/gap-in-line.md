---
order: 12
title:
  zh-CN: 换行时的行距
  en-US: Gap In Line
---

把容器宽度从 310px 调到 307px，观察四个方块从「一行」变成「两行」时
横向间距（`column-gap`）与纵向间距（`row-gap`）各自如何生效。

⚠️ 蓝色是 `Space` 自己的背景、绿色是外层盒子的 `box-shadow` —— 用来把两层的边界分开。

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Space } from '@apollo-design/ui';

const singleCol = ref(false);

const box = { width: '150px', height: '100px', background: 'red' } as const;
</script>

<template>
  <label>
    <input v-model="singleCol" type="checkbox" />
    single column
  </label>
  <div :style="{ boxShadow: '0 0 5px green' }">
    <Space
      :style="{ width: singleCol ? '307px' : '310px', background: 'blue' }"
      :size="[8, 8]"
      wrap
    >
      <div :style="box" />
      <div :style="box" />
      <div :style="box" />
      <div :style="box" />
    </Space>
  </div>
</template>
```
