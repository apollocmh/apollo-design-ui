<script setup lang="ts">
import type { TreeSelectDataNode, TreeSelectValue } from '@apollo-design/ui';
import { Space, Tag, TreeSelect } from '@apollo-design/ui';
import { computed, ref } from 'vue';

const value = ref<TreeSelectValue>({
  value: 'leaf-1-1',
  label: '组件库',
});

const treeData: TreeSelectDataNode[] = [
  {
    title: '研发中心',
    value: 'engineering',
    children: [
      {
        title: '前端组',
        value: 'frontend',
        children: [
          { title: '组件库', value: 'leaf-1-1' },
          { title: '文档站', value: 'leaf-1-2' },
        ],
      },
      { title: '后端组', value: 'backend' },
    ],
  },
];

const selectedInfo = computed(() => {
  const current = value.value;
  if (!current || typeof current !== 'object' || Array.isArray(current)) return '未选择';
  return `value: ${String(current.value)} · label: ${String(current.label)}`;
});
</script>

<template>
  <div>
    <Space :size="12" wrap style="margin-bottom: 16px">
      <Tag color="blue">{{ selectedInfo }}</Tag>
      <Tag>labelInValue 会同时保留 value 与展示文案</Tag>
    </Space>

    <TreeSelect aria-label="Tree select: label in value"
      v-model:value="value"
      :tree-data="treeData"
      label-in-value
      tree-default-expand-all
      allow-clear
      placeholder="请选择节点"
      style="width: 280px"
    />
  </div>
</template>
