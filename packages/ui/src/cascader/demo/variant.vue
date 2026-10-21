<script setup lang="ts">
// 对齐 antd 的 variant demo：outlined / borderless / filled
import { Cascader, Select, Tag } from '@apollo-design/ui';
import { ref } from 'vue';

type Variant = 'outlined' | 'borderless' | 'filled';

const variant = ref<Variant>('outlined');

const variantOptions: { value: Variant; label: string }[] = [
  { value: 'outlined', label: 'outlined' },
  { value: 'borderless', label: 'borderless' },
  { value: 'filled', label: 'filled' },
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

function onVariantChange(value: unknown): void {
  variant.value = value as Variant;
}
</script>

<template>
  <div>
    <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 16px">
      <span>输入框变体</span>
      <Select
        aria-label="输入框变体"
        :value="variant"
        :options="variantOptions"
        style="width: 150px"
        @change="onVariantChange"
      />
      <Tag color="blue">{{ variant }}</Tag>
    </div>

    <Cascader :variant="variant" :options="options" placeholder="请选择地区" />

    <p style="margin-bottom: 0">切换选择器样式：描边、无边框或填充背景。</p>
  </div>
</template>
