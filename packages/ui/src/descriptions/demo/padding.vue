<script setup lang="ts">
// 对齐 antd 的 padding demo：用语义化 styles 覆盖单元格内边距
import { Descriptions, Select } from '@apollo-design/ui';
import { computed, ref } from 'vue';

type PaddingMode = 'default' | 'compact' | 'loose';

const padding = ref<PaddingMode>('default');

const paddingOptions = [
  { value: 'default', label: '默认' },
  { value: 'compact', label: '紧凑' },
  { value: 'loose', label: '宽松' },
];

const paddingMap: Record<PaddingMode, string | undefined> = {
  default: undefined,
  compact: '4px 8px',
  loose: '20px 28px',
};

const itemStyles = computed(() => {
  const value = paddingMap[padding.value];
  return value ? { label: { padding: value }, content: { padding: value } } : undefined;
});

const items = [
  { key: '1', label: '产品', children: '云数据库' },
  { key: '2', label: '计费方式', children: '预付费' },
  { key: '3', label: '到期时间', children: '2026-12-31' },
  { key: '4', label: '状态', children: '运行中' },
];

const onPaddingChange = (value: unknown) => {
  if (value === 'default' || value === 'compact' || value === 'loose') padding.value = value;
};
</script>

<template>
  <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 16px">
    <span>单元格 padding：</span>
    <Select
        aria-label="单元格内边距"
      :value="padding"
      :options="paddingOptions"
      style="width: 120px"
      @change="onPaddingChange"
    />
  </div>
  <Descriptions bordered :items="items" :styles="itemStyles" />
</template>
