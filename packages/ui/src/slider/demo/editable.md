---
order: 5
title:
  zh-CN: 可编辑节点
  en-US: Editable
---

`range.editable` 下可点击插入节点、Backspace/Delete 删除节点、拖拽删除；`minCount` / `maxCount` 限制数量。

```vue
<script setup lang="ts">
// 对齐 antd `editable.tsx`：`range.editable` 下可用键盘 Backspace/Delete 删节点、拖拽删除，
// 点击轨道可插入新节点（`minCount` / `maxCount` 限制把手数量）。
import { Slider } from '@apollo-design/ui';
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 16px">
    <Slider :default-value="[10, 50, 90]" :range="{ editable: true }" />
    <Slider :default-value="[10, 50]" :range="{ editable: true, minCount: 2, maxCount: 4 }" />
  </div>
</template>
```
