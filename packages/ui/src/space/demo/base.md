---
order: 0
title:
  zh-CN: 基础用法
  en-US: Basic
---

相邻组件水平间距。

```vue
<script setup lang="ts">
import { Space } from '@apollo-design/ui';
import { BTN_PRIMARY, BTN_TEXT } from './_standin';
</script>

<template>
  <Space>
    Space
    <button type="button" :style="BTN_PRIMARY">Button</button>
    <button type="button" :style="BTN_TEXT">Upload</button>
    <button type="button" :style="BTN_TEXT">Confirm</button>
  </Space>
</template>
```
