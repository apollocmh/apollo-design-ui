<script setup lang="ts">
// 对齐 antd 的 changeOnSelect demo
import { Cascader } from '@apollo-design/ui';

const options = [
  {
    value: 'zhejiang',
    label: '浙江',
    children: [{ value: 'hangzhou', label: '杭州' }],
  },
];
</script>

<template>
  <Cascader :options="options" change-on-select placeholder="选中即返回" />
</template>
