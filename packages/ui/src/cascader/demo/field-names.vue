<script setup lang="ts">
// 对齐 antd 的 custom-field-names demo
import type { CascaderFieldNames } from '@apollo-design/ui';
import { Cascader } from '@apollo-design/ui';
import { ref } from 'vue';

const fieldNames: CascaderFieldNames = {
  label: 'name',
  value: 'id',
  children: 'items',
};

const options = [
  {
    id: 1,
    name: '浙江',
    items: [
      {
        id: 11,
        name: '杭州',
        items: [
          { id: 111, name: '西湖' },
          { id: 112, name: '灵隐寺' },
        ],
      },
      { id: 12, name: '宁波' },
    ],
  },
  {
    id: 2,
    name: '江苏',
    items: [{ id: 21, name: '南京' }],
  },
];

const selected = ref('尚未选择');

const onChange = (_value: unknown, selectedOptions: unknown) => {
  const path = Array.isArray(selectedOptions)
    ? (selectedOptions as Array<Record<string, unknown>>)
        .map((option) => String(option.name ?? ''))
        .join(' / ')
    : '';
  selected.value = path || '尚未选择';
};
</script>

<template>
  <Cascader
    :options="options"
    :field-names="fieldNames"
    placeholder="字段名为 name / id / items"
    @change="onChange"
  />
  <p>当前路径：{{ selected }}</p>
</template>
