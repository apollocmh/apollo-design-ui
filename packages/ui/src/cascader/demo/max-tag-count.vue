<script setup lang="ts">
// 对齐 antd 的 max-tag-count demo
import { Cascader } from '@apollo-design/ui';

const options = [
  {
    value: 'zhejiang',
    label: '浙江',
    children: [
      { value: 'hangzhou', label: '杭州' },
      { value: 'ningbo', label: '宁波' },
      { value: 'wenzhou', label: '温州' },
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
</script>

<template>
  <Cascader
    multiple
    :options="options"
    :max-tag-count="2"
    placeholder="最多显示 2 个标签"
    style="width: 100%"
  />
  <p>选中超过 2 项时折叠为「+ N ...」，移除标签后可继续选择。</p>
</template>
