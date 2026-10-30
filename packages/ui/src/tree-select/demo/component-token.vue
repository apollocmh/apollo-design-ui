<script setup lang="ts">
import type { TreeSelectDataNode, TreeSelectValue } from '@apollo-design/ui';
import { Select, Space, Tag, TreeSelect } from '@apollo-design/ui';
import { computed, ref } from 'vue';

const presets = [
  {
    value: 'default',
    label: '默认蓝',
    selectedBg: '#e6f4ff',
    selectedColor: '#1677ff',
    hoverBg: 'rgba(22, 119, 255, 0.08)',
    titleHeight: '24px',
  },
  {
    value: 'purple',
    label: '紫罗兰',
    selectedBg: '#f9f0ff',
    selectedColor: '#722ed1',
    hoverBg: 'rgba(114, 46, 209, 0.08)',
    titleHeight: '30px',
  },
  {
    value: 'green',
    label: '青绿色',
    selectedBg: '#f6ffed',
    selectedColor: '#389e0d',
    hoverBg: 'rgba(56, 158, 13, 0.08)',
    titleHeight: '36px',
  },
];

type PresetValue = (typeof presets)[number]['value'];

const preset = ref<PresetValue>('default');
const value = ref<TreeSelectValue>('leaf-1-1');

const currentPreset = computed(
  () =>
    presets.find((item) => item.value === preset.value) ?? (presets[0] as (typeof presets)[number]),
);

const popupStyle = computed(() => ({
  '--tree-select-demo-selected-bg': currentPreset.value.selectedBg,
  '--tree-select-demo-selected-color': currentPreset.value.selectedColor,
  '--tree-select-demo-hover-bg': currentPreset.value.hoverBg,
  '--tree-select-demo-title-height': currentPreset.value.titleHeight,
}));

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
  {
    title: '设计中心',
    value: 'design',
    children: [
      { title: '视觉组', value: 'visual' },
      { title: '交互组', value: 'interaction' },
    ],
  },
];

function onPresetChange(next: unknown): void {
  preset.value = next as PresetValue;
}
</script>

<template>
  <div>
    <Space :size="12" wrap style="margin-bottom: 16px">
      <span>树节点 Token</span>
      <Select aria-label="Tree node theme"
        :value="preset"
        :options="presets"
        style="width: 140px"
        @change="onPresetChange"
      />
      <Tag color="blue">titleHeight: {{ currentPreset.titleHeight }}</Tag>
      <Tag>选中背景: {{ currentPreset.selectedBg }}</Tag>
    </Space>

    <TreeSelect aria-label="Tree select: component token"
      v-model:value="value"
      :tree-data="treeData"
      :popup-style="popupStyle"
      :class-names="{ popup: { root: 'tree-select-token-demo-popup' } }"
      tree-default-expand-all
      placeholder="打开下拉查看节点样式"
      style="width: 280px"
    />
  </div>
</template>

<style>
.tree-select-token-demo-popup .apollo-tree-select {
  --apollo-tree-node-selected-bg: var(--tree-select-demo-selected-bg, #e6f4ff);
  --apollo-tree-node-selected-color: var(--tree-select-demo-selected-color, #1677ff);
  --apollo-tree-node-hover-bg: var(--tree-select-demo-hover-bg, rgba(0, 0, 0, 0.04));
  --apollo-tree-title-height: var(--tree-select-demo-title-height, 24px);
  --apollo-tree-switcher-size: var(--tree-select-demo-title-height, 24px);
  --apollo-tree-indent-size: var(--tree-select-demo-title-height, 24px);
}
</style>
