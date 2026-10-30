<script setup lang="ts">
// 对齐 antd 的多选勾选策略：SHOW_PARENT / SHOW_CHILD
import { CASCADER_SHOW_CHILD, CASCADER_SHOW_PARENT, Cascader, Tag } from '@apollo-design/ui';
import { computed, ref } from 'vue';
import type { CascaderOutputValue } from '../interface';

const parentValue = ref<CascaderOutputValue>([['zhejiang', 'hangzhou']]);
const childValue = ref<CascaderOutputValue>([['zhejiang', 'hangzhou']]);

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
    children: [
      { value: 'nanjing', label: '南京' },
      { value: 'suzhou', label: '苏州' },
    ],
  },
];

const parentDisplay = computed(() =>
  parentValue.value.length
    ? parentValue.value
        .map((path) => (Array.isArray(path) ? path.join(' / ') : String(path)))
        .join('；')
    : '尚未选择',
);
const childDisplay = computed(() =>
  childValue.value.length
    ? childValue.value
        .map((path) => (Array.isArray(path) ? path.join(' / ') : String(path)))
        .join('；')
    : '尚未选择',
);
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 20px">
    <div>
      <Tag color="blue">SHOW_PARENT</Tag>
      <Cascader
        v-model:value="parentValue"
        multiple
        :show-checked-strategy="CASCADER_SHOW_PARENT"
        :options="options"
        placeholder="选中子级后回填父级路径"
        style="margin-top: 8px"
      />
      <p style="margin-bottom: 0">回填值：{{ parentDisplay }}</p>
    </div>

    <div>
      <Tag color="green">SHOW_CHILD</Tag>
      <Cascader
        v-model:value="childValue"
        multiple
        :show-checked-strategy="CASCADER_SHOW_CHILD"
        :options="options"
        placeholder="选中子级后保留叶子路径"
        style="margin-top: 8px"
      />
      <p style="margin-bottom: 0">回填值：{{ childDisplay }}</p>
    </div>
  </div>
</template>
