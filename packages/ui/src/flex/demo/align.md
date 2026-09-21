---
order: 1
title:
  zh-CN: 对齐方式
  en-US: Align
---

`justify` 控制主轴对齐、`align` 控制交叉轴对齐（Segmented 用原生 select 等价替换）。

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Flex } from '@apollo-design/ui';
import type { FlexAlign, FlexJustify } from '@apollo-design/ui';

const justify = ref<FlexJustify>('flex-start');
const align = ref<FlexAlign>('flex-start');
</script>

<template>
  <Flex gap="medium" align="start" vertical>
    <Flex :justify="justify" :align="align" style="width: 100%; height: 120px; border: 1px solid #40a9ff">
      <button type="button">Primary</button>
      <button type="button">Primary</button>
    </Flex>
  </Flex>
</template>
```
