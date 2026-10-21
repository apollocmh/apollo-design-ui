<script setup lang="ts">
import type { TreeSelectDataNode } from '@apollo-design/ui';
import { Space, Tag, TreeSelect } from '@apollo-design/ui';
import { ref } from 'vue';

const value = ref<string>('leaf-1-1-1');

const treeData: TreeSelectDataNode[] = [
  {
    title: '研发中心',
    value: 'engineering',
    children: [
      {
        title: '前端组',
        value: 'frontend',
        children: [
          {
            title: '组件库',
            value: 'components',
            children: [
              { title: 'Button', value: 'leaf-1-1-1' },
              { title: 'Table', value: 'leaf-1-1-2' },
            ],
          },
          { title: '文档站', value: 'docs' },
        ],
      },
      { title: '后端组', value: 'backend' },
    ],
  },
  {
    title: '设计中心',
    value: 'design',
    children: [
      { title: '视觉组', value: 'visual' },
      { title: '交互组', value: 'interaction' },
    ],
  },
];
</script>

<template>
  <div>
    <Space :size="12" wrap style="margin-bottom: 16px">
      <Tag color="blue">treeDefaultExpandAll</Tag>
      <Tag>打开下拉后所有父节点默认展开</Tag>
    </Space>

    <TreeSelect
      v-model:value="value"
      :tree-data="treeData"
      tree-default-expand-all
      placeholder="所有节点默认展开"
      style="width: 280px"
    />
  </div>
</template>
