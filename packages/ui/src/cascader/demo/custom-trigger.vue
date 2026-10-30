<script setup lang="ts">
// 对齐 antd 的 custom-trigger demo：默认插槽内容作为 raw trigger
import { EnvironmentOutlined } from '@apollo-design/icons';
import { Button, Cascader, Tag } from '@apollo-design/ui';
import { computed, ref } from 'vue';
import type { CascaderOutputValue } from '../interface';

const value = ref<CascaderOutputValue>(['zhejiang', 'hangzhou']);

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

const labels: Record<string, string> = {
  zhejiang: '浙江',
  hangzhou: '杭州',
  ningbo: '宁波',
  jiangsu: '江苏',
  nanjing: '南京',
};

const display = computed(() => {
  if (!value.value.length) return '请选择地区';
  return value.value.map((item) => labels[String(item)] ?? item).join(' / ');
});
</script>

<template>
  <div>
    <Cascader v-model:value="value" :options="options">
      <Button type="primary" ghost :icon="EnvironmentOutlined">{{ display }}</Button>
    </Cascader>

    <div style="margin-top: 16px">
      <Tag color="blue">当前选择</Tag>
      <span>{{ display }}</span>
    </div>

    <p style="margin-bottom: 0">
      默认插槽内容作为触发器；点击按钮展开级联面板，选择后按钮文字同步更新。
    </p>
  </div>
</template>
