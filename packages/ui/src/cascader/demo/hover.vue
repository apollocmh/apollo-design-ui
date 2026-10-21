<script setup lang="ts">
// 对齐 antd 的 hover demo：expandTrigger 控制展开方式
import { Cascader, Select, Tag } from '@apollo-design/ui';
import { ref } from 'vue';

type ExpandTrigger = 'click' | 'hover';

const expandTrigger = ref<ExpandTrigger>('hover');

const triggerOptions: { value: ExpandTrigger; label: string }[] = [
  { value: 'click', label: '点击展开' },
  { value: 'hover', label: '悬停展开' },
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

function onTriggerChange(value: unknown): void {
  expandTrigger.value = value as ExpandTrigger;
}
</script>

<template>
  <div>
    <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 16px">
      <span>展开方式</span>
      <Select
        aria-label="展开触发方式"
        :value="expandTrigger"
        :options="triggerOptions"
        style="width: 150px"
        @change="onTriggerChange"
      />
      <Tag color="blue">
        {{ expandTrigger === 'hover' ? '鼠标移入列项即展开' : '点击列项展开' }}
      </Tag>
    </div>

    <Cascader :expand-trigger="expandTrigger" :options="options" placeholder="请选择地区" />

    <p style="margin-bottom: 0">
      `expandTrigger="hover"` 时指针悬停父级选项会展开下一列；切换为 `click` 后需要点击展开。
    </p>
  </div>
</template>
