<script setup lang="ts">
// 对齐 antd 的 placement demo
import { Cascader, Select } from '@apollo-design/ui';
import { ref } from 'vue';

type Placement = 'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight';

const placement = ref<Placement>('bottomLeft');

const placementOptions = [
  { value: 'bottomLeft', label: 'bottomLeft' },
  { value: 'bottomRight', label: 'bottomRight' },
  { value: 'topLeft', label: 'topLeft' },
  { value: 'topRight', label: 'topRight' },
];

const options = [
  {
    value: 'zhejiang',
    label: '浙江',
    children: [
      { value: 'hangzhou', label: '杭州' },
      { value: 'ningbo', label: '宁波' },
    ],
  },
  {
    value: 'jiangsu',
    label: '江苏',
    children: [{ value: 'nanjing', label: '南京' }],
  },
];

const onPlacementChange = (value: unknown) => {
  placement.value = value as Placement;
};
</script>

<template>
  <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 16px">
    <span>placement：</span>
    <Select
      :value="placement"
      :options="placementOptions"
      style="width: 160px"
      @change="onPlacementChange"
    />
  </div>
  <Cascader :options="options" :placement="placement" placeholder="切换浮层方位" />
</template>
