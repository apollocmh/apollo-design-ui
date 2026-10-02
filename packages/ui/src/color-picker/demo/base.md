---
order: 0
title:
  zh-CN: 基本
  en-US: Basic
---

最简单的用法：给一个 `defaultValue`，点击触发器即可取色。

```vue
<script setup lang="ts">
// 对齐 antd 的 base demo：最简用法。
import { ColorPicker } from '@apollo-design/ui';
</script>

<template>
  <ColorPicker default-value="#1677ff" />
</template>
```
