---
order: 1
title:
  zh-CN: 尺寸
  en-US: Size
---

`size` 取 `small` / `large` 时会在根元素上追加 `-sm` / `-lg`，
加载图标的大小由 Component Token 的 `dotSizeSM` / `dotSize` / `dotSizeLG` 决定。

`medium` / `middle` 是默认尺寸（不追加类名），`default` 是 `medium` 的旧写法且已废弃。

```vue
<script setup lang="ts">
import { Spin } from '@apollo-design/ui';

const rowStyle = { display: 'flex', alignItems: 'center', gap: '16px' };
</script>

<template>
  <div :style="rowStyle">
    <Spin size="small" />
    <Spin />
    <Spin size="large" />
  </div>
</template>
```
