<script setup lang="ts">
import { Button, Select, Space, Tag, TreeSelect } from '@apollo-design/ui';
import { ref } from 'vue';

type Placement = 'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight';

const placement = ref<Placement>('bottomLeft');
const open = ref(false);
const value = ref<string>();

const placementOptions: { value: Placement; label: string }[] = [
  { value: 'bottomLeft', label: 'bottomLeft' },
  { value: 'bottomRight', label: 'bottomRight' },
  { value: 'topLeft', label: 'topLeft' },
  { value: 'topRight', label: 'topRight' },
];

const treeData = [
  {
    title: '研发中心',
    value: 'engineering',
    children: [
      { title: '前端组', value: 'frontend' },
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

function onPlacementChange(next: unknown): void {
  placement.value = next as Placement;
}
</script>

<template>
  <div>
    <Space :size="12" wrap style="margin-bottom: 16px">
      <span>placement</span>
      <Select
        :value="placement"
        :options="placementOptions"
        style="width: 160px"
        @change="onPlacementChange"
      />
      <Button @click="open = true">打开浮层</Button>
      <Button @click="open = false">关闭浮层</Button>
      <Tag color="blue">{{ placement }}</Tag>
      <Tag>{{ open ? '浮层已打开' : '浮层已关闭' }}</Tag>
    </Space>

    <TreeSelect
      v-model:value="value"
      v-model:open="open"
      :placement="placement"
      :tree-data="treeData"
      tree-default-expand-all
      placeholder="切换浮层方位"
      style="width: 280px"
    />
  </div>
</template>
