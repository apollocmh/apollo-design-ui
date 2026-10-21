<script setup lang="ts">
// 对齐 antd 的 disabled-option demo
import { Cascader } from '@apollo-design/ui';
import { ref } from 'vue';

const options = [
  {
    value: 'zhejiang',
    label: '浙江（整省禁用）',
    disabled: true,
    children: [
      { value: 'hangzhou', label: '杭州' },
      { value: 'ningbo', label: '宁波' },
    ],
  },
  {
    value: 'jiangsu',
    label: '江苏',
    children: [
      {
        value: 'nanjing',
        label: '南京',
        children: [
          { value: 'zhonghuamen', label: '中华门（禁用）', disabled: true },
          { value: 'xuanwumen', label: '玄武门' },
        ],
      },
      { value: 'suzhou', label: '苏州' },
    ],
  },
];

const selected = ref('尚未选择');

const onChange = (value: unknown) => {
  selected.value = Array.isArray(value) ? value.join(' / ') : String(value ?? '');
};
</script>

<template>
  <Cascader :options="options" placeholder="浙江与中华门不可选" @change="onChange" />
  <p>当前选择：{{ selected }}</p>
</template>
