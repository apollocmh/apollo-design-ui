---
order: 4
title:
  zh-CN: 渲染触发器文本
  en-US: Render Trigger Text
---

showText 显示默认颜色文本；#showText 自定义内容，作用域提供当前 color。

```vue
<script setup lang="ts">
import { DownOutlined } from '@apollo-design/icons';
import { ColorPicker, Space } from '@apollo-design/ui';
import { ref } from 'vue';

const open = ref(false);
</script>

<template>
  <Space vertical>
    <ColorPicker default-value="#1677ff" show-text allow-clear />
    <ColorPicker default-value="#1677ff">
      <template #showText="{ color }">Custom Text ({{ color.toHexString() }})</template>
    </ColorPicker>
    <ColorPicker v-model:open="open" default-value="#1677ff">
      <template #showText><DownOutlined :rotate="open ? 180 : 0" /></template>
    </ColorPicker>
  </Space>
</template>
```
