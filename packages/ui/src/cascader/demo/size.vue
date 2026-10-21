<script setup lang="ts">
// 对齐 antd 的 size demo
import { Cascader, Flex } from '@apollo-design/ui';
import { ref } from 'vue';

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

const selected = ref('尚未选择');

const onChange = (value: unknown) => {
  selected.value = Array.isArray(value) ? value.join(' / ') : String(value ?? '');
};
</script>

<template>
  <Flex gap="middle" align="center" wrap>
    <Cascader size="small" :options="options" placeholder="small" @change="onChange" />
    <Cascader size="middle" :options="options" placeholder="middle" @change="onChange" />
    <Cascader size="large" :options="options" placeholder="large" @change="onChange" />
  </Flex>
  <p>当前选择：{{ selected }}</p>
</template>
