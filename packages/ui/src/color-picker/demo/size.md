---
order: 1
title:
  zh-CN: 触发器尺寸大小
  en-US: Trigger Size
---

触发器有 `small` / 默认 / `large` 三档尺寸，可配合 `showText` 一起用。

```vue
<script setup lang="ts">
// 对齐 antd 的 size demo：触发器大 / 中 / 小三档（含 `showText` 两列）。
import { ColorPicker, Space } from '@apollo-design/ui';
</script>

<template>
  <Space>
    <Space vertical>
      <ColorPicker default-value="#1677ff" size="small" />
      <ColorPicker default-value="#1677ff" />
      <ColorPicker default-value="#1677ff" size="large" />
    </Space>
    <Space vertical>
      <ColorPicker default-value="#1677ff" size="small" show-text />
      <ColorPicker default-value="#1677ff" show-text />
      <ColorPicker default-value="#1677ff" size="large" show-text />
    </Space>
  </Space>
</template>
```
