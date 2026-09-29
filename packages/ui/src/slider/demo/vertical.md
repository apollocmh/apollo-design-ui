---
order: 2
title:
  zh-CN: 垂直
  en-US: Vertical
---

`orientation="vertical"` 纵向滑动（旧写法 `vertical` 仍可用但会在开发期告警）。

```vue
<script setup lang="ts">
// 对齐 antd `vertical.tsx`：`orientation="vertical"`（旧的 `vertical` 仍可用但已废弃）。
import { Slider } from '@apollo-design/ui';

const marks = { 0: '0°C', 26: '26°C', 37: '37°C', 100: '100°C' };
</script>

<template>
  <div style="height: 300px; display: flex; justify-content: center">
    <Slider orientation="vertical" :default-value="37" :marks="marks" />
  </div>
</template>
```
