---
order: 9
title:
  zh-CN: 自定义触发事件
  en-US: Custom Trigger Event
---

`trigger` 只有两档：`click`（默认）与 `hover`。

```vue
<script setup lang="ts">
// 对齐 antd 的 trigger-event demo：`trigger="hover"` 用悬停打开面板。
import { ColorPicker } from '@apollo-design/ui';
</script>

<template>
  <ColorPicker default-value="#1677ff" trigger="hover" />
</template>
```
