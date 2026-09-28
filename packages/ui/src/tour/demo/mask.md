---
order: 1
title:
  zh-CN: 自定义蒙层
  en-US: Custom mask
---

## zh-CN

自定义蒙层样式。

## en-US

Custom mask style.

```vue
<script setup lang="ts">
import { EllipsisOutlined } from '@apollo-design/icons';
import { Button, Divider, Space, Tour } from '@apollo-design/ui';
import type { ComponentPublicInstance } from 'vue';
import { ref } from 'vue';

const open = ref(false);
const ref1 = ref<ComponentPublicInstance | null>(null);
const ref2 = ref<ComponentPublicInstance | null>(null);
const ref3 = ref<ComponentPublicInstance | null>(null);
const target1 = () => (ref1.value?.nativeElement as HTMLElement) ?? null;
const target2 = () => (ref2.value?.nativeElement as HTMLElement) ?? null;
const target3 = () => (ref3.value?.nativeElement as HTMLElement) ?? null;

const steps = [
  { title: 'Upload File', description: 'Put your files here.', target: target1 },
  {
    title: 'Save',
    description: 'Save your changes.',
    target: target2,
    mask: { style: { boxShadow: 'inset 0 0 15px #fff' }, color: 'rgba(40, 0, 255, .4)' },
  },
  { title: 'Other Actions', description: 'Click to see other actions.', target: target3, mask: false },
];
</script>

<template>
  <Button type="primary" @click="open = true">Begin Tour</Button>
  <Divider />
  <Space>
    <Button ref="ref1">Upload</Button>
    <Button ref="ref2" type="primary">Save</Button>
    <Button ref="ref3" :icon="EllipsisOutlined" />
  </Space>
  <Tour :open="open" :steps="steps" @close="open = false" />
</template>
```
