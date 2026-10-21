<script setup lang="ts">
import type { CollapseItemType, CollapseProps } from '@apollo-design/ui';
import { Collapse, Select, Space, Tag } from '@apollo-design/ui';
import { ref } from 'vue';

type CollapseSize = NonNullable<CollapseProps['size']>;

const size = ref<CollapseSize>('middle');

const sizeOptions: { value: CollapseSize; label: string }[] = [
  { value: 'small', label: 'small' },
  { value: 'middle', label: 'middle' },
  { value: 'large', label: 'large' },
];

const items: CollapseItemType[] = [
  {
    key: '1',
    label: '面板尺寸',
    children: '切换尺寸会同步改变标题区与内容区的内边距。',
  },
  {
    key: '2',
    label: '第二个面板',
    children: 'size 支持 small、middle、large 三种取值。',
  },
];

function onSizeChange(value: unknown): void {
  size.value = value as CollapseSize;
}
</script>

<template>
  <div>
    <Space :size="12" style="margin-bottom: 16px">
      <span>size</span>
      <Select
        aria-label="面板尺寸"
        :value="size"
        :options="sizeOptions"
        style="width: 140px"
        @change="onSizeChange"
      />
      <Tag color="blue">{{ size }}</Tag>
    </Space>

    <Collapse :items="items" :size="size" />
  </div>
</template>
