---
order: 5
title:
  zh-CN: 禁用
  en-US: Disabled
---

`disabled` 禁用整个组件；触发器仍会渲染当前颜色。

```vue
<script setup lang="ts">
// 对齐 antd 的 disabled demo：禁用状态 + 展示文本。
import { ColorPicker } from '@apollo-design/ui';
</script>

<template>
  <ColorPicker default-value="#1677ff" show-text disabled />
</template>
```
