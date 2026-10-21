<script setup lang="ts">
// 对齐 antd 的 status demo：下拉框切换校验态
import { Cascader, Flex, Select } from '@apollo-design/ui';
import { computed, ref } from 'vue';

type Status = 'default' | 'error' | 'warning';

const status = ref<Status>('default');

const statusOptions = [
  { value: 'default', label: 'default（正常）' },
  { value: 'error', label: 'error' },
  { value: 'warning', label: 'warning' },
];

const statusProp = computed(() => (status.value === 'default' ? undefined : status.value));

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

const onStatusChange = (value: unknown) => {
  status.value = value as Status;
};
</script>

<template>
  <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 16px">
    <span>status：</span>
    <Select
      :value="status"
      :options="statusOptions"
      style="width: 160px"
      @change="onStatusChange"
    />
  </div>
  <Flex gap="middle" wrap>
    <Cascader :status="statusProp" :options="options" placeholder="受控 status" />
    <Cascader disabled :options="options" placeholder="disabled" />
  </Flex>
  <p>当前状态：{{ status }}；`disabled` 会禁用整个选择器。</p>
</template>
