---
order: 15
title:
  zh-CN: Pure Render
  en-US: Pure Panel
---

静态展示实际面板；原生 attrs 作用于展示宿主，变化通过 Vue 事件通知。

```vue
<script setup lang="ts">
import type { ColorValueType } from '@apollo-design/ui';
import { ColorPickerPurePanel } from '@apollo-design/ui';
import { ref } from 'vue';

const color = ref<ColorValueType>('#1677ff');
</script>

<template>
  <div :style="{ paddingInlineStart: '100px' }">
    <ColorPickerPurePanel :color-picker-props="{ value: color }" @change="value => color = value" />
  </div>
</template>
```
