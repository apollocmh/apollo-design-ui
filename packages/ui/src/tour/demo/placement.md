---
order: 5
title:
  zh-CN: 位置
  en-US: Placement
---

## zh-CN

第一个步骤没有 `target`，引导面板会居中显示；其余步骤用 `placement` 指定弹出位置。

## en-US

The first step has no `target`, so the panel is displayed in the center of the screen. Other steps use `placement`.

```vue
<script setup lang="ts">
import { Button, Tour } from '@apollo-design/ui';
import { ref } from 'vue';

const open = ref(false);
const ref1 = ref(null);
const target = () => (ref1.value?.nativeElement as HTMLElement) ?? null;

const steps = [
  { title: 'Center', description: 'Displayed in the center of screen.', target: null },
  { title: 'Right', description: 'On the right of target.', placement: 'right', target },
  { title: 'Top', description: 'On the top of target.', placement: 'top', target },
];
</script>

<template>
  <Button ref="ref1" type="primary" @click="open = true">Begin Tour</Button>
  <Tour :open="open" :steps="steps" @close="open = false" />
</template>
```
