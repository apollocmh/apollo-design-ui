---
order: 3
title:
  zh-CN: 自定义操作区
  en-US: Custom actions
---

## zh-CN

通过 `#actions` 插槽（对应 `actionsRender`）自定义操作区，`originNode` 是默认的「上一步 / 下一步」按钮组。

## en-US

Custom the actions with `#actions` slot (mapped to `actionsRender`). `originNode` is the default prev / next buttons group.

```vue
<script setup lang="ts">
import { Button, Divider, Space, Tour } from '@apollo-design/ui';
import { ref } from 'vue';

const open = ref(false);
const steps = [
  { title: 'Upload File', description: 'Put your files here.', target: target1 },
  { title: 'Save', description: 'Save your changes.', target: target2 },
  { title: 'Other Actions', description: 'Click to see other actions.', target: target3 },
];
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
    <template #actions="{ current, total, originNode }">
      <Button v-if="current !== total - 1" size="small" @click="open = false">Skip</Button>
      <component :is="() => originNode" />
    </template>
  </Tour>
</template>
```
