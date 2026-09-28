<script setup lang="ts">
// 对齐 antd demo/placement.tsx：center（无 target 兜底）/ right / top
import { Button, Tour } from '@apollo-design/ui';
import { ref } from 'vue';

const open = ref(false);
const ref1 = ref<{ nativeElement: HTMLButtonElement | HTMLAnchorElement | null } | null>(null);

const target = () => (ref1.value?.nativeElement as HTMLElement) ?? null;

import type { TourStepProps } from '../interface';

const steps: TourStepProps[] = [
  {
    title: 'Center',
    description: 'Displayed in the center of screen.',
    target: null,
  },
  {
    title: 'Right',
    description: 'On the right of target.',
    placement: 'right',
    target,
  },
  {
    title: 'Top',
    description: 'On the top of target.',
    placement: 'top',
    target,
  },
];
</script>

<template>
  <Button ref="ref1" type="primary" @click="open = true">Begin Tour</Button>
  <Tour :open="open" :steps="steps" @close="open = false" />
</template>
