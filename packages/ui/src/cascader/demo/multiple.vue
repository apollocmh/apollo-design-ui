<script setup lang="ts">
// 对齐 antd 的 multiple demo
import { Cascader } from '@apollo-design/ui';

const options = [
  {
    value: 'zhejiang',
    label: '浙江',
    children: [
      { value: 'hangzhou', label: '杭州', children: [{ value: 'xihu', label: '西湖' }] },
      { value: 'ningbo', label: '宁波' },
    ],
  },
  { value: 'jiangsu', label: '江苏', children: [{ value: 'nanjing', label: '南京' }] },
];
</script>

<template>
  <Cascader multiple :options="options" placeholder="请选择（可多选）" />
</template>
