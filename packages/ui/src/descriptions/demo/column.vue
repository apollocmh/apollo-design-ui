<script setup lang="ts">
// 对齐 antd 的 column demo：下拉框切换列数
import { Descriptions, Select } from '@apollo-design/ui';
import { ref } from 'vue';

const column = ref(3);

const columnOptions = [1, 2, 3, 4].map((value) => ({ value, label: `${value} 列` }));

const items = [
  { key: '1', label: '产品', children: '云数据库' },
  { key: '2', label: '计费方式', children: '预付费' },
  { key: '3', label: '可用区', children: '华东 1' },
  { key: '4', label: '到期时间', children: '2026-12-31' },
  { key: '5', label: '实例规格', children: '4 核 8 GB' },
  { key: '6', label: '状态', children: '运行中' },
];

const onColumnChange = (value: unknown) => {
  column.value = Number(value);
};
</script>

<template>
  <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 16px">
    <span>column：</span>
    <Select
        aria-label="列数"
      :value="column"
      :options="columnOptions"
      style="width: 100px"
      @change="onColumnChange"
    />
  </div>
  <Descriptions bordered :column="column" :items="items" />
</template>
