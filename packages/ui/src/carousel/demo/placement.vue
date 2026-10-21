<script setup lang="ts">
// 对齐 antd 6.6.4 的 `placement` demo：dotPlacement 四向切换。
import type { DotPlacement, SegmentedValue } from '@apollo-design/ui';
import { Carousel, Segmented, Text } from '@apollo-design/ui';
import { ref } from 'vue';

const dotPlacement = ref<DotPlacement>('bottom');
const current = ref(0);

const options: { label: string; value: DotPlacement }[] = [
  { label: 'Top', value: 'top' },
  { label: 'Bottom', value: 'bottom' },
  { label: 'Start', value: 'start' },
  { label: 'End', value: 'end' },
];

const onPlacementChange = (value: SegmentedValue) => {
  dotPlacement.value = value as DotPlacement;
};

const onAfterChange = (index: number) => {
  current.value = index;
};
</script>

<template>
  <div>
    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px">
      <Segmented :value="dotPlacement" :options="options" @change="onPlacementChange" />
      <Text type="secondary">current: {{ current }}</Text>
    </div>
    <Carousel :dot-placement="dotPlacement" style="height: 180px" @after-change="onAfterChange">
      <div><h3 style="height: 180px; color: #fff; line-height: 180px; text-align: center; background: #364d79">1</h3></div>
      <div><h3 style="height: 180px; color: #fff; line-height: 180px; text-align: center; background: #626c91">2</h3></div>
      <div><h3 style="height: 180px; color: #fff; line-height: 180px; text-align: center; background: #1677ff">3</h3></div>
    </Carousel>
  </div>
</template>
