<script setup lang="ts">
import { Button, Select, Space, Tooltip, type TooltipPlacement } from '@apollo-design/ui';
import { ref } from 'vue';

type ArrowMode = 'show' | 'hide' | 'center';
const arrowMode = ref<ArrowMode>('show');
const placement = ref<TooltipPlacement>('topLeft');
const placements: TooltipPlacement[] = [
  'topLeft',
  'top',
  'topRight',
  'leftTop',
  'left',
  'leftBottom',
  'rightTop',
  'right',
  'rightBottom',
  'bottomLeft',
  'bottom',
  'bottomRight',
];
const arrowOptions = [
  { value: 'show', label: 'Show Arrow' },
  { value: 'hide', label: 'Hide Arrow' },
  { value: 'center', label: 'Center Arrow' },
];
const arrowProp = () => {
  if (arrowMode.value === 'hide') return false;
  if (arrowMode.value === 'center') return { pointAtCenter: true };
  return true;
};
</script>

<template>
  <Space wrap :size="12">
    <Select v-model:value="arrowMode" :options="arrowOptions" aria-label="arrow mode" style="width: 160px" />
    <Select v-model:value="placement" :options="placements.map(value => ({ value, label: value }))" aria-label="placement" style="width: 150px" />
    <Tooltip :title="placement" :placement="placement" :arrow="arrowProp()">
      <Button>{{ placement }}</Button>
    </Tooltip>
  </Space>
</template>
