<script setup lang="ts">
// 对齐 antd 的 `placement` demo：用 Segmented 切换 FloatButtonGroup 的四个方位。
import { CommentOutlined, CustomerServiceOutlined } from '@apollo-design/icons';
import type { FloatButtonGroupPlacement, SegmentedValue } from '@apollo-design/ui';
import { FloatButton, FloatButtonGroup, Segmented } from '@apollo-design/ui';
import { ref } from 'vue';

const placement = ref<FloatButtonGroupPlacement>('right');

const options: { label: string; value: FloatButtonGroupPlacement }[] = [
  { label: 'Top', value: 'top' },
  { label: 'Right', value: 'right' },
  { label: 'Bottom', value: 'bottom' },
  { label: 'Left', value: 'left' },
];

const onPlacementChange = (value: SegmentedValue) => {
  placement.value = value as FloatButtonGroupPlacement;
};
</script>

<template>
  <div>
    <Segmented :value="placement" :options="options" @change="onPlacementChange" />
    <FloatButtonGroup :key="placement" :placement="placement" trigger="click" type="primary">
      <template #icon><CustomerServiceOutlined /></template>
      <FloatButton #icon><CommentOutlined /></FloatButton>
      <FloatButton tooltip="Settings" />
    </FloatButtonGroup>
  </div>
</template>
