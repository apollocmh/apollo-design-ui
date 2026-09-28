---
order: 4
title:
  zh-CN: 自定义指示器
  en-US: Custom indicator
---

## zh-CN

通过 `#indicators` 插槽（对应 `indicatorsRender`）自定义指示器。

## en-US

Custom the indicators with `#indicators` slot (mapped to `indicatorsRender`).

```vue
<script setup lang="ts">
import { Button, Divider, Space, Tour } from '@apollo-design/ui';
import { ref } from 'vue';

const open = ref(false);
const steps = [/* 与 basic 相同 */];
</script>

<template>
  <Button type="primary" @click="open = true">Begin Tour</Button>
  <Divider />
  <Space>
    <Button ref="ref1">Upload</Button>
    <Button ref="ref2" type="primary">Save</Button>
    <Button ref="ref3">...</Button>
  </Space>
  <Tour :open="open" :steps="steps" @close="open = false">
    <template #indicators="{ current, total }">
      <span>{{ current + 1 }} / {{ total }}</span>
    </template>
  </Tour>
</template>
```
