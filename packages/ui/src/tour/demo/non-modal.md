---
order: 2
title:
  zh-CN: 非模态
  en-US: Non-modal
---

## zh-CN

使用 `mask=false` 可以将引导变为非模态，同时为了强调引导本身，建议与 `type="primary"` 组合使用。

## en-US

Use `mask=false` to make Tour non-modal. At the meantime it is recommended to use with `type="primary"` to emphasize the guide itself.

```vue
<script setup lang="ts">
// 对齐 antd demo/non-modal.tsx：mask=false + type="primary"
import { EllipsisOutlined } from '@apollo-design/icons';
import { Button, Divider, Space, Tour } from '@apollo-design/ui';
import { ref } from 'vue';

const open = ref(false);

const ref1 = ref<{ nativeElement: HTMLButtonElement | HTMLAnchorElement | null } | null>(null);
const ref2 = ref<{ nativeElement: HTMLButtonElement | HTMLAnchorElement | null } | null>(null);
const ref3 = ref<{ nativeElement: HTMLButtonElement | HTMLAnchorElement | null } | null>(null);

const target1 = () => ref1.value?.nativeElement;
const target2 = () => ref2.value?.nativeElement;
const target3 = () => ref3.value?.nativeElement;

const steps = [
  {
    title: 'Upload File',
    description: 'Put your files here.',
    target: target1,
  },
  {
    title: 'Save',
    description: 'Save your changes.',
    target: target2,
  },
  {
    title: 'Other Actions',
    description: 'Click to see other actions.',
    target: target3,
  },
];
</script>

<template>
  <Button type="primary" @click="open = true">Begin non-modal Tour</Button>
  <Divider />
  <Space wrap>
    <Button ref="ref1">Upload</Button>
    <Button ref="ref2" type="primary">Save</Button>
    <Button ref="ref3" :icon="EllipsisOutlined" />
  </Space>
  <Tour :open="open" :mask="false" type="primary" :steps="steps" @close="open = false">
    <template #cover="{ current }">
      <img
        v-if="current === 0"
        draggable="false"
        alt="tour.png"
        src="https://user-images.githubusercontent.com/5378891/197385811-55df8480-7ff4-44bd-9d43-a7dade598d70.png"
      />
    </template>
  </Tour>
</template>
```
