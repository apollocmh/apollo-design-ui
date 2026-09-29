---
order: 3
title:
  zh-CN: 改变页码大小
  en-US: Changer
---

`showSizeChanger` 切换每页条数；禁用态一并展示；`@show-size-change` 拿到旧页与新页大小。

```vue
<script setup lang="ts">
// 对齐 antd `changer.tsx`。
import { Pagination } from '@apollo-design/ui';

const onShowSizeChange = (current: number, size: number): void => {
  console.log(current, size);
};
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 12px">
    <Pagination
      show-size-changer
      :default-current="3"
      :total="500"
      @show-size-change="onShowSizeChange"
    />
    <Pagination
      show-size-changer
      :default-current="3"
      :total="500"
      disabled
      @show-size-change="onShowSizeChange"
    />
  </div>
</template>
```
