<script setup lang="ts">
// 对齐 antd 的 default-value demo：非受控默认值 + 重新挂载恢复
import { Button, Cascader, Space } from '@apollo-design/ui';
import { ref } from 'vue';

const options = [
  {
    value: 'zhejiang',
    label: '浙江',
    children: [
      {
        value: 'hangzhou',
        label: '杭州',
        children: [
          { value: 'xihu', label: '西湖' },
          { value: 'lingyin', label: '灵隐寺' },
        ],
      },
      { value: 'ningbo', label: '宁波' },
    ],
  },
  {
    value: 'jiangsu',
    label: '江苏',
    children: [{ value: 'nanjing', label: '南京' }],
  },
];

const resetKey = ref(0);
const selected = ref('浙江 / 杭州 / 西湖');

const onChange = (value: unknown) => {
  selected.value = Array.isArray(value) ? value.join(' / ') : String(value ?? '');
};

const reset = () => {
  resetKey.value += 1;
  selected.value = '浙江 / 杭州 / 西湖';
};
</script>

<template>
  <Space orientation="vertical" size="small">
    <Cascader
      :key="resetKey"
      :options="options"
      :default-value="['zhejiang', 'hangzhou', 'xihu']"
      @change="onChange"
    />
    <Space>
      <Button @click="reset">恢复默认值</Button>
      <span>当前：{{ selected }}</span>
    </Space>
  </Space>
</template>
